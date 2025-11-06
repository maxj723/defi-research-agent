// Blockchain data integration - Etherscan, Alchemy, etc.
import { Env, BlockchainTransaction, TokenInfo, NFTInfo, Transaction } from '../agent/types';

export class BlockchainClient {
  constructor(private env: Env) {}

  /**
   * Fetch transactions for a wallet address
   */
  async getWalletTransactions(
    address: string,
    chain: string = 'ethereum',
    startBlock: number = 0,
    endBlock: number = 99999999
  ): Promise<BlockchainTransaction[]> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=account&action=txlist&address=${address}&startblock=${startBlock}&endblock=${endBlock}&sort=desc&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result as BlockchainTransaction[];
      }

      return [];
    } catch (error) {
      console.error('Error fetching wallet transactions:', error);
      return [];
    }
  }

  /**
   * Fetch internal transactions (contract interactions)
   */
  async getInternalTransactions(
    address: string,
    chain: string = 'ethereum'
  ): Promise<BlockchainTransaction[]> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=account&action=txlistinternal&address=${address}&sort=desc&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result;
      }

      return [];
    } catch (error) {
      console.error('Error fetching internal transactions:', error);
      return [];
    }
  }

  /**
   * Fetch ERC20 token transfers for a wallet
   */
  async getTokenTransfers(
    address: string,
    contractAddress?: string,
    chain: string = 'ethereum'
  ): Promise<any[]> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    let url = `${baseUrl}/api?module=account&action=tokentx&address=${address}&sort=desc&apikey=${apiKey}`;

    if (contractAddress) {
      url += `&contractaddress=${contractAddress}`;
    }

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result;
      }

      return [];
    } catch (error) {
      console.error('Error fetching token transfers:', error);
      return [];
    }
  }

  /**
   * Fetch NFT transfers (ERC721)
   */
  async getNFTTransfers(
    address: string,
    chain: string = 'ethereum'
  ): Promise<any[]> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=account&action=tokennfttx&address=${address}&sort=desc&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result;
      }

      return [];
    } catch (error) {
      console.error('Error fetching NFT transfers:', error);
      return [];
    }
  }

  /**
   * Get contract source code and ABI
   */
  async getContractSource(
    contractAddress: string,
    chain: string = 'ethereum'
  ): Promise<{
    sourceCode: string;
    abi: string;
    contractName: string;
    compilerVersion: string;
    optimizationUsed: string;
    isVerified: boolean;
  } | null> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=contract&action=getsourcecode&address=${contractAddress}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result && data.result[0]) {
        const result = data.result[0];
        return {
          sourceCode: result.SourceCode,
          abi: result.ABI,
          contractName: result.ContractName,
          compilerVersion: result.CompilerVersion,
          optimizationUsed: result.OptimizationUsed,
          isVerified: result.SourceCode !== ''
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching contract source:', error);
      return null;
    }
  }

  /**
   * Get token info from contract address
   */
  async getTokenInfo(
    contractAddress: string,
    chain: string = 'ethereum'
  ): Promise<TokenInfo | null> {
    // Use Alchemy or similar for token metadata
    // For now, try to get basic info from Etherscan
    const contractInfo = await this.getContractSource(contractAddress, chain);

    if (!contractInfo) return null;

    // Parse ABI to get token info
    try {
      const abi = JSON.parse(contractInfo.abi);

      // Get token name, symbol, decimals from ABI
      // This is a simplified version - in production, you'd call the contract methods
      return {
        address: contractAddress,
        name: contractInfo.contractName,
        symbol: '',
        decimals: 18, // Default
        totalSupply: '0'
      };
    } catch (error) {
      console.error('Error parsing token info:', error);
      return null;
    }
  }

  /**
   * Get ETH balance for an address
   */
  async getBalance(
    address: string,
    chain: string = 'ethereum'
  ): Promise<string> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=account&action=balance&address=${address}&tag=latest&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result;
      }

      return '0';
    } catch (error) {
      console.error('Error fetching balance:', error);
      return '0';
    }
  }

  /**
   * Get contract creation transaction
   */
  async getContractCreation(
    contractAddress: string,
    chain: string = 'ethereum'
  ): Promise<{
    creator: string;
    txHash: string;
    timestamp: number;
  } | null> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result && data.result[0]) {
        const result = data.result[0];

        // Get transaction details to get timestamp
        const txUrl = `${baseUrl}/api?module=proxy&action=eth_getTransactionByHash&txhash=${result.txHash}&apikey=${apiKey}`;
        const txResponse = await fetch(txUrl);
        const txData = await txResponse.json();

        // Get block timestamp
        const blockUrl = `${baseUrl}/api?module=proxy&action=eth_getBlockByNumber&tag=${txData.result?.blockNumber}&boolean=false&apikey=${apiKey}`;
        const blockResponse = await fetch(blockUrl);
        const blockData = await blockResponse.json();

        return {
          creator: result.contractCreator,
          txHash: result.txHash,
          timestamp: parseInt(blockData.result?.timestamp || '0', 16)
        };
      }

      return null;
    } catch (error) {
      console.error('Error fetching contract creation:', error);
      return null;
    }
  }

  /**
   * Check if address is a contract
   */
  async isContract(address: string, chain: string = 'ethereum'): Promise<boolean> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=proxy&action=eth_getCode&address=${address}&tag=latest&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      return data.result && data.result !== '0x';
    } catch (error) {
      console.error('Error checking if contract:', error);
      return false;
    }
  }

  /**
   * Get gas price
   */
  async getGasPrice(chain: string = 'ethereum'): Promise<string> {
    const apiKey = this.env.ETHERSCAN_API_KEY;
    const baseUrl = this.getEtherscanBaseUrl(chain);

    const url = `${baseUrl}/api?module=gastracker&action=gasoracle&apikey=${apiKey}`;

    try {
      const response = await fetch(url);
      const data = await response.json();

      if (data.status === '1' && data.result) {
        return data.result.ProposeGasPrice;
      }

      return '0';
    } catch (error) {
      console.error('Error fetching gas price:', error);
      return '0';
    }
  }

  /**
   * Parse transaction to extract meaningful data
   */
  parseTransaction(tx: BlockchainTransaction): Transaction {
    const isNFT = tx.functionName?.includes('safeTransferFrom') ||
                  tx.functionName?.includes('transferFrom');

    return {
      hash: tx.hash,
      from: tx.from,
      to: tx.to,
      value: tx.value,
      timestamp: parseInt(tx.timeStamp) * 1000,
      blockNumber: parseInt(tx.blockNumber),
      gasUsed: tx.gasUsed,
      gasPrice: tx.gasPrice,
      method: tx.functionName,
      isNFT,
      tokenAddress: undefined,
      tokenSymbol: undefined,
      tokenAmount: undefined,
      nftTokenId: undefined,
      dexRouter: undefined
    };
  }

  /**
   * Get Etherscan base URL for different chains
   */
  private getEtherscanBaseUrl(chain: string): string {
    const urls: Record<string, string> = {
      ethereum: 'https://api.etherscan.io',
      goerli: 'https://api-goerli.etherscan.io',
      sepolia: 'https://api-sepolia.etherscan.io',
      polygon: 'https://api.polygonscan.com',
      bsc: 'https://api.bscscan.com',
      arbitrum: 'https://api.arbiscan.io',
      optimism: 'https://api-optimistic.etherscan.io',
      base: 'https://api.basescan.org',
      avalanche: 'https://api.snowtrace.io',
      fantom: 'https://api.ftmscan.com'
    };

    return urls[chain.toLowerCase()] || urls.ethereum;
  }
}

/**
 * DeFi-specific integrations
 */
export class DefiDataClient {
  constructor(private env: Env) {}

  /**
   * Get protocol TVL from DefiLlama
   */
  async getProtocolTVL(protocol: string): Promise<number> {
    try {
      const url = `${this.env.DEFILLAMA_API_URL}/tvl/${protocol}`;
      const response = await fetch(url);
      const data = await response.json();

      return data || 0;
    } catch (error) {
      console.error('Error fetching protocol TVL:', error);
      return 0;
    }
  }

  /**
   * Get all protocols data
   */
  async getAllProtocols(): Promise<any[]> {
    try {
      const url = `${this.env.DEFILLAMA_API_URL}/protocols`;
      const response = await fetch(url);
      const data = await response.json();

      return data || [];
    } catch (error) {
      console.error('Error fetching protocols:', error);
      return [];
    }
  }

  /**
   * Get token price from CoinGecko
   */
  async getTokenPrice(contractAddress: string, chain: string = 'ethereum'): Promise<number> {
    try {
      const platformId = this.getCoinGeckoPlatformId(chain);
      const url = `https://api.coingecko.com/api/v3/simple/token_price/${platformId}?contract_addresses=${contractAddress}&vs_currencies=usd`;

      const response = await fetch(url, {
        headers: {
          'X-CG-API-KEY': this.env.COINGECKO_API_KEY
        }
      });

      const data = await response.json();
      const price = data[contractAddress.toLowerCase()]?.usd;

      return price || 0;
    } catch (error) {
      console.error('Error fetching token price:', error);
      return 0;
    }
  }

  /**
   * Get token market data
   */
  async getTokenMarketData(contractAddress: string, chain: string = 'ethereum'): Promise<any> {
    try {
      const platformId = this.getCoinGeckoPlatformId(chain);
      const url = `https://api.coingecko.com/api/v3/coins/${platformId}/contract/${contractAddress}`;

      const response = await fetch(url, {
        headers: {
          'X-CG-API-KEY': this.env.COINGECKO_API_KEY
        }
      });

      return await response.json();
    } catch (error) {
      console.error('Error fetching token market data:', error);
      return null;
    }
  }

  /**
   * Get trending tokens
   */
  async getTrendingTokens(): Promise<any[]> {
    try {
      const url = 'https://api.coingecko.com/api/v3/search/trending';

      const response = await fetch(url, {
        headers: {
          'X-CG-API-KEY': this.env.COINGECKO_API_KEY
        }
      });

      const data = await response.json();
      return data.coins || [];
    } catch (error) {
      console.error('Error fetching trending tokens:', error);
      return [];
    }
  }

  private getCoinGeckoPlatformId(chain: string): string {
    const platforms: Record<string, string> = {
      ethereum: 'ethereum',
      bsc: 'binance-smart-chain',
      polygon: 'polygon-pos',
      arbitrum: 'arbitrum-one',
      optimism: 'optimistic-ethereum',
      base: 'base',
      avalanche: 'avalanche',
      fantom: 'fantom'
    };

    return platforms[chain.toLowerCase()] || 'ethereum';
  }
}
