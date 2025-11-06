// Frontend type definitions
export interface Alert {
  id: number;
  walletAddress: string;
  transactionHash: string;
  timestamp: number;
  alertType: 'NEW_BUY' | 'NEW_SELL' | 'LARGE_TRANSFER' | 'CONTRACT_INTERACTION' | 'PROFIT_TARGET';
  details: {
    token?: {
      address: string;
      symbol: string;
      name: string;
      amount: string;
      usdValue: number;
    };
    nft?: {
      collection: string;
      tokenId: string;
      marketplace: string;
      price: number;
    };
    action: 'BUY' | 'SELL' | 'TRANSFER' | 'SWAP' | 'INTERACT';
    platform: string;
    profitLoss?: number;
    notes?: string;
  };
  readStatus: boolean;
}

export interface WalletMonitor {
  address: string;
  nickname?: string;
  addedAt: number;
  lastChecked: number;
  alertPreferences: {
    enabled: boolean;
    minTradeSize: number;
    specificTokens: string[];
    alertTypes: string[];
  };
  profitHistory?: {
    total: number;
    last7d: number;
    last30d: number;
    last90d: number;
    trades: number;
    winRate: number;
    avgPositionSize: number;
    roi: number;
    lastUpdated: number;
  };
}

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: number;
  toolCalls?: Array<{
    tool: string;
    result: any;
  }>;
}

export interface WebSocketMessage {
  type: 'ALERT' | 'STATUS' | 'ANALYSIS_COMPLETE' | 'ERROR' | 'PING' | 'PONG';
  data?: any;
  timestamp: number;
}

export interface AppSettings {
  backendUrl: string;
  userId: string;
  autoConnect: boolean;
  soundEnabled: boolean;
  desktopNotifications: boolean;
}
