// API client for backend communication
import { getSettings } from './config';
import type { Alert, WalletMonitor } from './types';

class ApiClient {
  private baseUrl: string = '';
  private userId: string = '';

  constructor() {
    this.updateConfig();
  }

  updateConfig() {
    const settings = getSettings();
    this.baseUrl = settings.backendUrl.replace(/\/$/, ''); // Remove trailing slash
    this.userId = settings.userId;
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {}
  ): Promise<T> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      'X-User-Id': this.userId,
      ...options.headers,
    };

    const response = await fetch(url, { ...options, headers });

    if (!response.ok) {
      throw new Error(`API Error: ${response.statusText}`);
    }

    return response.json();
  }

  // Chat
  async sendMessage(message: string) {
    return this.request<{ response: string; toolCalls?: any[] }>('/chat', {
      method: 'POST',
      body: JSON.stringify({ message }),
    });
  }

  // Wallets
  async addWallet(data: {
    walletAddress: string;
    alertPreferences: any;
    nickname?: string;
  }) {
    return this.request<{ success: boolean; message: string }>(
      '/api/wallets/add',
      {
        method: 'POST',
        body: JSON.stringify(data),
      }
    );
  }

  async getWallets(): Promise<WalletMonitor[]> {
    return this.request<WalletMonitor[]>('/api/wallets');
  }

  async removeWallet(address: string) {
    return this.request<{ success: boolean; message: string }>(
      `/api/wallets/${address}`,
      {
        method: 'DELETE',
      }
    );
  }

  // Alerts
  async getAlerts(params?: {
    limit?: number;
    unreadOnly?: boolean;
    walletAddress?: string;
  }): Promise<Alert[]> {
    const query = new URLSearchParams();
    if (params?.limit) query.set('limit', params.limit.toString());
    if (params?.unreadOnly) query.set('unreadOnly', 'true');
    if (params?.walletAddress) query.set('walletAddress', params.walletAddress);

    const queryString = query.toString();
    const endpoint = `/api/alerts${queryString ? `?${queryString}` : ''}`;

    return this.request<Alert[]>(endpoint);
  }

  async markAlertsRead(alertIds?: number[], markAll?: boolean) {
    return this.request<{ success: boolean }>('/api/alerts/mark-read', {
      method: 'POST',
      body: JSON.stringify({ alertIds, markAll }),
    });
  }

  // WebSocket URL
  getWebSocketUrl(): string {
    const wsUrl = this.baseUrl.replace(/^http/, 'ws');
    return `${wsUrl}/ws/${this.userId}`;
  }

  // Health check
  async healthCheck() {
    try {
      const response = await fetch(`${this.baseUrl}/health`);
      return response.ok;
    } catch {
      return false;
    }
  }
}

export const api = new ApiClient();
