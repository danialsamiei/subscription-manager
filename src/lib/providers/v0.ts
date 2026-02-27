import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class V0Provider extends BaseProvider {
  readonly name = 'v0';
  readonly type = 'v0';
  readonly supportsAPI = false;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['login_2fa', 'manual'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'v0.dev does not have a public API. Subscription info must be entered manually or synced via AI agent.'
    };
  }

  async fetchDomains(): Promise<Domain[]> {
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [];
  }
}
