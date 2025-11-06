// Wallet profit analysis and tracking
import {
  Env,
  ProfitHistory,
  WalletProfile,
  WalletSearchCriteria,
  Transaction,
  BlockchainTransaction
} from '../agent/types';
import { BlockchainClient, DefiDataClient } from '../integrations/blockchain';

interface Trade {
  tokenAddress: string;
  tokenSymbol: string;
  buy?: {
    timestamp: number;
    amount: number;
    price: number;
    txHash: string;
  };
  sell?: {
    timestamp: number;
    amount: number;
    price: number;
    txHash: string;
  };
  profit?: number;
  roi?: number;
  isOpen: boolean;
}

export class WalletAnalyzer {
  private blockchain: BlockchainClient;
  private defiData: DefiDataClient;

  constructor(private env: Env) {
    this.blockchain = new BlockchainClient(env);
    this.defiData = new DefiDataClient(env);
  }

  /**
   * Calculate profit history for a wallet
   */
  async calculateProfitHistory(
    walletAddress: string,
    chain: string = 'ethereum'
  ): Promise<ProfitHistory> {
    const now = Date.now();
    const day = 24 * 60 * 60 * 1000;

    // Get all token transfers
    const transfers = await this.blockchain.getTokenTransfers(walletAddress, undefined, chain);
    const nftTransfers = await this.blockchain.getNFTTransfers(walletAddress, chain);

    // Analyze trades
    const tokenTrades = await this.analyzeTokenTrades(transfers, walletAddress);
    const nftTrades = await this.analyzeNFTTrades(nftTransfers, walletAddress);

    const allTrades = [...tokenTrades, ...nftTrades];

    // Calculate metrics
    const profitByPeriod = this.calculatePeriodProfits(allTrades, now);
    const winRate = this.calculateWinRate(allTrades);
    const avgPositionSize = this.calculateAvgPositionSize(allTrades);
    const roi = this.calculateROI(allTrades);

    return {
      total: profitByPeriod.all,
      last7d: profitByPeriod.week,
      last30d: profitByPeriod.month,
      last90d: profitByPeriod.quarter,
      trades: allTrades.filter(t => !t.isOpen).length,
      winRate,
      avgPositionSize,
      roi,
      lastUpdated: now
    };
  }

  /**
   * Analyze token trades from transfers
   */
  private async analyzeTokenTrades(
    transfers: any[],
    walletAddress: string
  ): Promise<Trade[]> {
    const trades: Map<string, Trade> = new Map();
    const wallet = walletAddress.toLowerCase();

    // Group transfers by token
    const transfersByToken: Map<string, any[]> = new Map();

    for (const transfer of transfers) {
      const tokenAddr = transfer.contractAddress.toLowerCase();
      if (!transfersByToken.has(tokenAddr)) {
        transfersByToken.set(tokenAddr, []);
      }
      transfersByToken.get(tokenAddr)!.push(transfer);
    }

    // Analyze each token's trades
    for (const [tokenAddr, tokenTransfers] of transfersByToken) {
      // Sort by timestamp
      tokenTransfers.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

      let position = 0;
      let totalCost = 0;

      for (const transfer of tokenTransfers) {
        const amount = parseFloat(transfer.value) / Math.pow(10, parseInt(transfer.tokenDecimal));
        const isBuy = transfer.to.toLowerCase() === wallet;

        if (isBuy) {
          // Buying
          position += amount;

          // Estimate cost (would need DEX data for accurate pricing)
          const price = await this.estimateTradePrice(transfer, 'buy');
          totalCost += amount * price;

          const tradeKey = `${tokenAddr}-${transfer.hash}`;
          trades.set(tradeKey, {
            tokenAddress: tokenAddr,
            tokenSymbol: transfer.tokenSymbol || 'UNKNOWN',
            buy: {
              timestamp: parseInt(transfer.timeStamp) * 1000,
              amount,
              price,
              txHash: transfer.hash
            },
            isOpen: true
          });
        } else {
          // Selling
          if (position > 0) {
            const price = await this.estimateTradePrice(transfer, 'sell');
            const sellValue = amount * price;
            const avgCost = totalCost / position;
            const profit = (price - avgCost) * Math.min(amount, position);
            const roi = ((price - avgCost) / avgCost) * 100;

            position -= amount;
            totalCost -= avgCost * Math.min(amount, position);

            const tradeKey = `${tokenAddr}-${transfer.hash}`;
            trades.set(tradeKey, {
              tokenAddress: tokenAddr,
              tokenSymbol: transfer.tokenSymbol || 'UNKNOWN',
              sell: {
                timestamp: parseInt(transfer.timeStamp) * 1000,
                amount,
                price,
                txHash: transfer.hash
              },
              profit,
              roi,
              isOpen: false
            });
          }
        }
      }
    }

    return Array.from(trades.values());
  }

  /**
   * Analyze NFT trades
   */
  private async analyzeNFTTrades(
    transfers: any[],
    walletAddress: string
  ): Promise<Trade[]> {
    const trades: Trade[] = [];
    const wallet = walletAddress.toLowerCase();

    // Group by NFT collection and token ID
    const nftsByToken: Map<string, any[]> = new Map();

    for (const transfer of transfers) {
      const key = `${transfer.contractAddress}-${transfer.tokenID}`;
      if (!nftsByToken.has(key)) {
        nftsByToken.set(key, []);
      }
      nftsByToken.get(key)!.push(transfer);
    }

    for (const [key, nftTransfers] of nftsByToken) {
      nftTransfers.sort((a, b) => parseInt(a.timeStamp) - parseInt(b.timeStamp));

      let buyPrice = 0;
      let buyTimestamp = 0;

      for (const transfer of nftTransfers) {
        const isBuy = transfer.to.toLowerCase() === wallet;

        if (isBuy) {
          // Estimate buy price from transaction value
          buyPrice = await this.estimateNFTPrice(transfer, 'buy');
          buyTimestamp = parseInt(transfer.timeStamp) * 1000;
        } else {
          // Selling
          if (buyPrice > 0) {
            const sellPrice = await this.estimateNFTPrice(transfer, 'sell');
            const profit = sellPrice - buyPrice;
            const roi = ((sellPrice - buyPrice) / buyPrice) * 100;

            trades.push({
              tokenAddress: transfer.contractAddress,
              tokenSymbol: transfer.tokenName || 'NFT',
              buy: {
                timestamp: buyTimestamp,
                amount: 1,
                price: buyPrice,
                txHash: transfer.hash
              },
              sell: {
                timestamp: parseInt(transfer.timeStamp) * 1000,
                amount: 1,
                price: sellPrice,
                txHash: transfer.hash
              },
              profit,
              roi,
              isOpen: false
            });

            buyPrice = 0;
          }
        }
      }
    }

    return trades;
  }

  /**
   * Estimate trade price (simplified - would need DEX integration)
   */
  private async estimateTradePrice(transfer: any, side: 'buy' | 'sell'): Promise<number> {
    // Try to get current price as approximation
    try {
      const price = await this.defiData.getTokenPrice(transfer.contractAddress);
      return price || 0;
    } catch {
      return 0;
    }
  }

  /**
   * Estimate NFT price from transaction
   */
  private async estimateNFTPrice(transfer: any, side: 'buy' | 'sell'): Promise<number> {
    // Would integrate with NFT marketplace APIs
    // For now, return 0
    return 0;
  }

  /**
   * Calculate profits by time period
   */
  private calculatePeriodProfits(
    trades: Trade[],
    now: number
  ): {
    all: number;
    week: number;
    month: number;
    quarter: number;
  } {
    const day = 24 * 60 * 60 * 1000;
    const week = 7 * day;
    const month = 30 * day;
    const quarter = 90 * day;

    let all = 0;
    let weekProfit = 0;
    let monthProfit = 0;
    let quarterProfit = 0;

    for (const trade of trades) {
      if (trade.profit && !trade.isOpen && trade.sell) {
        const age = now - trade.sell.timestamp;

        all += trade.profit;

        if (age <= week) weekProfit += trade.profit;
        if (age <= month) monthProfit += trade.profit;
        if (age <= quarter) quarterProfit += trade.profit;
      }
    }

    return {
      all,
      week: weekProfit,
      month: monthProfit,
      quarter: quarterProfit
    };
  }

  /**
   * Calculate win rate
   */
  private calculateWinRate(trades: Trade[]): number {
    const closedTrades = trades.filter(t => !t.isOpen && t.profit !== undefined);

    if (closedTrades.length === 0) return 0;

    const wins = closedTrades.filter(t => t.profit! > 0).length;

    return (wins / closedTrades.length) * 100;
  }

  /**
   * Calculate average position size
   */
  private calculateAvgPositionSize(trades: Trade[]): number {
    const positions = trades
      .filter(t => t.buy)
      .map(t => t.buy!.amount * t.buy!.price);

    if (positions.length === 0) return 0;

    return positions.reduce((sum, p) => sum + p, 0) / positions.length;
  }

  /**
   * Calculate ROI
   */
  private calculateROI(trades: Trade[]): number {
    const closedTrades = trades.filter(t => !t.isOpen && t.roi !== undefined);

    if (closedTrades.length === 0) return 0;

    const totalROI = closedTrades.reduce((sum, t) => sum + t.roi!, 0);

    return totalROI / closedTrades.length;
  }

  /**
   * Generate wallet profile with score
   */
  async generateWalletProfile(
    walletAddress: string,
    chain: string = 'ethereum'
  ): Promise<WalletProfile> {
    const profitHistory = await this.calculateProfitHistory(walletAddress, chain);

    // Determine specialization based on trade patterns
    const specialization = await this.determineSpecialization(walletAddress, chain);

    // Calculate risk profile
    const riskProfile = this.determineRiskProfile(profitHistory);

    // Calculate composite score
    const score = this.calculateWalletScore(profitHistory, specialization);

    // Get top tokens
    const topTokens = await this.getTopTokens(walletAddress, chain);

    // Get activity pattern
    const activityPattern = await this.analyzeActivityPattern(walletAddress, chain);

    return {
      address: walletAddress,
      profitHistory,
      specialization,
      topTokens,
      activityPattern,
      riskProfile,
      score
    };
  }

  /**
   * Determine wallet specialization
   */
  private async determineSpecialization(
    walletAddress: string,
    chain: string
  ): Promise<string> {
    const tokenTransfers = await this.blockchain.getTokenTransfers(walletAddress, undefined, chain);
    const nftTransfers = await this.blockchain.getNFTTransfers(walletAddress, chain);

    const tokenCount = tokenTransfers.length;
    const nftCount = nftTransfers.length;

    if (nftCount > tokenCount * 2) return 'NFT';
    if (tokenCount > nftCount * 2) return 'DEFI';

    return 'ALL';
  }

  /**
   * Determine risk profile
   */
  private determineRiskProfile(profitHistory: ProfitHistory): 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE' {
    const { avgPositionSize, roi, winRate } = profitHistory;

    // High position size + high ROI = aggressive
    if (avgPositionSize > 10000 && Math.abs(roi) > 50) {
      return 'AGGRESSIVE';
    }

    // Low position size + high win rate = conservative
    if (avgPositionSize < 1000 && winRate > 70) {
      return 'CONSERVATIVE';
    }

    return 'MODERATE';
  }

  /**
   * Calculate composite wallet score
   */
  private calculateWalletScore(
    profitHistory: ProfitHistory,
    specialization: string
  ): number {
    const { total, winRate, roi, trades } = profitHistory;

    // Weighted scoring
    const profitScore = Math.min((total / 100000) * 30, 30); // Max 30 points
    const winRateScore = (winRate / 100) * 30; // Max 30 points
    const roiScore = Math.min((Math.abs(roi) / 200) * 20, 20); // Max 20 points
    const activityScore = Math.min((trades / 100) * 20, 20); // Max 20 points

    return profitScore + winRateScore + roiScore + activityScore;
  }

  /**
   * Get top traded tokens
   */
  private async getTopTokens(
    walletAddress: string,
    chain: string
  ): Promise<{ symbol: string; trades: number; profit: number }[]> {
    const transfers = await this.blockchain.getTokenTransfers(walletAddress, undefined, chain);
    const trades = await this.analyzeTokenTrades(transfers, walletAddress);

    const tokenStats: Map<string, { trades: number; profit: number }> = new Map();

    for (const trade of trades) {
      if (!tokenStats.has(trade.tokenSymbol)) {
        tokenStats.set(trade.tokenSymbol, { trades: 0, profit: 0 });
      }

      const stats = tokenStats.get(trade.tokenSymbol)!;
      stats.trades++;
      stats.profit += trade.profit || 0;
    }

    return Array.from(tokenStats.entries())
      .map(([symbol, stats]) => ({ symbol, ...stats }))
      .sort((a, b) => b.profit - a.profit)
      .slice(0, 10);
  }

  /**
   * Analyze activity pattern
   */
  private async analyzeActivityPattern(
    walletAddress: string,
    chain: string
  ): Promise<{
    avgTxPerDay: number;
    mostActiveHours: number[];
  }> {
    const transfers = await this.blockchain.getTokenTransfers(walletAddress, undefined, chain);

    if (transfers.length === 0) {
      return {
        avgTxPerDay: 0,
        mostActiveHours: []
      };
    }

    // Calculate average tx per day
    const oldest = parseInt(transfers[transfers.length - 1].timeStamp);
    const newest = parseInt(transfers[0].timeStamp);
    const days = (newest - oldest) / (24 * 60 * 60);
    const avgTxPerDay = transfers.length / Math.max(days, 1);

    // Find most active hours
    const hourCounts: Map<number, number> = new Map();

    for (const transfer of transfers) {
      const date = new Date(parseInt(transfer.timeStamp) * 1000);
      const hour = date.getUTCHours();
      hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
    }

    const mostActiveHours = Array.from(hourCounts.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 3)
      .map(([hour]) => hour);

    return {
      avgTxPerDay,
      mostActiveHours
    };
  }

  /**
   * Search for profitable wallets based on criteria
   */
  async searchProfitableWallets(
    criteria: WalletSearchCriteria,
    limit: number = 10
  ): Promise<WalletProfile[]> {
    // Query cached wallet profiles from database
    const { DB } = this.env;

    let query = 'SELECT * FROM wallet_profiles WHERE 1=1';
    const params: any[] = [];

    if (criteria.minProfit) {
      const timeframeField = criteria.timeframe === '7d' ? 'profit_7d' :
                            criteria.timeframe === '30d' ? 'profit_30d' :
                            criteria.timeframe === '90d' ? 'profit_90d' :
                            'total_profit';

      query += ` AND ${timeframeField} >= ?`;
      params.push(criteria.minProfit);
    }

    if (criteria.minWinRate) {
      query += ' AND win_rate >= ?';
      params.push(criteria.minWinRate);
    }

    if (criteria.specialization && criteria.specialization !== 'ALL') {
      query += ' AND specialization = ?';
      params.push(criteria.specialization);
    }

    if (criteria.minTrades) {
      query += ' AND trade_count >= ?';
      params.push(criteria.minTrades);
    }

    query += ' ORDER BY score DESC LIMIT ?';
    params.push(limit);

    const results = await DB.prepare(query).bind(...params).all();

    return results.results.map(row => ({
      address: row.address as string,
      profitHistory: {
        total: row.total_profit as number,
        last7d: row.profit_7d as number,
        last30d: row.profit_30d as number,
        last90d: row.profit_90d as number,
        trades: row.trade_count as number,
        winRate: row.win_rate as number,
        avgPositionSize: row.avg_position_size as number,
        roi: row.roi as number,
        lastUpdated: row.last_analyzed as number
      },
      specialization: row.specialization as string,
      topTokens: [],
      activityPattern: {
        avgTxPerDay: 0,
        mostActiveHours: []
      },
      riskProfile: row.risk_profile as any,
      score: row.score as number
    }));
  }
}
