import { BaseProvider } from './base';
import { ServiceSubscription } from '@/types';

export class DeepSeekProvider extends BaseProvider {
  readonly name = 'DeepSeek';
  readonly type = 'deepseek';
  readonly supportsAPI = true;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = this.getCredential('api_key');
    if (!apiKey) {
      return { success: false, message: 'DeepSeek API key required' };
    }

    try {
      const response = await fetch('https://api.deepseek.com/models', {
        headers: { 'Authorization': `Bearer ${apiKey}` }
      });
      if (response.ok) {
        return { success: true, message: 'DeepSeek API connected successfully' };
      }
      return { success: false, message: `DeepSeek API error: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [{
      providerId: this.config?.providerId || 0,
      serviceName: 'DeepSeek API',
      planName: 'Pay-as-you-go',
      status: 'active',
      autoRenew: true,
      renewalCurrency: 'USD',
      billingCycle: 'monthly',
      hasActivePaymentMethod: true,
      lastChecked: new Date().toISOString(),
    }];
  }
}
