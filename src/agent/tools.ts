// Tool definitions for the DeFi Intelligence Agent
import { Tool } from '@cloudflare/agents';
import {
  WalletSearchCriteria,
  AlertPreferences,
  ProjectCriteria,
  RiskScore,
  WalletProfile,
  AnalysisResult,
  ProjectData
} from './types';

export const tools = {
  // Wallet Monitoring Tools
  addWalletToWatch: {
    description: 'Add a wallet address to the monitoring list to receive real-time alerts when it makes trades',
    parameters: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'The blockchain wallet address to monitor (must be a valid address)'
        },
        alertPreferences: {
          type: 'object',
          description: 'Alert configuration for this wallet',
          properties: {
            enabled: { type: 'boolean' },
            minTradeSize: { type: 'number', description: 'Minimum trade size in USD to alert on' },
            specificTokens: {
              type: 'array',
              items: { type: 'string' },
              description: 'Only alert for these specific tokens (empty = all)'
            },
            alertTypes: {
              type: 'array',
              items: {
                type: 'string',
                enum: ['NEW_BUY', 'NEW_SELL', 'LARGE_TRANSFER', 'CONTRACT_INTERACTION', 'PROFIT_TARGET']
              }
            }
          },
          required: ['enabled', 'minTradeSize', 'alertTypes']
        },
        nickname: {
          type: 'string',
          description: 'Optional nickname for this wallet'
        }
      },
      required: ['walletAddress', 'alertPreferences']
    }
  } as Tool,

  removeWatchedWallet: {
    description: 'Remove a wallet from the monitoring list and stop receiving alerts',
    parameters: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'The wallet address to stop monitoring'
        }
      },
      required: ['walletAddress']
    }
  } as Tool,

  listWatchedWallets: {
    description: 'Get a list of all currently monitored wallets with their statistics',
    parameters: {
      type: 'object',
      properties: {
        includeInactive: {
          type: 'boolean',
          description: 'Include wallets that have been inactive',
          default: false
        }
      }
    }
  } as Tool,

  getWalletProfitHistory: {
    description: 'Get detailed profit history and trading statistics for a specific wallet',
    parameters: {
      type: 'object',
      properties: {
        walletAddress: {
          type: 'string',
          description: 'The wallet address to analyze'
        },
        timeframe: {
          type: 'string',
          enum: ['7d', '30d', '90d', 'all'],
          description: 'Time period for profit calculation'
        }
      },
      required: ['walletAddress', 'timeframe']
    }
  } as Tool,

  searchProfitableWallets: {
    description: 'Search for profitable wallets matching specific criteria (e.g., high win rate, specific specialization)',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'object',
          properties: {
            minProfit: { type: 'number', description: 'Minimum profit in USD' },
            timeframe: {
              type: 'string',
              enum: ['7d', '30d', '90d', 'all']
            },
            minWinRate: { type: 'number', description: 'Minimum win rate percentage (0-100)' },
            chains: {
              type: 'array',
              items: { type: 'string' },
              description: 'Filter by blockchain networks'
            },
            specialization: {
              type: 'string',
              enum: ['NFT', 'DEFI', 'MEMECOIN', 'ALL']
            },
            minTrades: { type: 'number', description: 'Minimum number of trades' }
          }
        },
        limit: {
          type: 'number',
          description: 'Maximum number of wallets to return',
          default: 10
        }
      },
      required: ['criteria']
    }
  } as Tool,

  // Project Analysis Tools
  analyzeProject: {
    description: 'Perform comprehensive analysis of a DeFi/NFT project including risk assessment, tokenomics, and team evaluation',
    parameters: {
      type: 'object',
      properties: {
        projectIdentifier: {
          type: 'string',
          description: 'Contract address, project name, or project ID'
        },
        chain: {
          type: 'string',
          description: 'Blockchain network (ethereum, base, arbitrum, etc.)',
          default: 'ethereum'
        },
        deepAnalysis: {
          type: 'boolean',
          description: 'Perform deep analysis including LLM-powered insights',
          default: true
        }
      },
      required: ['projectIdentifier']
    }
  } as Tool,

  analyzeProjectRisk: {
    description: 'Get detailed risk score and red flags for a specific project to identify potential scams',
    parameters: {
      type: 'object',
      properties: {
        projectIdentifier: {
          type: 'string',
          description: 'Contract address or project ID'
        },
        chain: {
          type: 'string',
          default: 'ethereum'
        }
      },
      required: ['projectIdentifier']
    }
  } as Tool,

  compareProjects: {
    description: 'Compare multiple projects side-by-side across various metrics',
    parameters: {
      type: 'object',
      properties: {
        projectIds: {
          type: 'array',
          items: { type: 'string' },
          description: 'List of project IDs or contract addresses to compare'
        },
        metrics: {
          type: 'array',
          items: {
            type: 'string',
            enum: ['risk_score', 'market_cap', 'liquidity', 'team', 'community', 'all']
          },
          description: 'Specific metrics to compare'
        }
      },
      required: ['projectIds']
    }
  } as Tool,

  // Project Discovery Tools
  discoverNewProjects: {
    description: 'Scan for new projects matching user-defined criteria',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'object',
          description: 'Project discovery criteria',
          properties: {
            marketCapRange: {
              type: 'object',
              properties: {
                min: { type: 'number' },
                max: { type: 'number' }
              }
            },
            liquidityMin: { type: 'number' },
            chains: {
              type: 'array',
              items: { type: 'string' }
            },
            categories: {
              type: 'array',
              items: { type: 'string' }
            },
            excludeScamIndicators: { type: 'boolean', default: true }
          }
        },
        limit: {
          type: 'number',
          default: 10
        }
      }
    }
  } as Tool,

  getTopOpportunities: {
    description: 'Get curated list of high-potential projects based on AI analysis and market data',
    parameters: {
      type: 'object',
      properties: {
        count: {
          type: 'number',
          description: 'Number of opportunities to return',
          default: 5
        },
        userCriteria: {
          type: 'object',
          description: 'Optional user-specific criteria to filter opportunities'
        },
        timeframe: {
          type: 'string',
          enum: ['today', 'week', 'month'],
          default: 'week'
        }
      }
    }
  } as Tool,

  explainProjectPotential: {
    description: 'Generate detailed investment thesis explaining why a project shows promise',
    parameters: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID or contract address'
        }
      },
      required: ['projectId']
    }
  } as Tool,

  // Alert Management Tools
  getAlerts: {
    description: 'Retrieve recent alerts with optional filtering',
    parameters: {
      type: 'object',
      properties: {
        limit: {
          type: 'number',
          default: 20
        },
        unreadOnly: {
          type: 'boolean',
          default: false
        },
        walletAddress: {
          type: 'string',
          description: 'Filter by specific wallet'
        },
        alertType: {
          type: 'string',
          enum: ['NEW_BUY', 'NEW_SELL', 'LARGE_TRANSFER', 'CONTRACT_INTERACTION', 'PROFIT_TARGET']
        }
      }
    }
  } as Tool,

  markAlertsRead: {
    description: 'Mark one or more alerts as read',
    parameters: {
      type: 'object',
      properties: {
        alertIds: {
          type: 'array',
          items: { type: 'number' },
          description: 'Alert IDs to mark as read'
        },
        markAll: {
          type: 'boolean',
          description: 'Mark all alerts as read',
          default: false
        }
      }
    }
  } as Tool,

  // User Preferences Tools
  setProjectCriteria: {
    description: 'Set or update criteria for automatic project discovery and recommendations',
    parameters: {
      type: 'object',
      properties: {
        criteria: {
          type: 'object',
          description: 'Project criteria configuration'
        }
      },
      required: ['criteria']
    }
  } as Tool,

  getUserPreferences: {
    description: 'Get current user preferences and settings',
    parameters: {
      type: 'object',
      properties: {}
    }
  } as Tool,

  updateAlertSettings: {
    description: 'Update global alert delivery preferences',
    parameters: {
      type: 'object',
      properties: {
        settings: {
          type: 'object',
          properties: {
            enableInApp: { type: 'boolean' },
            enableEmail: { type: 'boolean' },
            email: { type: 'string' },
            quietHours: {
              type: 'object',
              properties: {
                start: { type: 'number' },
                end: { type: 'number' }
              }
            }
          }
        }
      },
      required: ['settings']
    }
  } as Tool,

  // Analytics Tools
  getWalletActivitySummary: {
    description: 'Get summary of activity across all monitored wallets',
    parameters: {
      type: 'object',
      properties: {
        timeframe: {
          type: 'string',
          enum: ['24h', '7d', '30d'],
          default: '24h'
        }
      }
    }
  } as Tool,

  getPortfolioInsights: {
    description: 'Analyze user\'s portfolio based on watched wallets and saved projects',
    parameters: {
      type: 'object',
      properties: {
        includeRecommendations: {
          type: 'boolean',
          default: true
        }
      }
    }
  } as Tool,

  // Scam Detection Tools
  checkContractSafety: {
    description: 'Quick safety check for a smart contract to identify immediate red flags',
    parameters: {
      type: 'object',
      properties: {
        contractAddress: {
          type: 'string',
          description: 'Contract address to check'
        },
        chain: {
          type: 'string',
          default: 'ethereum'
        }
      },
      required: ['contractAddress']
    }
  } as Tool,

  reportScam: {
    description: 'Report a suspected scam project to help improve detection for other users',
    parameters: {
      type: 'object',
      properties: {
        projectId: {
          type: 'string',
          description: 'Project ID or contract address'
        },
        reason: {
          type: 'string',
          description: 'Reason for reporting as scam'
        },
        evidence: {
          type: 'string',
          description: 'Additional evidence or details'
        }
      },
      required: ['projectId', 'reason']
    }
  } as Tool
};

export type ToolName = keyof typeof tools;
