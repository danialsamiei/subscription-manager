import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class RocketNewProvider extends BaseProvider {
  readonly name = 'Rocket.new';
  readonly type = 'rocketnew';
  readonly supportsAPI = false;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['login_2fa', 'manual'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: 'Rocket.new does not have a public API. Subscription info must be entered manually or synced via AI agent.'
    };
  }

  async fetchDomains(): Promise<Domain[]> {
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [];
  }
}
