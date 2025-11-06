// Scam detection using pattern matching and historical data
import {
  Env,
  RiskScore,
  RedFlag,
  ContractAnalysis,
  TokenomicsAnalysis,
  TeamAnalysis,
  CommunityAnalysis,
  ProjectData
} from '../agent/types';
import { ContractScanner } from './contract-scanner';

export class ScamDetector {
  private contractScanner: ContractScanner;

  constructor(private env: Env) {
    this.contractScanner = new ContractScanner(env);
  }

  /**
   * Comprehensive scam detection and risk scoring
   */
  async detectScam(
    projectData: ProjectData,
    contractAnalysis: ContractAnalysis,
    tokenomics?: TokenomicsAnalysis,
    teamAnalysis?: TeamAnalysis,
    communityAnalysis?: CommunityAnalysis
  ): Promise<RiskScore> {
    const redFlags: RedFlag[] = [];

    // Contract-level checks
    const contractRedFlags = this.contractScanner.generateRedFlags(contractAnalysis);
    redFlags.push(...contractRedFlags);

    // Tokenomics checks
    if (tokenomics) {
      const tokenomicsRedFlags = this.checkTokenomicsRedFlags(tokenomics);
      redFlags.push(...tokenomicsRedFlags);
    }

    // Team checks
    if (teamAnalysis) {
      const teamRedFlags = this.checkTeamRedFlags(teamAnalysis);
      redFlags.push(...teamRedFlags);
    }

    // Community checks
    if (communityAnalysis) {
      const communityRedFlags = this.checkCommunityRedFlags(communityAnalysis);
      redFlags.push(...communityRedFlags);
    }

    // Historical pattern matching
    const patternRedFlags = await this.matchScamPatterns(projectData, contractAnalysis);
    redFlags.push(...patternRedFlags);

    // Calculate risk scores
    const contractSafety = this.calculateContractSafety(contractAnalysis, redFlags);
    const tokenomicsScore = tokenomics ? this.calculateTokenomicsScore(tokenomics, redFlags) : 50;
    const teamCredibility = teamAnalysis ? this.calculateTeamScore(teamAnalysis, redFlags) : 50;
    const communityHealth = communityAnalysis ? this.calculateCommunityScore(communityAnalysis, redFlags) : 50;
    const liquidityRisk = this.calculateLiquidityRisk(contractAnalysis, redFlags);

    // Calculate overall score
    const overall = Math.round(
      (contractSafety * 0.3) +
      (tokenomicsScore * 0.25) +
      (teamCredibility * 0.2) +
      (communityHealth * 0.15) +
      (liquidityRisk * 0.1)
    );

    // Determine recommendation
    const recommendation = this.determineRecommendation(overall, redFlags);

    // Generate warnings
    const warnings = this.generateWarnings(redFlags);

    return {
      overall,
      contractSafety,
      tokenomics: tokenomicsScore,
      teamCredibility,
      communityHealth,
      liquidityRisk,
      redFlags,
      warnings,
      recommendation,
      analysisTimestamp: Date.now()
    };
  }

  /**
   * Check tokenomics for red flags
   */
  private checkTokenomicsRedFlags(tokenomics: TokenomicsAnalysis): RedFlag[] {
    const redFlags: RedFlag[] = [];

    // Check top holder concentration
    const top10Percentage = tokenomics.topHolders
      .slice(0, 10)
      .reduce((sum, holder) => sum + holder.percentage, 0);

    if (top10Percentage > 50) {
      redFlags.push({
        severity: 'HIGH',
        category: 'TOKENOMICS',
        description: 'High concentration in top 10 holders',
        evidence: `Top 10 holders own ${top10Percentage.toFixed(2)}% of supply`
      });
    }

    // Check for single whale
    const largestHolder = tokenomics.topHolders[0];
    if (largestHolder && largestHolder.percentage > 20) {
      redFlags.push({
        severity: 'HIGH',
        category: 'TOKENOMICS',
        description: 'Single address holds too much supply',
        evidence: `Largest holder owns ${largestHolder.percentage.toFixed(2)}% of supply`
      });
    }

    // Check holder count
    if (tokenomics.holderCount < 100) {
      redFlags.push({
        severity: 'MEDIUM',
        category: 'TOKENOMICS',
        description: 'Very few token holders',
        evidence: `Only ${tokenomics.holderCount} holders`
      });
    }

    // Check market cap vs liquidity
    if (tokenomics.lpTokens && tokenomics.marketCap > 0) {
      const liquidityRatio = parseFloat(tokenomics.lpTokens) / tokenomics.marketCap;
      if (liquidityRatio < 0.05) {
        redFlags.push({
          severity: 'HIGH',
          category: 'LIQUIDITY',
          description: 'Very low liquidity relative to market cap',
          evidence: `Liquidity is only ${(liquidityRatio * 100).toFixed(2)}% of market cap`
        });
      }
    }

    return redFlags;
  }

  /**
   * Check team for red flags
   */
  private checkTeamRedFlags(team: TeamAnalysis): RedFlag[] {
    const redFlags: RedFlag[] = [];

    if (!team.isDoxxed) {
      redFlags.push({
        severity: 'MEDIUM',
        category: 'TEAM',
        description: 'Anonymous team',
        evidence: 'No verified team member identities'
      });
    }

    if (team.scamHistory) {
      redFlags.push({
        severity: 'CRITICAL',
        category: 'TEAM',
        description: 'Team has history of scam projects',
        evidence: 'Team members involved in previous rug pulls or scams'
      });
    }

    if (team.members && team.members.length === 0) {
      redFlags.push({
        severity: 'HIGH',
        category: 'TEAM',
        description: 'No team information available',
        evidence: 'Cannot verify team members'
      });
    }

    return redFlags;
  }

  /**
   * Check community for red flags
   */
  private checkCommunityRedFlags(community: CommunityAnalysis): RedFlag[] {
    const redFlags: RedFlag[] = [];

    // Check for bot activity
    if (community.botActivity > 50) {
      redFlags.push({
        severity: 'HIGH',
        category: 'COMMUNITY',
        description: 'High bot activity detected',
        evidence: `${community.botActivity}% estimated bot activity`
      });
    }

    // Check for fake followers
    if (community.twitterFollowers > 1000 && community.twitterEngagement < 0.5) {
      redFlags.push({
        severity: 'MEDIUM',
        category: 'COMMUNITY',
        description: 'Low engagement relative to follower count',
        evidence: 'Possible fake/bought followers'
      });
    }

    // Check sentiment
    if (community.sentimentScore < -0.5) {
      redFlags.push({
        severity: 'MEDIUM',
        category: 'COMMUNITY',
        description: 'Negative community sentiment',
        evidence: `Sentiment score: ${community.sentimentScore.toFixed(2)}`
      });
    }

    return redFlags;
  }

  /**
   * Match against known scam patterns
   */
  private async matchScamPatterns(
    projectData: ProjectData,
    contractAnalysis: ContractAnalysis
  ): Promise<RedFlag[]> {
    const redFlags: RedFlag[] = [];

    // Query scam patterns from database
    const patterns = await this.env.DB.prepare(
      'SELECT * FROM scam_patterns'
    ).all();

    for (const pattern of patterns.results) {
      const indicators = JSON.parse(pattern.indicators as string);
      const matches = this.checkPatternMatch(indicators, contractAnalysis);

      if (matches.length > 0) {
        redFlags.push({
          severity: pattern.severity as any,
          category: pattern.pattern_type as any,
          description: pattern.description as string,
          evidence: matches.join(', ')
        });
      }
    }

    return redFlags;
  }

  /**
   * Check if indicators match the contract
   */
  private checkPatternMatch(indicators: string[], contractAnalysis: ContractAnalysis): string[] {
    const matches: string[] = [];

    for (const indicator of indicators) {
      if (indicator === 'is_proxy' && contractAnalysis.isProxy) {
        matches.push('Is proxy contract');
      }
      if (indicator === 'has_mint' && contractAnalysis.hasMintFunction) {
        matches.push('Has mint function');
      }
      if (indicator === 'ownership_not_renounced' && !contractAnalysis.ownershipRenounced) {
        matches.push('Ownership not renounced');
      }
      if (indicator === 'lp_not_locked' && !contractAnalysis.lpLocked) {
        matches.push('LP not locked');
      }
    }

    return matches;
  }

  /**
   * Calculate contract safety score (0-100, higher is safer)
   */
  private calculateContractSafety(
    contractAnalysis: ContractAnalysis,
    redFlags: RedFlag[]
  ): number {
    let score = 100;

    const contractRedFlags = redFlags.filter(f => f.category === 'CONTRACT');

    for (const flag of contractRedFlags) {
      switch (flag.severity) {
        case 'CRITICAL':
          score -= 30;
          break;
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }

    // Bonus points for good practices
    if (contractAnalysis.verified) score += 10;
    if (contractAnalysis.ownershipRenounced) score += 10;
    if (contractAnalysis.lpLocked) score += 10;

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate tokenomics score
   */
  private calculateTokenomicsScore(
    tokenomics: TokenomicsAnalysis,
    redFlags: RedFlag[]
  ): number {
    let score = 100;

    const tokenomicsRedFlags = redFlags.filter(f => f.category === 'TOKENOMICS');

    for (const flag of tokenomicsRedFlags) {
      switch (flag.severity) {
        case 'CRITICAL':
          score -= 30;
          break;
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
        case 'LOW':
          score -= 5;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate team credibility score
   */
  private calculateTeamScore(
    team: TeamAnalysis,
    redFlags: RedFlag[]
  ): number {
    let score = 50; // Start neutral

    if (team.isDoxxed) score += 30;
    if (team.members && team.members.length > 0) score += 10;
    if (team.previousProjects && team.previousProjects.length > 0) score += 10;

    const teamRedFlags = redFlags.filter(f => f.category === 'TEAM');

    for (const flag of teamRedFlags) {
      switch (flag.severity) {
        case 'CRITICAL':
          score -= 40;
          break;
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate community health score
   */
  private calculateCommunityScore(
    community: CommunityAnalysis,
    redFlags: RedFlag[]
  ): number {
    let score = 50;

    // Positive indicators
    if (community.holderGrowthRate > 0) score += 10;
    if (community.sentimentScore > 0.5) score += 10;
    if (community.twitterEngagement > 2) score += 10;

    const communityRedFlags = redFlags.filter(f => f.category === 'COMMUNITY');

    for (const flag of communityRedFlags) {
      switch (flag.severity) {
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Calculate liquidity risk score
   */
  private calculateLiquidityRisk(
    contractAnalysis: ContractAnalysis,
    redFlags: RedFlag[]
  ): number {
    let score = 50;

    if (contractAnalysis.lpLocked) score += 30;

    const liquidityRedFlags = redFlags.filter(f => f.category === 'LIQUIDITY');

    for (const flag of liquidityRedFlags) {
      switch (flag.severity) {
        case 'CRITICAL':
          score -= 30;
          break;
        case 'HIGH':
          score -= 20;
          break;
        case 'MEDIUM':
          score -= 10;
          break;
      }
    }

    return Math.max(0, Math.min(100, score));
  }

  /**
   * Determine overall recommendation
   */
  private determineRecommendation(
    overallScore: number,
    redFlags: RedFlag[]
  ): 'AVOID' | 'HIGH_RISK' | 'MODERATE_RISK' | 'LOW_RISK' | 'SAFE' {
    const hasCritical = redFlags.some(f => f.severity === 'CRITICAL');

    if (hasCritical || overallScore < 30) {
      return 'AVOID';
    }

    if (overallScore < 50) {
      return 'HIGH_RISK';
    }

    if (overallScore < 70) {
      return 'MODERATE_RISK';
    }

    if (overallScore < 85) {
      return 'LOW_RISK';
    }

    return 'SAFE';
  }

  /**
   * Generate human-readable warnings
   */
  private generateWarnings(redFlags: RedFlag[]): string[] {
    return redFlags
      .sort((a, b) => {
        const severityOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
        return severityOrder[a.severity] - severityOrder[b.severity];
      })
      .map(flag => `[${flag.severity}] ${flag.description}`);
  }
}
