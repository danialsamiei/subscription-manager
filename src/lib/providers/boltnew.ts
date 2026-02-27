import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class BoltNewProvider extends BaseProvider {
  readonly name = 'Bolt.new';
  readonly type = 'boltnew';
  readonly supportsAPI = false;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['login_2fa', 'manual'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Bolt.new does not have a public API. Subscription info must be entered manually or synced via AI agent. Credentials stored for future automation.'
    };
  }

  async fetchDomains(): Promise<Domain[]> {
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    // Bolt.new subscription info must be entered manually
    // Future: implement web scraping or AI agent-based fetching
    return [];
  }
}
