// LLM prompt templates for analysis
import { Env, ProjectData, ContractAnalysis, RiskScore } from '../agent/types';

export class LLMAnalyzer {
  constructor(private env: Env) {}

  /**
   * Generate investment thesis for a project
   */
  async generateInvestmentThesis(
    projectData: ProjectData,
    riskScore: RiskScore,
    contractAnalysis: ContractAnalysis
  ): Promise<string> {
    const prompt = `You are an expert DeFi analyst. Analyze this project and generate a comprehensive investment thesis.

Project Information:
- Name: ${projectData.name}
- Symbol: ${projectData.symbol || 'N/A'}
- Chain: ${projectData.chain}
- Category: ${projectData.category || 'Unknown'}
- Description: ${projectData.description || 'No description'}
- Contract: ${projectData.contractAddress}

Risk Analysis:
- Overall Risk Score: ${riskScore.overall}/100
- Recommendation: ${riskScore.recommendation}
- Contract Safety: ${riskScore.contractSafety}/100
- Tokenomics: ${riskScore.tokenomics}/100
- Team Credibility: ${riskScore.teamCredibility}/100

Contract Analysis:
- Verified: ${contractAnalysis.verified ? 'Yes' : 'No'}
- Ownership Renounced: ${contractAnalysis.ownershipRenounced ? 'Yes' : 'No'}
- LP Locked: ${contractAnalysis.lpLocked ? 'Yes' : 'No'}
- Has Mint Function: ${contractAnalysis.hasMintFunction ? 'Yes' : 'No'}
- Buy Tax: ${contractAnalysis.buyTax}%
- Sell Tax: ${contractAnalysis.sellTax}%

Red Flags:
${riskScore.redFlags.map(f => `- [${f.severity}] ${f.description}`).join('\n')}

Please provide:
1. **Value Proposition**: What problem does this project solve?
2. **Strengths**: What are the positive aspects?
3. **Risks**: What are the main concerns?
4. **Market Opportunity**: What's the potential upside?
5. **Investment Recommendation**: Should someone invest? At what risk level?

Be balanced, honest, and conservative. If the project shows critical red flags, strongly warn against investment.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a conservative DeFi investment analyst. Prioritize user safety over potential gains.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    return response.response as string;
  }

  /**
   * Analyze whitepaper quality
   */
  async analyzeWhitepaper(whitepaperText: string): Promise<{
    quality: number;
    strengths: string[];
    weaknesses: string[];
    verdict: string;
  }> {
    const prompt = `Analyze this cryptocurrency project whitepaper and rate its quality.

Whitepaper Content:
${whitepaperText.substring(0, 10000)} // Limit to avoid token limits

Evaluate:
1. Technical depth and innovation
2. Clarity and professionalism
3. Realistic roadmap and goals
4. Team transparency
5. Tokenomics explanation
6. Use case viability

Provide:
- Quality score (0-100)
- Top 3 strengths
- Top 3 weaknesses
- Overall verdict

Format your response as JSON:
{
  "quality": <number>,
  "strengths": ["strength1", "strength2", "strength3"],
  "weaknesses": ["weakness1", "weakness2", "weakness3"],
  "verdict": "brief verdict"
}`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a technical analyst specializing in cryptocurrency whitepapers.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    try {
      return JSON.parse(response.response as string);
    } catch {
      return {
        quality: 50,
        strengths: ['Unable to parse whitepaper'],
        weaknesses: ['Analysis failed'],
        verdict: 'Could not analyze whitepaper'
      };
    }
  }

  /**
   * Compare projects and identify better investment
   */
  async compareProjects(
    project1: { name: string; riskScore: RiskScore },
    project2: { name: string; riskScore: RiskScore }
  ): Promise<string> {
    const prompt = `Compare these two DeFi projects and recommend which is a better investment.

Project 1: ${project1.name}
- Overall Score: ${project1.riskScore.overall}/100
- Recommendation: ${project1.riskScore.recommendation}
- Red Flags: ${project1.riskScore.redFlags.length}

Project 2: ${project2.name}
- Overall Score: ${project2.riskScore.overall}/100
- Recommendation: ${project2.riskScore.recommendation}
- Red Flags: ${project2.riskScore.redFlags.length}

Provide a comparison covering:
1. Which project is safer?
2. Which has better growth potential?
3. Which would you recommend for a conservative investor?
4. Which would you recommend for a risk-tolerant investor?
5. Overall recommendation

Be concise but thorough.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a DeFi investment advisor providing comparative analysis.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    return response.response as string;
  }

  /**
   * Explain why a wallet is profitable
   */
  async explainWalletStrategy(
    walletAddress: string,
    profitHistory: any,
    topTrades: any[]
  ): Promise<string> {
    const prompt = `Analyze this profitable crypto wallet and explain their trading strategy.

Wallet: ${walletAddress}
Total Profit: $${profitHistory.total.toFixed(2)}
Win Rate: ${profitHistory.winRate.toFixed(2)}%
Number of Trades: ${profitHistory.trades}
ROI: ${profitHistory.roi.toFixed(2)}%

Top Profitable Trades:
${topTrades.slice(0, 5).map(t => `- ${t.tokenSymbol}: $${t.profit.toFixed(2)} profit (${t.roi.toFixed(2)}% ROI)`).join('\n')}

Analyze:
1. What type of trader is this (day trader, swing trader, long-term holder)?
2. What's their likely strategy?
3. What can we learn from their approach?
4. What are the risks of copying their trades?
5. Recommendations for following this wallet

Be educational and balanced.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a trading strategy analyst helping users understand successful traders.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    return response.response as string;
  }

  /**
   * Generate market summary and recommendations
   */
  async generateMarketSummary(
    trendingProjects: any[],
    userRiskTolerance: string
  ): Promise<string> {
    const prompt = `Generate a daily DeFi market summary and personalized recommendations.

User Risk Tolerance: ${userRiskTolerance}

Trending Projects Today:
${trendingProjects.map(p => `- ${p.name} (${p.category}): ${p.change24h > 0 ? '+' : ''}${p.change24h}% in 24h`).join('\n')}

Provide:
1. Overall market sentiment (bullish/bearish/neutral)
2. Top 3 opportunities for this user's risk level
3. Sectors to watch
4. Risks to be aware of today
5. One actionable tip

Keep it concise and actionable.`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a DeFi market analyst providing daily insights.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    return response.response as string;
  }

  /**
   * Detect if social media content is suspicious/scammy
   */
  async analyzeSocialContent(
    content: string,
    source: string
  ): Promise<{
    isScam: boolean;
    confidence: number;
    reasons: string[];
  }> {
    const prompt = `Analyze this crypto-related social media content for scam indicators.

Source: ${source}
Content: "${content}"

Check for:
- Unrealistic promises (guaranteed returns, "10000x", etc.)
- Urgency tactics ("last chance", "only 24 hours", etc.)
- Fake urgency or scarcity
- Impersonation of known figures
- Suspicious links or wallet addresses
- Grammatical errors suggesting fraud

Respond in JSON:
{
  "isScam": <boolean>,
  "confidence": <0-100>,
  "reasons": ["reason1", "reason2", ...]
}`;

    const response = await this.env.AI.run('@cf/meta/llama-3.3-70b-instruct-fp8-fast', {
      messages: [
        {
          role: 'system',
          content: 'You are a content moderation AI specializing in crypto scam detection.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      stream: false
    });

    try {
      return JSON.parse(response.response as string);
    } catch {
      return {
        isScam: false,
        confidence: 0,
        reasons: ['Unable to analyze']
      };
    }
  }
}

/**
 * System prompts for different agent personas
 */
export const SYSTEM_PROMPTS = {
  conservative: `You are a conservative DeFi investment advisor. Your primary goal is to protect users from losing money. You:
- Emphasize risks over potential rewards
- Recommend only well-established, audited projects
- Warn strongly against high-risk investments
- Encourage proper research and due diligence
- Never provide financial advice, only educational information`,

  balanced: `You are a balanced DeFi investment analyst. You:
- Present both risks and opportunities fairly
- Provide data-driven analysis
- Consider different risk tolerances
- Explain trade-offs clearly
- Help users make informed decisions based on their goals`,

  aggressive: `You are a DeFi opportunities analyst. You:
- Focus on high-growth potential projects
- Identify emerging trends early
- Still highlight risks but emphasize upside
- Cater to risk-tolerant investors
- Provide actionable insights for active traders`
};
