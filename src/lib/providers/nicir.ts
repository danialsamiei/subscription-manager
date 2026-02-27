import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class NicIrProvider extends BaseProvider {
  readonly name = 'NIC.ir';
  readonly type = 'nicir';
  readonly supportsAPI = false; // NIC.ir doesn't have a public REST API
  readonly supportsDomains = true;
  readonly supportsSubscriptions = false;
  readonly authMethods = ['login_2fa', 'manual'];

  // NIC.ir requires web login - domains must be added manually or via web scraping
  // This provider supports manual entry and potential future web scraping/automation

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const username = this.getCredential('username');
    const password = this.getCredential('password');

    if (!username || !password) {
      return {
        success: false,
        message: 'NIC.ir requires username and password. Note: NIC.ir does not have a public API. Domains must be added manually or synced via web scraping agent.'
      };
    }

    // NIC.ir doesn't have a REST API, so we can't test programmatically
    return {
      success: true,
      message: 'Credentials stored. NIC.ir sync requires web scraping agent or manual entry. Auto-sync is not available via API.'
    };
  }

  async fetchDomains(): Promise<Domain[]> {
    // NIC.ir doesn't have a public API
    // Domains registered here need to be added manually or through a web scraping agent
    // The provider framework supports this through the manual entry UI
    console.warn('NIC.ir does not support API-based domain fetching. Use manual entry or web scraping agent.');
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [];
  }
}
