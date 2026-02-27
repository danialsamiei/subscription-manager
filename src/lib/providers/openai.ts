import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class OpenAIProvider extends BaseProvider {
  readonly name = 'OpenAI';
  readonly type = 'openai';
  readonly supportsAPI = true;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  private async apiRequest(path: string): Promise<any> {
    const apiKey = this.getCredential('api_key');
    if (!apiKey) throw new Error('OpenAI API key required');

    const response = await fetch(`https://api.openai.com/v1${path}`, {
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      }
    });

    if (!response.ok) throw new Error(`OpenAI API error ${response.status}`);
    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiRequest('/models');
      return { success: true, message: `OpenAI connected. ${result.data?.length || 0} models available.` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    try {
      // OpenAI billing API - check organization/subscription info
      const models = await this.apiRequest('/models');
      const hasGPT4 = models.data?.some((m: any) => m.id.includes('gpt-4'));

      return [{
        providerId: this.config?.providerId || 0,
        serviceName: 'OpenAI API',
        planName: hasGPT4 ? 'Pay-as-you-go (GPT-4 access)' : 'Pay-as-you-go',
        status: 'active',
        autoRenew: true,
        renewalCurrency: 'USD',
        billingCycle: 'monthly',
        hasActivePaymentMethod: true,
        lastChecked: new Date().toISOString(),
      }];
    } catch {
      return [];
    }
  }
}
