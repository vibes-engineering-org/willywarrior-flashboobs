interface TokenData {
  id: string;
  symbol: string;
  name: string;
  image: string;
  current_price: number;
  market_cap: number;
  market_cap_rank: number;
  price_change_percentage_24h: number;
  total_volume: number;
  circulating_supply: number;
  sparkline_in_7d?: {
    price: number[];
  };
}

interface SearchResult {
  id: string;
  name: string;
  symbol: string;
  thumb: string;
  market_cap_rank: number;
}

class CoinGeckoService {
  private baseUrl = 'https://api.coingecko.com/api/v3';
  private lastRequestTime = 0;
  private minRequestInterval = 1000; // 1 second between requests

  private async makeRequest(url: string): Promise<any> {
    // Rate limiting
    const now = Date.now();
    const timeSinceLastRequest = now - this.lastRequestTime;
    if (timeSinceLastRequest < this.minRequestInterval) {
      await new Promise(resolve => setTimeout(resolve, this.minRequestInterval - timeSinceLastRequest));
    }
    this.lastRequestTime = Date.now();

    try {
      const response = await fetch(url);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return await response.json();
    } catch (error) {
      console.error('CoinGecko API request failed:', error);
      throw error;
    }
  }

  async searchTokens(query: string): Promise<SearchResult[]> {
    if (!query.trim()) return [];

    try {
      const data = await this.makeRequest(`${this.baseUrl}/search?query=${encodeURIComponent(query)}`);
      return data.coins?.slice(0, 10) || [];
    } catch (error) {
      console.error('Search tokens failed:', error);
      return [];
    }
  }

  async getTokenData(tokenIds: string[]): Promise<TokenData[]> {
    if (tokenIds.length === 0) return [];

    try {
      const ids = tokenIds.join(',');
      const data = await this.makeRequest(
        `${this.baseUrl}/coins/markets?vs_currency=usd&ids=${ids}&order=market_cap_desc&per_page=100&page=1&sparkline=true&price_change_percentage=24h`
      );
      return data || [];
    } catch (error) {
      console.error('Get token data failed:', error);
      return [];
    }
  }

  async getTokenByContractAddress(address: string, platform: string = 'ethereum'): Promise<TokenData | null> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/coins/${platform}/contract/${address}`);

      // Transform the response to match our TokenData interface
      return {
        id: data.id,
        symbol: data.symbol,
        name: data.name,
        image: data.image?.small || data.image?.thumb || '',
        current_price: data.market_data?.current_price?.usd || 0,
        market_cap: data.market_data?.market_cap?.usd || 0,
        market_cap_rank: data.market_cap_rank || 0,
        price_change_percentage_24h: data.market_data?.price_change_percentage_24h || 0,
        total_volume: data.market_data?.total_volume?.usd || 0,
        circulating_supply: data.market_data?.circulating_supply || 0,
      };
    } catch (error) {
      console.error('Get token by contract failed:', error);
      return null;
    }
  }

  async getTrendingTokens(): Promise<TokenData[]> {
    try {
      const data = await this.makeRequest(`${this.baseUrl}/coins/markets?vs_currency=usd&order=market_cap_desc&per_page=20&page=1&sparkline=true`);
      return data || [];
    } catch (error) {
      console.error('Get trending tokens failed:', error);
      return [];
    }
  }
}

export const coinGeckoService = new CoinGeckoService();
export type { TokenData, SearchResult };