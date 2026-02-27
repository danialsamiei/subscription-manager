import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class ReplitProvider extends BaseProvider {
  readonly name = 'Replit';
  readonly type = 'replit';
  readonly supportsAPI = false; // Replit has limited API, mostly GraphQL
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['login_2fa', 'manual'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = this.getCredential('api_key');

    if (!apiKey) {
      return {
        success: false,
        message: 'Replit does not have a full public REST API. Subscription info must be entered manually or synced via web agent. Store your connect.sid cookie or API key for future agent-based sync.'
      };
    }

    return {
      success: true,
      message: 'Credentials stored. Replit sync requires web agent or manual entry.'
    };
  }

  async fetchDomains(): Promise<Domain[]> {
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    // Replit subscription info must be entered manually
    // Future: implement GraphQL-based fetching or web scraping agent
    return [];
  }
}
