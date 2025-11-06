// Core type definitions for the DeFi Intelligence Agent

export interface Env {
  AI: Ai;
  VECTORIZE: VectorizeIndex;
  DEFI_AGENT: DurableObjectNamespace;
  WALLET_MONITOR: Workflow;
  DB: D1Database;
  ETHERSCAN_API_KEY: string;
  ALCHEMY_API_KEY: string;
  COINGECKO_API_KEY: string;
  DEFILLAMA_API_URL: string;
  BLOCKCHAIN_POLL_INTERVAL: string;
}

// Agent State
export interface AgentState {
  watchedWallets: Map<string, WalletMonitorConfig>;
  activeWorkflows: Map<string, string>; // wallet address -> workflow instance id
  projectCriteria: ProjectCriteria | null;
  unreadAlerts: number;
  lastSyncTimestamp: number;
  userId: string;
}

// Wallet Monitoring
export interface WalletMonitorConfig {
  address: string;
  addedAt: number;
  alertPreferences: AlertPreferences;
  profitHistory: ProfitHistory | null;
  lastChecked: number;
  nickname?: string;
}

export interface AlertPreferences {
  enabled: boolean;
  minTradeSize: number; // in USD
  specificTokens: string[]; // empty = all tokens
  alertTypes: AlertType[];
  deliveryMethods: ('in-app' | 'email' | 'webhook')[];
  webhookUrl?: string;
}

export type AlertType = 'NEW_BUY' | 'NEW_SELL' | 'LARGE_TRANSFER' | 'CONTRACT_INTERACTION' | 'PROFIT_TARGET';

export interface ProfitHistory {
  total: number; // total USD profit
  last7d: number;
  last30d: number;
  last90d: number;
  trades: number;
  winRate: number; // percentage
  avgPositionSize: number;
  roi: number; // percentage
  lastUpdated: number;
}

// Transaction & Alert Data
export interface Transaction {
  hash: string;
  from: string;
  to: string;
  value: string;
  timestamp: number;
  blockNumber: number;
  tokenAddress?: string;
  tokenSymbol?: string;
  tokenAmount?: string;
  gasUsed: string;
  gasPrice: string;
  method?: string;
  isNFT: boolean;
  nftTokenId?: string;
  dexRouter?: string;
}

export interface Alert {
  id?: number;
  walletAddress: string;
  transactionHash: string;
  timestamp: number;
  alertType: AlertType;
  details: AlertDetails;
  readStatus: boolean;
}

export interface AlertDetails {
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
}

// Project Analysis
export interface ProjectData {
  id: string;
  contractAddress: string;
  name: string;
  symbol?: string;
  chain: string;
  discoveredAt: number;
  description?: string;
  category?: string;
  website?: string;
  twitter?: string;
  telegram?: string;
  discord?: string;
  whitepaper?: string;
  github?: string;
}

export interface ProjectCriteria {
  marketCapRange?: {
    min: number;
    max: number;
  };
  liquidityMin?: number;
  chains?: string[];
  categories?: string[];
  teamRequirements?: {
    doxxed?: boolean;
    verified?: boolean;
    previousSuccess?: boolean;
  };
  minHolders?: number;
  maxTopHolderPercent?: number;
  excludeScamIndicators?: boolean;
}

export interface RiskScore {
  overall: number; // 0-100 (0 = highest risk, 100 = lowest risk)
  contractSafety: number;
  tokenomics: number;
  teamCredibility: number;
  communityHealth: number;
  liquidityRisk: number;
  redFlags: RedFlag[];
  warnings: string[];
  recommendation: 'AVOID' | 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' | 'SAFE';
  analysisTimestamp: number;
}

export interface RedFlag {
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  category: 'CONTRACT' | 'TOKENOMICS' | 'TEAM' | 'COMMUNITY' | 'LIQUIDITY';
  description: string;
  evidence?: string;
}

export interface ContractAnalysis {
  verified: boolean;
  isProxy: boolean;
  hasHoneypot: boolean;
  hasMintFunction: boolean;
  hasPauseFunction: boolean;
  hasBlacklist: boolean;
  hasWhitelist: boolean;
  buyTax: number;
  sellTax: number;
  ownershipRenounced: boolean;
  maxWalletLimit?: number;
  maxTxLimit?: number;
  lpLocked: boolean;
  lpLockDuration?: number;
  creatorAddress: string;
  creationTimestamp: number;
}

export interface TokenomicsAnalysis {
  totalSupply: string;
  circulatingSupply: string;
  topHolders: {
    address: string;
    balance: string;
    percentage: number;
  }[];
  holderCount: number;
  lpPairAddress?: string;
  lpTokens?: string;
  marketCap: number;
  fullyDilutedValue: number;
}

export interface TeamAnalysis {
  isDoxxed: boolean;
  members?: {
    name: string;
    role: string;
    linkedin?: string;
    twitter?: string;
    background?: string;
  }[];
  previousProjects?: string[];
  scamHistory: boolean;
}

export interface CommunityAnalysis {
  twitterFollowers: number;
  twitterEngagement: number;
  telegramMembers: number;
  discordMembers: number;
  holderGrowthRate: number;
  sentimentScore: number; // -1 to 1
  botActivity: number; // 0-100, higher = more bots
}

// Wallet Search & Discovery
export interface WalletSearchCriteria {
  minProfit?: number;
  timeframe?: '7d' | '30d' | '90d' | 'all';
  minWinRate?: number;
  chains?: string[];
  specialization?: 'NFT' | 'DEFI' | 'MEMECOIN' | 'ALL';
  minTrades?: number;
  excludeContracts?: boolean;
}

export interface WalletProfile {
  address: string;
  profitHistory: ProfitHistory;
  specialization: string;
  topTokens: {
    symbol: string;
    trades: number;
    profit: number;
  }[];
  activityPattern: {
    avgTxPerDay: number;
    mostActiveHours: number[];
  };
  riskProfile: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  score: number; // composite score
}

// LLM & Analysis
export interface LLMPrompt {
  system: string;
  user: string;
  context?: Record<string, any>;
}

export interface AnalysisResult {
  summary: string;
  keyPoints: string[];
  risks: string[];
  opportunities: string[];
  recommendation: string;
  confidence: number; // 0-100
  sources?: string[];
}

// User Preferences
export interface UserPreferences {
  userId: string;
  projectCriteria: ProjectCriteria | null;
  alertSettings: {
    enableInApp: boolean;
    enableEmail: boolean;
    email?: string;
    quietHours?: {
      start: number; // hour 0-23
      end: number;
    };
  };
  riskTolerance: 'CONSERVATIVE' | 'MODERATE' | 'AGGRESSIVE';
  favoriteChains: string[];
  blockedProjects: string[];
  notes?: string;
}

// WebSocket Messages
export interface WebSocketMessage {
  type: 'ALERT' | 'STATUS' | 'ANALYSIS_COMPLETE' | 'ERROR' | 'PING' | 'PONG';
  data?: any;
  timestamp: number;
}

// Workflow Parameters
export interface WalletMonitorParams {
  walletAddress: string;
  agentId: string;
  userId: string;
  checkInterval: number;
}

export interface ProjectScanParams {
  criteria: ProjectCriteria;
  agentId: string;
  userId: string;
}

// API Response types
export interface BlockchainTransaction {
  hash: string;
  blockNumber: string;
  timeStamp: string;
  from: string;
  to: string;
  value: string;
  gas: string;
  gasPrice: string;
  gasUsed: string;
  input: string;
  isError: string;
  methodId?: string;
  functionName?: string;
}

export interface TokenInfo {
  address: string;
  name: string;
  symbol: string;
  decimals: number;
  totalSupply: string;
  price?: number;
  priceChange24h?: number;
  volume24h?: number;
  marketCap?: number;
  holders?: number;
}

export interface NFTInfo {
  contract: string;
  tokenId: string;
  name: string;
  description?: string;
  imageUrl?: string;
  collection: string;
  owner: string;
  floorPrice?: number;
  lastSale?: {
    price: number;
    timestamp: number;
    marketplace: string;
  };
}

// Database Models
export interface DBWatchedWallet {
  address: string;
  added_at: number;
  alert_preferences: string; // JSON
  profit_history: string | null; // JSON
  last_checked: number;
  user_id: string;
  nickname?: string;
}

export interface DBProject {
  id: string;
  contract_address: string;
  name: string;
  chain: string;
  discovered_at: number;
  risk_score: string | null; // JSON
  analysis: string | null; // JSON
  user_rating: number | null;
  user_notes: string | null;
  user_id: string;
}

export interface DBAlert {
  id: number;
  wallet_address: string;
  transaction_hash: string;
  timestamp: number;
  alert_type: string;
  details: string; // JSON
  read_status: number; // 0 or 1
  user_id: string;
}

export interface DBUserPreferences {
  user_id: string;
  project_criteria: string | null; // JSON
  alert_settings: string; // JSON
  risk_tolerance: string;
  created_at: number;
  updated_at: number;
}
