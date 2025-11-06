import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { Env } from './types';
import { DefiAgent } from './DefiAgent';

const app = new Hono<{ Bindings: Env }>();

// Enable CORS for frontend
app.use('/*', cors());

// Health check
app.get('/health', (c) => {
  return c.json({ status: 'ok', service: 'DeFi Intelligence Agent' });
});

// Agent endpoints
app.all('/agent/:userId/*', async (c) => {
  const userId = c.req.param('userId');

  // Get or create agent instance for this user
  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId);

  // Forward request to agent
  return agent.fetch(c.req.raw);
});

// Convenience endpoint for chat without user ID in path
app.post('/chat', async (c) => {
  // Use a default user ID or get from auth header
  const userId = c.req.header('X-User-Id') || 'default';

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId);

  // Create a new request with the /chat path
  const url = new URL(c.req.url);
  url.pathname = '/chat';

  const newRequest = new Request(url.toString(), {
    method: 'POST',
    headers: c.req.raw.headers,
    body: c.req.raw.body
  });

  return agent.fetch(newRequest);
});

// WebSocket connection endpoint
app.get('/ws/:userId', async (c) => {
  const userId = c.req.param('userId');

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId);

  // Forward WebSocket upgrade to agent
  return agent.fetch(c.req.raw);
});

// API endpoints for direct tool access (bypassing LLM)
app.post('/api/wallets/add', async (c) => {
  const userId = c.req.header('X-User-Id') || 'default';
  const { walletAddress, alertPreferences, nickname } = await c.req.json();

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId) as unknown as DefiAgent;

  const result = await agent.addWalletToWatch(walletAddress, alertPreferences, nickname);
  return c.json(result);
});

app.get('/api/wallets', async (c) => {
  const userId = c.req.header('X-User-Id') || 'default';

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId) as unknown as DefiAgent;

  const wallets = await agent.listWatchedWallets();
  return c.json(wallets);
});

app.delete('/api/wallets/:address', async (c) => {
  const userId = c.req.header('X-User-Id') || 'default';
  const address = c.req.param('address');

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId) as unknown as DefiAgent;

  const result = await agent.removeWatchedWallet(address);
  return c.json(result);
});

app.get('/api/alerts', async (c) => {
  const userId = c.req.header('X-User-Id') || 'default';
  const limit = parseInt(c.req.query('limit') || '20');
  const unreadOnly = c.req.query('unreadOnly') === 'true';

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId) as unknown as DefiAgent;

  const alerts = await agent.getAlerts(limit, unreadOnly);
  return c.json(alerts);
});

app.post('/api/alerts/mark-read', async (c) => {
  const userId = c.req.header('X-User-Id') || 'default';
  const { alertIds, markAll } = await c.req.json();

  const agentId = c.env.DEFI_AGENT.idFromName(userId);
  const agent = c.env.DEFI_AGENT.get(agentId) as unknown as DefiAgent;

  const result = await agent.markAlertsRead(alertIds, markAll);
  return c.json(result);
});

// Serve static assets (React app)
app.get('/*', async (c) => {
  // This would serve the built React app
  // For now, return a simple HTML page
  return c.html(`
    <!DOCTYPE html>
    <html>
      <head>
        <title>DeFi Intelligence Agent</title>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1">
        <style>
          body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
            max-width: 800px;
            margin: 50px auto;
            padding: 20px;
            background: #0a0a0a;
            color: #e0e0e0;
          }
          h1 { color: #00d4ff; }
          .status { color: #00ff88; }
          code {
            background: #1a1a1a;
            padding: 2px 6px;
            border-radius: 3px;
            color: #00d4ff;
          }
          a { color: #00d4ff; text-decoration: none; }
          a:hover { text-decoration: underline; }
          .section {
            background: #1a1a1a;
            padding: 20px;
            margin: 20px 0;
            border-radius: 8px;
            border: 1px solid #333;
          }
        </style>
      </head>
      <body>
        <h1>🚀 DeFi Intelligence Agent</h1>
        <p class="status">✓ Service is running</p>

        <div class="section">
          <h2>Features</h2>
          <ul>
            <li>Monitor profitable wallets and get real-time trade alerts</li>
            <li>Analyze DeFi/NFT projects for risks and opportunities</li>
            <li>Detect scams with multi-layered analysis</li>
            <li>Discover high-potential projects matching your criteria</li>
          </ul>
        </div>

        <div class="section">
          <h2>API Endpoints</h2>
          <ul>
            <li><code>POST /chat</code> - Chat with the agent</li>
            <li><code>GET /ws/:userId</code> - WebSocket connection for real-time alerts</li>
            <li><code>POST /api/wallets/add</code> - Add wallet to monitoring</li>
            <li><code>GET /api/wallets</code> - List monitored wallets</li>
            <li><code>GET /api/alerts</code> - Get alerts</li>
          </ul>
        </div>

        <div class="section">
          <h2>Quick Start</h2>
          <p>Chat with the agent:</p>
          <pre><code>curl -X POST \\
  -H "Content-Type: application/json" \\
  -H "X-User-Id: your-user-id" \\
  -d '{"message": "Find me profitable NFT traders on Ethereum"}' \\
  https://your-worker.workers.dev/chat</code></pre>
        </div>

        <div class="section">
          <h2>Documentation</h2>
          <p>For full documentation, visit the <a href="https://github.com/your-repo">GitHub repository</a>.</p>
        </div>
      </body>
    </html>
  `);
});

export default app;
export { DefiAgent } from './DefiAgent';
