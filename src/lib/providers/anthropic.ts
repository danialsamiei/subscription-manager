import { BaseProvider } from './base';
import { ServiceSubscription } from '@/types';

export class AnthropicProvider extends BaseProvider {
  readonly name = 'Claude (Anthropic)';
  readonly type = 'anthropic';
  readonly supportsAPI = true;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  private async apiRequest(path: string): Promise<any> {
    const apiKey = this.getCredential('api_key');
    if (!apiKey) throw new Error('Anthropic API key required');

    const response = await fetch(`https://api.anthropic.com/v1${path}`, {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) throw new Error(`Anthropic API error ${response.status}`);
    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      // Test with a minimal message
      const result = await this.apiRequest('/messages');
      return { success: true, message: 'Anthropic API connection successful' };
    } catch (error) {
      // A 400 error still means the API key is valid
      const msg = error instanceof Error ? error.message : String(error);
      if (msg.includes('400')) {
        return { success: true, message: 'Anthropic API key validated (400 = key works, no message body sent)' };
      }
      return { success: false, message: `Connection failed: ${msg}` };
    }
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [{
      providerId: this.config?.providerId || 0,
      serviceName: 'Claude API (Anthropic)',
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
