import { WorkflowEntrypoint, WorkflowEvent, WorkflowStep } from 'cloudflare:workers';
import {
  Env,
  WalletMonitorParams,
  Alert,
  AlertType,
  AlertDetails,
  BlockchainTransaction
} from '../agent/types';
import { BlockchainClient, DefiDataClient } from '../integrations/blockchain';

interface MonitorState {
  lastCheckedBlock: number;
  lastTxHash: string | null;
  consecutiveErrors: number;
}

export class WalletMonitorWorkflow extends WorkflowEntrypoint<Env, WalletMonitorParams> {
  async run(event: WorkflowEvent<WalletMonitorParams>, step: WorkflowStep) {
    const { walletAddress, agentId, userId, checkInterval } = event.payload;

    console.log(`Starting wallet monitor for ${walletAddress}`);

    // Initialize state
    let state: MonitorState = {
      lastCheckedBlock: 0,
      lastTxHash: null,
      consecutiveErrors: 0
    };

    // Main monitoring loop
    while (true) {
      try {
        // Fetch new transactions
        const transactions = await step.do('fetch transactions', async () => {
          const blockchain = new BlockchainClient(this.env);

          // Get regular transactions
          const normalTxs = await blockchain.getWalletTransactions(
            walletAddress,
            'ethereum',
            state.lastCheckedBlock
          );

          // Get token transfers
          const tokenTxs = await blockchain.getTokenTransfers(walletAddress);

          // Get NFT transfers
          const nftTxs = await blockchain.getNFTTransfers(walletAddress);

          return {
            normal: normalTxs,
            tokens: tokenTxs,
            nfts: nftTxs
          };
        });

        // Process new transactions
        if (transactions.normal.length > 0 || transactions.tokens.length > 0 || transactions.nfts.length > 0) {
          await step.do('process transactions', async () => {
            // Process normal transactions
            for (const tx of transactions.normal) {
              if (state.lastTxHash && tx.hash === state.lastTxHash) {
                break; // Already processed
              }

              await this.processTransaction(tx, walletAddress, agentId, userId);

              // Update state
              state.lastCheckedBlock = Math.max(state.lastCheckedBlock, parseInt(tx.blockNumber));
              state.lastTxHash = tx.hash;
            }

            // Process token transfers
            for (const tx of transactions.tokens) {
              if (state.lastTxHash && tx.hash === state.lastTxHash) {
                break;
              }

              await this.processTokenTransfer(tx, walletAddress, agentId, userId);

              state.lastCheckedBlock = Math.max(state.lastCheckedBlock, parseInt(tx.blockNumber));
              state.lastTxHash = tx.hash;
            }

            // Process NFT transfers
            for (const tx of transactions.nfts) {
              if (state.lastTxHash && tx.hash === state.lastTxHash) {
                break;
              }

              await this.processNFTTransfer(tx, walletAddress, agentId, userId);

              state.lastCheckedBlock = Math.max(state.lastCheckedBlock, parseInt(tx.blockNumber));
              state.lastTxHash = tx.hash;
            }
          });
        }

        // Reset error counter on success
        state.consecutiveErrors = 0;

        // Wait before next check
        await step.sleep('wait for next check', checkInterval);

      } catch (error) {
        console.error(`Error monitoring wallet ${walletAddress}:`, error);
        state.consecutiveErrors++;

        // Implement exponential backoff
        const backoffTime = Math.min(checkInterval * Math.pow(2, state.consecutiveErrors), 300000); // Max 5 minutes

        await step.sleep('error backoff', backoffTime);

        // Stop after too many consecutive errors
        if (state.consecutiveErrors > 10) {
          console.error(`Too many errors monitoring ${walletAddress}, stopping workflow`);
          break;
        }
      }
    }
  }

  /**
   * Process a normal transaction
   */
  private async processTransaction(
    tx: BlockchainTransaction,
    walletAddress: string,
    agentId: string,
    userId: string
  ) {
    const wallet = walletAddress.toLowerCase();
    const isOutgoing = tx.from.toLowerCase() === wallet;

    // Detect large transfers
    const valueInEth = parseFloat(tx.value) / 1e18;

    if (valueInEth > 1) { // Alert on transfers > 1 ETH
      const alert: Alert = {
        walletAddress,
        transactionHash: tx.hash,
        timestamp: parseInt(tx.timeStamp) * 1000,
        alertType: 'LARGE_TRANSFER',
        details: {
          action: isOutgoing ? 'TRANSFER' : 'TRANSFER',
          platform: 'Ethereum',
          notes: `${isOutgoing ? 'Sent' : 'Received'} ${valueInEth.toFixed(4)} ETH`
        },
        readStatus: false
      };

      await this.sendAlert(alert, agentId);
    }

    // Detect contract interactions
    if (tx.input && tx.input !== '0x') {
      const alert: Alert = {
        walletAddress,
        transactionHash: tx.hash,
        timestamp: parseInt(tx.timeStamp) * 1000,
        alertType: 'CONTRACT_INTERACTION',
        details: {
          action: 'INTERACT',
          platform: tx.to,
          notes: `Interacted with contract: ${tx.functionName || 'Unknown function'}`
        },
        readStatus: false
      };

      await this.sendAlert(alert, agentId);
    }
  }

  /**
   * Process a token transfer
   */
  private async processTokenTransfer(
    tx: any,
    walletAddress: string,
    agentId: string,
    userId: string
  ) {
    const wallet = walletAddress.toLowerCase();
    const isBuy = tx.to.toLowerCase() === wallet;

    // Get wallet's alert preferences
    const preferences = await this.getAlertPreferences(walletAddress, userId);

    // Check if this token is in the filter list
    if (preferences.specificTokens.length > 0) {
      const tokenMatch = preferences.specificTokens.some(
        t => t.toLowerCase() === tx.contractAddress.toLowerCase()
      );
      if (!tokenMatch) return; // Skip this token
    }

    // Calculate USD value (simplified)
    const defiData = new DefiDataClient(this.env);
    const tokenPrice = await defiData.getTokenPrice(tx.contractAddress);
    const amount = parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal));
    const usdValue = amount * tokenPrice;

    // Check minimum trade size
    if (usdValue < preferences.minTradeSize) {
      return; // Below threshold
    }

    // Create alert
    const alertType: AlertType = isBuy ? 'NEW_BUY' : 'NEW_SELL';

    // Check if this alert type is enabled
    if (!preferences.alertTypes.includes(alertType)) {
      return;
    }

    const alert: Alert = {
      walletAddress,
      transactionHash: tx.hash,
      timestamp: parseInt(tx.timeStamp) * 1000,
      alertType,
      details: {
        token: {
          address: tx.contractAddress,
          symbol: tx.tokenSymbol,
          name: tx.tokenName,
          amount: amount.toString(),
          usdValue
        },
        action: isBuy ? 'BUY' : 'SELL',
        platform: 'DEX', // Would determine actual platform
        notes: `${isBuy ? 'Bought' : 'Sold'} ${amount.toFixed(4)} ${tx.tokenSymbol} (~$${usdValue.toFixed(2)})`
      },
      readStatus: false
    };

    await this.sendAlert(alert, agentId);
  }

  /**
   * Process an NFT transfer
   */
  private async processNFTTransfer(
    tx: any,
    walletAddress: string,
    agentId: string,
    userId: string
  ) {
    const wallet = walletAddress.toLowerCase();
    const isBuy = tx.to.toLowerCase() === wallet;

    // Get wallet's alert preferences
    const preferences = await this.getAlertPreferences(walletAddress, userId);

    const alertType: AlertType = isBuy ? 'NEW_BUY' : 'NEW_SELL';

    // Check if this alert type is enabled
    if (!preferences.alertTypes.includes(alertType)) {
      return;
    }

    // Estimate NFT price (would use marketplace APIs in production)
    const estimatedPrice = 0; // Placeholder

    const alert: Alert = {
      walletAddress,
      transactionHash: tx.hash,
      timestamp: parseInt(tx.timeStamp) * 1000,
      alertType,
      details: {
        nft: {
          collection: tx.tokenName,
          tokenId: tx.tokenID,
          marketplace: 'Unknown',
          price: estimatedPrice
        },
        action: isBuy ? 'BUY' : 'SELL',
        platform: 'NFT Marketplace',
        notes: `${isBuy ? 'Bought' : 'Sold'} ${tx.tokenName} #${tx.tokenID}`
      },
      readStatus: false
    };

    await this.sendAlert(alert, agentId);
  }

  /**
   * Send alert to the agent
   */
  private async sendAlert(alert: Alert, agentId: string) {
    try {
      // Get the agent instance
      const agent = this.env.DEFI_AGENT.idFromString(agentId);
      const stub = this.env.DEFI_AGENT.get(agent);

      // Send alert via HTTP request
      await stub.fetch('http://internal/alert', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(alert)
      });
    } catch (error) {
      console.error('Error sending alert:', error);
    }
  }

  /**
   * Get alert preferences for a wallet
   */
  private async getAlertPreferences(walletAddress: string, userId: string): Promise<{
    enabled: boolean;
    minTradeSize: number;
    specificTokens: string[];
    alertTypes: AlertType[];
  }> {
    try {
      const result = await this.env.DB.prepare(
        'SELECT alert_preferences FROM watched_wallets WHERE address = ? AND user_id = ?'
      ).bind(walletAddress.toLowerCase(), userId).first();

      if (result && result.alert_preferences) {
        return JSON.parse(result.alert_preferences as string);
      }
    } catch (error) {
      console.error('Error getting alert preferences:', error);
    }

    // Default preferences
    return {
      enabled: true,
      minTradeSize: 100,
      specificTokens: [],
      alertTypes: ['NEW_BUY', 'NEW_SELL', 'LARGE_TRANSFER', 'CONTRACT_INTERACTION']
    };
  }
}
