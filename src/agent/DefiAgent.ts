import { DurableObject } from 'cloudflare:workers';
import {
  Env,
  AgentState,
  WalletMonitorConfig,
  AlertPreferences,
  Alert,
  WalletSearchCriteria,
  WalletProfile,
  ProjectCriteria,
  RiskScore,
  ProjectData,
  UserPreferences,
  WebSocketMessage,
  WalletMonitorParams,
  ProfitHistory
} from './types';
import { tools, ToolName } from './tools';

export class DefiAgent extends DurableObject<Env> {
  private state: AgentState;
  private sql: SqlStorage;
  private userId: string;
  private sessions: Set<WebSocket>;

  constructor(ctx: DurableObjectState, env: Env) {
    super(ctx, env);
    this.sql = ctx.storage.sql;
    this.sessions = new Set();

    // Initialize default state
    this.state = {
      watchedWallets: new Map(),
      activeWorkflows: new Map(),
      projectCriteria: null,
      unreadAlerts: 0,
      lastSyncTimestamp: Date.now(),
      userId: ctx.id.toString() // Use DO ID as user ID for now
    };

    this.userId = ctx.id.toString();
  }

  async initialize() {
    // Load state from storage
    const storedState = await this.ctx.storage.get<AgentState>('agentState');
    if (storedState) {
      this.state = {
        ...storedState,
        watchedWallets: new Map(Object.entries(storedState.watchedWallets || {})),
        activeWorkflows: new Map(Object.entries(storedState.activeWorkflows || {}))
      };
    }

    // Load user preferences from database
    await this.loadUserPreferences();
  }

  private async loadUserPreferences() {
    try {
      const prefs = await this.env.DB.prepare(
        'SELECT * FROM user_preferences WHERE user_id = ?'
      ).bind(this.userId).first();

      if (prefs) {
        this.state.projectCriteria = prefs.project_criteria
          ? JSON.parse(prefs.project_criteria as string)
          : null;
      }
    } catch (error) {
      console.error('Error loading user preferences:', error);
    }
  }

  private async saveState() {
    const stateToSave = {
      ...this.state,
      watchedWallets: Object.fromEntries(this.state.watchedWallets),
      activeWorkflows: Object.fromEntries(this.state.activeWorkflows)
    };
    await this.ctx.storage.put('agentState', stateToSave);
  }

  private async broadcastToClients(message: WebSocketMessage) {
    const messageStr = JSON.stringify(message);
    for (const ws of this.sessions) {
      try {
        ws.send(messageStr);
      } catch (error) {
        console.error('Error broadcasting to client:', error);
        this.sessions.delete(ws);
      }
    }
  }

  async sendAlert(alert: Alert) {
    // Store alert in database
    const details = JSON.stringify(alert.details);
    await this.env.DB.prepare(
      `INSERT INTO alerts (user_id, wallet_address, transaction_hash, timestamp, alert_type, details, read_status)
       VALUES (?, ?, ?, ?, ?, ?, 0)`
    ).bind(
      this.userId,
      alert.walletAddress,
      alert.transactionHash,
      alert.timestamp,
      alert.alertType,
      details
    ).run();

    // Update unread count
    this.state.unreadAlerts++;
    await this.saveState();

    // Broadcast to connected clients
    await this.broadcastToClients({
      type: 'ALERT',
      data: alert,
      timestamp: Date.now()
    });
  }

  // WebSocket handling
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);

    // WebSocket upgrade
    if (request.headers.get('Upgrade') === 'websocket') {
      const pair = new WebSocketPair();
      const [client, server] = Object.values(pair);

      this.ctx.acceptWebSocket(server);
      this.sessions.add(server);

      // Send current state to newly connected client
      server.send(JSON.stringify({
        type: 'STATUS',
        data: {
          watchedWallets: this.state.watchedWallets.size,
          unreadAlerts: this.state.unreadAlerts,
          activeWorkflows: this.state.activeWorkflows.size
        },
        timestamp: Date.now()
      }));

      return new Response(null, { status: 101, webSocket: client });
    }

    // HTTP API endpoints
    if (url.pathname === '/chat') {
      return this.handleChat(request);
    }

    if (url.pathname === '/state') {
      return this.handleGetState();
    }

    return new Response('Not found', { status: 404 });
  }

  async webSocketMessage(ws: WebSocket, message: string | ArrayBuffer) {
    if (typeof message !== 'string') return;

    try {
      const data = JSON.parse(message);

      if (data.type === 'PING') {
        ws.send(JSON.stringify({ type: 'PONG', timestamp: Date.now() }));
      }
    } catch (error) {
      console.error('Error handling WebSocket message:', error);
    }
  }

  async webSocketClose(ws: WebSocket, code: number, reason: string, wasClean: boolean) {
    this.sessions.delete(ws);
  }

  private async handleGetState(): Promise<Response> {
    return new Response(JSON.stringify({
      watchedWallets: Array.from(this.state.watchedWallets.values()),
      unreadAlerts: this.state.unreadAlerts,
      projectCriteria: this.state.projectCriteria,
      activeWorkflows: this.state.activeWorkflows.size
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async handleChat(request: Request): Promise<Response> {
    const { message, tools: requestedTools } = await request.json<{
      message: string;
      tools?: string[];
    }>();

    // Use Llama 3.3 to process the message and determine which tools to call
    const systemPrompt = `You are a DeFi and NFT intelligence expert assistant. You help users:
- Monitor profitable wallets and copy their trades
- Discover and analyze new DeFi/NFT projects
- Identify scams and assess risk
- Find high-potential investment opportunities

You have access to various tools to help users. Analyze their request and call the appropriate tools to provide helpful, accurate information.

Always prioritize user safety - warn about risks and be conservative in recommendations.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: message }
      ],
      tools: Object.entries(tools).map(([name, tool]) => ({
        name,
        description: tool.description,
        parameters: tool.parameters
      })),
      stream: false
    });

    // Execute any tool calls requested by the LLM
    if (response.tool_calls && response.tool_calls.length > 0) {
      const toolResults = [];

      for (const toolCall of response.tool_calls) {
        const result = await this.executeTool(
          toolCall.function.name as ToolName,
          JSON.parse(toolCall.function.arguments)
        );
        toolResults.push({
          tool: toolCall.function.name,
          result
        });
      }

      // Get final response incorporating tool results
      const finalResponse = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: message },
          { role: 'assistant', content: response.response, tool_calls: response.tool_calls },
          ...toolResults.map(tr => ({
            role: 'tool' as const,
            content: JSON.stringify(tr.result),
            tool_call_id: tr.tool
          }))
        ],
        stream: false
      });

      return new Response(JSON.stringify({
        response: finalResponse.response,
        toolCalls: toolResults
      }), {
        headers: { 'Content-Type': 'application/json' }
      });
    }

    return new Response(JSON.stringify({
      response: response.response
    }), {
      headers: { 'Content-Type': 'application/json' }
    });
  }

  private async executeTool(toolName: ToolName, args: any): Promise<any> {
    switch (toolName) {
      case 'addWalletToWatch':
        return this.addWalletToWatch(args.walletAddress, args.alertPreferences, args.nickname);

      case 'removeWatchedWallet':
        return this.removeWatchedWallet(args.walletAddress);

      case 'listWatchedWallets':
        return this.listWatchedWallets(args.includeInactive);

      case 'getWalletProfitHistory':
        return this.getWalletProfitHistory(args.walletAddress, args.timeframe);

      case 'searchProfitableWallets':
        return this.searchProfitableWallets(args.criteria, args.limit);

      case 'analyzeProject':
        return this.analyzeProject(args.projectIdentifier, args.chain, args.deepAnalysis);

      case 'analyzeProjectRisk':
        return this.analyzeProjectRisk(args.projectIdentifier, args.chain);

      case 'getAlerts':
        return this.getAlerts(args.limit, args.unreadOnly, args.walletAddress, args.alertType);

      case 'markAlertsRead':
        return this.markAlertsRead(args.alertIds, args.markAll);

      case 'setProjectCriteria':
        return this.setProjectCriteria(args.criteria);

      case 'getUserPreferences':
        return this.getUserPreferences();

      case 'checkContractSafety':
        return this.checkContractSafety(args.contractAddress, args.chain);

      default:
        return { error: `Tool ${toolName} not yet implemented` };
    }
  }

  // Tool implementations
  async addWalletToWatch(
    walletAddress: string,
    alertPreferences: AlertPreferences,
    nickname?: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      // Validate wallet address format
      if (!/^0x[a-fA-F0-9]{40}$/.test(walletAddress)) {
        return { success: false, message: 'Invalid wallet address format' };
      }

      const config: WalletMonitorConfig = {
        address: walletAddress.toLowerCase(),
        addedAt: Date.now(),
        alertPreferences,
        profitHistory: null,
        lastChecked: 0,
        nickname
      };

      // Save to database
      const prefsJson = JSON.stringify(alertPreferences);
      await this.env.DB.prepare(
        `INSERT INTO watched_wallets (address, user_id, added_at, alert_preferences, last_checked, nickname)
         VALUES (?, ?, ?, ?, ?, ?)
         ON CONFLICT(address) DO UPDATE SET
         alert_preferences = excluded.alert_preferences,
         nickname = excluded.nickname,
         updated_at = unixepoch()`
      ).bind(
        config.address,
        this.userId,
        config.addedAt,
        prefsJson,
        config.lastChecked,
        nickname || null
      ).run();

      // Update state
      this.state.watchedWallets.set(walletAddress.toLowerCase(), config);
      await this.saveState();

      // Start monitoring workflow
      const workflowParams: WalletMonitorParams = {
        walletAddress: config.address,
        agentId: this.userId,
        userId: this.userId,
        checkInterval: parseInt(this.env.BLOCKCHAIN_POLL_INTERVAL || '60000')
      };

      // Note: Workflow instantiation would happen here
      // const instance = await this.env.WALLET_MONITOR.create({ params: workflowParams });
      // this.state.activeWorkflows.set(walletAddress, instance.id);

      return {
        success: true,
        message: `Now monitoring wallet ${nickname || walletAddress}. You'll receive alerts based on your preferences.`
      };
    } catch (error) {
      console.error('Error adding wallet:', error);
      return {
        success: false,
        message: `Failed to add wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async removeWatchedWallet(walletAddress: string): Promise<{ success: boolean; message: string }> {
    try {
      const address = walletAddress.toLowerCase();

      // Remove from database
      await this.env.DB.prepare(
        'DELETE FROM watched_wallets WHERE address = ? AND user_id = ?'
      ).bind(address, this.userId).run();

      // Stop workflow if active
      const workflowId = this.state.activeWorkflows.get(address);
      if (workflowId) {
        // Note: Workflow termination would happen here
        // await this.env.WALLET_MONITOR.get(workflowId).terminate();
        this.state.activeWorkflows.delete(address);
      }

      // Update state
      this.state.watchedWallets.delete(address);
      await this.saveState();

      return {
        success: true,
        message: `Stopped monitoring wallet ${walletAddress}`
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to remove wallet: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    }
  }

  async listWatchedWallets(includeInactive: boolean = false): Promise<WalletMonitorConfig[]> {
    try {
      const results = await this.env.DB.prepare(
        'SELECT * FROM watched_wallets WHERE user_id = ? ORDER BY added_at DESC'
      ).bind(this.userId).all();

      return results.results.map(row => ({
        address: row.address as string,
        addedAt: row.added_at as number,
        alertPreferences: JSON.parse(row.alert_preferences as string),
        profitHistory: row.profit_history ? JSON.parse(row.profit_history as string) : null,
        lastChecked: row.last_checked as number,
        nickname: row.nickname as string | undefined
      }));
    } catch (error) {
      console.error('Error listing wallets:', error);
      return [];
    }
  }

  async getWalletProfitHistory(
    walletAddress: string,
    timeframe: string
  ): Promise<ProfitHistory | null> {
    // This would integrate with the wallet analyzer
    // For now, return placeholder
    return {
      total: 0,
      last7d: 0,
      last30d: 0,
      last90d: 0,
      trades: 0,
      winRate: 0,
      avgPositionSize: 0,
      roi: 0,
      lastUpdated: Date.now()
    };
  }

  async searchProfitableWallets(
    criteria: WalletSearchCriteria,
    limit: number = 10
  ): Promise<WalletProfile[]> {
    // This would query the wallet_profiles table with filters
    // Placeholder for now
    return [];
  }

  async analyzeProject(
    projectIdentifier: string,
    chain: string = 'ethereum',
    deepAnalysis: boolean = true
  ): Promise<any> {
    // This would integrate with contract scanner and risk scorer
    // Placeholder for now
    return {
      message: 'Project analysis not yet implemented',
      projectIdentifier,
      chain
    };
  }

  async analyzeProjectRisk(
    projectIdentifier: string,
    chain: string = 'ethereum'
  ): Promise<RiskScore> {
    // This would integrate with risk scorer and scam detector
    // Placeholder for now
    return {
      overall: 50,
      contractSafety: 50,
      tokenomics: 50,
      teamCredibility: 50,
      communityHealth: 50,
      liquidityRisk: 50,
      redFlags: [],
      warnings: ['Analysis not yet implemented'],
      recommendation: 'MODERATE_RISK',
      analysisTimestamp: Date.now()
    };
  }

  async getAlerts(
    limit: number = 20,
    unreadOnly: boolean = false,
    walletAddress?: string,
    alertType?: string
  ): Promise<Alert[]> {
    try {
      let query = 'SELECT * FROM alerts WHERE user_id = ?';
      const params: any[] = [this.userId];

      if (unreadOnly) {
        query += ' AND read_status = 0';
      }
      if (walletAddress) {
        query += ' AND wallet_address = ?';
        params.push(walletAddress.toLowerCase());
      }
      if (alertType) {
        query += ' AND alert_type = ?';
        params.push(alertType);
      }

      query += ' ORDER BY timestamp DESC LIMIT ?';
      params.push(limit);

      const results = await this.env.DB.prepare(query).bind(...params).all();

      return results.results.map(row => ({
        id: row.id as number,
        walletAddress: row.wallet_address as string,
        transactionHash: row.transaction_hash as string,
        timestamp: row.timestamp as number,
        alertType: row.alert_type as any,
        details: JSON.parse(row.details as string),
        readStatus: row.read_status === 1
      }));
    } catch (error) {
      console.error('Error getting alerts:', error);
      return [];
    }
  }

  async markAlertsRead(alertIds?: number[], markAll: boolean = false): Promise<{ success: boolean }> {
    try {
      if (markAll) {
        await this.env.DB.prepare(
          'UPDATE alerts SET read_status = 1 WHERE user_id = ? AND read_status = 0'
        ).bind(this.userId).run();
        this.state.unreadAlerts = 0;
      } else if (alertIds && alertIds.length > 0) {
        const placeholders = alertIds.map(() => '?').join(',');
        await this.env.DB.prepare(
          `UPDATE alerts SET read_status = 1 WHERE id IN (${placeholders}) AND user_id = ?`
        ).bind(...alertIds, this.userId).run();

        // Update unread count
        const unread = await this.env.DB.prepare(
          'SELECT COUNT(*) as count FROM alerts WHERE user_id = ? AND read_status = 0'
        ).bind(this.userId).first();
        this.state.unreadAlerts = (unread?.count as number) || 0;
      }

      await this.saveState();
      return { success: true };
    } catch (error) {
      console.error('Error marking alerts read:', error);
      return { success: false };
    }
  }

  async setProjectCriteria(criteria: ProjectCriteria): Promise<{ success: boolean }> {
    try {
      const criteriaJson = JSON.stringify(criteria);

      await this.env.DB.prepare(
        `INSERT INTO user_preferences (user_id, project_criteria, alert_settings, risk_tolerance)
         VALUES (?, ?, '{}', 'MODERATE')
         ON CONFLICT(user_id) DO UPDATE SET
         project_criteria = excluded.project_criteria,
         updated_at = unixepoch()`
      ).bind(this.userId, criteriaJson).run();

      this.state.projectCriteria = criteria;
      await this.saveState();

      return { success: true };
    } catch (error) {
      console.error('Error setting project criteria:', error);
      return { success: false };
    }
  }

  async getUserPreferences(): Promise<UserPreferences | null> {
    try {
      const prefs = await this.env.DB.prepare(
        'SELECT * FROM user_preferences WHERE user_id = ?'
      ).bind(this.userId).first();

      if (!prefs) return null;

      return {
        userId: this.userId,
        projectCriteria: prefs.project_criteria ? JSON.parse(prefs.project_criteria as string) : null,
        alertSettings: JSON.parse(prefs.alert_settings as string),
        riskTolerance: prefs.risk_tolerance as any,
        favoriteChains: prefs.favorite_chains ? JSON.parse(prefs.favorite_chains as string) : [],
        blockedProjects: prefs.blocked_projects ? JSON.parse(prefs.blocked_projects as string) : []
      };
    } catch (error) {
      console.error('Error getting user preferences:', error);
      return null;
    }
  }

  async checkContractSafety(contractAddress: string, chain: string = 'ethereum'): Promise<any> {
    // This would integrate with contract scanner
    // Placeholder for now
    return {
      message: 'Contract safety check not yet implemented',
      contractAddress,
      chain
    };
  }
}
