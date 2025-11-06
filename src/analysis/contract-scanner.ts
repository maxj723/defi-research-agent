// Smart contract analysis and security scanning
import { Env, ContractAnalysis, TokenomicsAnalysis, RedFlag } from '../agent/types';
import { BlockchainClient } from '../integrations/blockchain';

export class ContractScanner {
  private blockchain: BlockchainClient;

  constructor(private env: Env) {
    this.blockchain = new BlockchainClient(env);
  }

  /**
   * Perform comprehensive contract analysis
   */
  async analyzeContract(
    contractAddress: string,
    chain: string = 'ethereum'
  ): Promise<ContractAnalysis> {
    const [sourceInfo, creation] = await Promise.all([
      this.blockchain.getContractSource(contractAddress, chain),
      this.blockchain.getContractCreation(contractAddress, chain)
    ]);

    const analysis: ContractAnalysis = {
      verified: sourceInfo?.isVerified || false,
      isProxy: false,
      hasHoneypot: false,
      hasMintFunction: false,
      hasPauseFunction: false,
      hasBlacklist: false,
      hasWhitelist: false,
      buyTax: 0,
      sellTax: 0,
      ownershipRenounced: false,
      lpLocked: false,
      creatorAddress: creation?.creator || 'Unknown',
      creationTimestamp: creation?.timestamp || 0
    };

    if (!sourceInfo || !sourceInfo.isVerified) {
      return analysis; // Cannot analyze unverified contract
    }

    // Analyze source code for red flags
    const sourceCode = sourceInfo.sourceCode.toLowerCase();

    // Check for proxy pattern
    analysis.isProxy = this.detectProxyPattern(sourceCode);

    // Check for dangerous functions
    analysis.hasMintFunction = this.detectMintFunction(sourceCode);
    analysis.hasPauseFunction = this.detectPauseFunction(sourceCode);
    analysis.hasBlacklist = this.detectBlacklist(sourceCode);
    analysis.hasWhitelist = this.detectWhitelist(sourceCode);

    // Check for honeypot indicators
    analysis.hasHoneypot = this.detectHoneypot(sourceCode);

    // Detect taxes
    const taxes = this.detectTaxes(sourceCode);
    analysis.buyTax = taxes.buy;
    analysis.sellTax = taxes.sell;

    // Check ownership status
    analysis.ownershipRenounced = this.detectOwnershipRenounced(sourceCode);

    // Check liquidity lock (would need to check LP token contract)
    analysis.lpLocked = false; // Placeholder

    return analysis;
  }

  /**
   * Analyze token distribution and holder data
   */
  async analyzeTokenomics(
    contractAddress: string,
    chain: string = 'ethereum'
  ): Promise<TokenomicsAnalysis> {
    // This would require integration with token holder APIs
    // Placeholder implementation
    return {
      totalSupply: '0',
      circulatingSupply: '0',
      topHolders: [],
      holderCount: 0,
      marketCap: 0,
      fullyDilutedValue: 0
    };
  }

  /**
   * Detect proxy pattern in contract
   */
  private detectProxyPattern(sourceCode: string): boolean {
    const proxyIndicators = [
      'delegatecall',
      'upgradeable',
      'proxy',
      'implementation',
      'eip1967'
    ];

    return proxyIndicators.some(indicator => sourceCode.includes(indicator));
  }

  /**
   * Detect mint function
   */
  private detectMintFunction(sourceCode: string): boolean {
    const mintPatterns = [
      /function\s+mint\s*\(/,
      /function\s+mintto\s*\(/i,
      /function\s+_mint\s*\(/,
      /_mint\s*\([^)]*\)/
    ];

    return mintPatterns.some(pattern => pattern.test(sourceCode));
  }

  /**
   * Detect pause function
   */
  private detectPauseFunction(sourceCode: string): boolean {
    const pausePatterns = [
      /function\s+pause\s*\(/,
      /whennotpaused/i,
      /pausable/i
    ];

    return pausePatterns.some(pattern => pattern.test(sourceCode));
  }

  /**
   * Detect blacklist functionality
   */
  private detectBlacklist(sourceCode: string): boolean {
    const blacklistIndicators = [
      'blacklist',
      'isblacklisted',
      '_blacklist',
      'banned',
      'isbanned'
    ];

    return blacklistIndicators.some(indicator => sourceCode.includes(indicator));
  }

  /**
   * Detect whitelist functionality
   */
  private detectWhitelist(sourceCode: string): boolean {
    const whitelistIndicators = [
      'whitelist',
      'iswhitelisted',
      '_whitelist',
      'allowed',
      'isallowed'
    ];

    return whitelistIndicators.some(indicator => sourceCode.includes(indicator));
  }

  /**
   * Detect honeypot characteristics
   */
  private detectHoneypot(sourceCode: string): boolean {
    const honeypotIndicators = [
      // Can't sell pattern
      /if\s*\(.*from.*==.*pair.*\)\s*require/i,
      /if\s*\(.*to.*==.*pair.*\)\s*revert/i,

      // Hidden transfer restrictions
      /function\s+transfer.*onlyowner/i,

      // Suspicious modifiers on transfer
      /function\s+transfer.*\{[^}]*require.*msg\.sender.*owner/i
    ];

    return honeypotIndicators.some(pattern => pattern.test(sourceCode));
  }

  /**
   * Detect buy/sell taxes
   */
  private detectTaxes(sourceCode: string): { buy: number; sell: number } {
    // Look for tax-related variables
    const buyTaxMatch = sourceCode.match(/buytax\s*=\s*(\d+)/i) ||
                       sourceCode.match(/buyfee\s*=\s*(\d+)/i);

    const sellTaxMatch = sourceCode.match(/selltax\s*=\s*(\d+)/i) ||
                        sourceCode.match(/sellfee\s*=\s*(\d+)/i);

    const buyTax = buyTaxMatch ? parseInt(buyTaxMatch[1]) : 0;
    const sellTax = sellTaxMatch ? parseInt(sellTaxMatch[1]) : 0;

    return { buy: buyTax, sell: sellTax };
  }

  /**
   * Detect if ownership has been renounced
   */
  private detectOwnershipRenounced(sourceCode: string): boolean {
    const renounceIndicators = [
      /renounceownership/i,
      /owner\s*=\s*address\(0\)/i,
      /_transferownership\(address\(0\)\)/i
    ];

    return renounceIndicators.some(pattern => pattern.test(sourceCode));
  }

  /**
   * Generate red flags from contract analysis
   */
  generateRedFlags(analysis: ContractAnalysis): RedFlag[] {
    const redFlags: RedFlag[] = [];

    if (!analysis.verified) {
      redFlags.push({
        severity: 'CRITICAL',
        category: 'CONTRACT',
        description: 'Contract source code is not verified',
        evidence: 'Cannot analyze unverified contract code'
      });
    }

    if (analysis.hasHoneypot) {
      redFlags.push({
        severity: 'CRITICAL',
        category: 'CONTRACT',
        description: 'Honeypot detected - may not be able to sell',
        evidence: 'Contract contains transfer restrictions that could prevent selling'
      });
    }

    if (analysis.isProxy && analysis.hasMintFunction && !analysis.ownershipRenounced) {
      redFlags.push({
        severity: 'CRITICAL',
        category: 'CONTRACT',
        description: 'Upgradeable contract with mint function and active owner',
        evidence: 'Owner can upgrade contract to mint unlimited tokens'
      });
    }

    if (analysis.hasMintFunction && !analysis.ownershipRenounced) {
      redFlags.push({
        severity: 'HIGH',
        category: 'CONTRACT',
        description: 'Contract has mint function and ownership not renounced',
        evidence: 'Owner can mint new tokens at any time'
      });
    }

    if (analysis.buyTax > 10 || analysis.sellTax > 10) {
      redFlags.push({
        severity: 'HIGH',
        category: 'CONTRACT',
        description: 'Excessive trading taxes detected',
        evidence: `Buy tax: ${analysis.buyTax}%, Sell tax: ${analysis.sellTax}%`
      });
    }

    if (analysis.hasBlacklist && !analysis.ownershipRenounced) {
      redFlags.push({
        severity: 'MEDIUM',
        category: 'CONTRACT',
        description: 'Contract can blacklist addresses',
        evidence: 'Owner can prevent specific addresses from trading'
      });
    }

    if (analysis.hasPauseFunction && !analysis.ownershipRenounced) {
      redFlags.push({
        severity: 'MEDIUM',
        category: 'CONTRACT',
        description: 'Contract can be paused by owner',
        evidence: 'Owner can halt all trading at any time'
      });
    }

    if (!analysis.lpLocked && analysis.creationTimestamp > 0) {
      const age = Date.now() - (analysis.creationTimestamp * 1000);
      if (age < 7 * 24 * 60 * 60 * 1000) { // Less than 7 days old
        redFlags.push({
          severity: 'HIGH',
          category: 'LIQUIDITY',
          description: 'Liquidity not locked for new token',
          evidence: 'LP tokens are not locked, rug pull risk'
        });
      }
    }

    return redFlags;
  }

  /**
   * Quick safety check
   */
  async quickSafetyCheck(
    contractAddress: string,
    chain: string = 'ethereum'
  ): Promise<{
    isSafe: boolean;
    criticalIssues: number;
    highIssues: number;
    warnings: string[];
  }> {
    const analysis = await this.analyzeContract(contractAddress, chain);
    const redFlags = this.generateRedFlags(analysis);

    const criticalIssues = redFlags.filter(f => f.severity === 'CRITICAL').length;
    const highIssues = redFlags.filter(f => f.severity === 'HIGH').length;

    const warnings = redFlags.map(f => f.description);

    return {
      isSafe: criticalIssues === 0 && highIssues === 0,
      criticalIssues,
      highIssues,
      warnings
    };
  }
}
