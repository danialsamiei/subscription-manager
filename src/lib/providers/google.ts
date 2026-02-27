import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class GoogleProvider extends BaseProvider {
  readonly name = 'Google (Gemini & Workspace)';
  readonly type = 'google';
  readonly supportsAPI = true;
  readonly supportsDomains = true;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key', 'oauth'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const apiKey = this.getCredential('api_key');
    if (!apiKey) {
      return { success: false, message: 'Google API key required. For Gemini use the Gemini API key.' };
    }

    try {
      const response = await fetch(`https://generativelanguage.googleapis.com/v1/models?key=${apiKey}`);
      if (response.ok) {
        const data = await response.json();
        return { success: true, message: `Google Gemini connected. ${data.models?.length || 0} models available.` };
      }
      return { success: false, message: `Google API error: ${response.status}` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchDomains(): Promise<Domain[]> {
    // Google Workspace domains would need Admin SDK
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const subs: ServiceSubscription[] = [];

    // Gemini API
    const apiKey = this.getCredential('api_key');
    if (apiKey) {
      subs.push({
        providerId: this.config?.providerId || 0,
        serviceName: 'Google Gemini API',
        planName: 'Pay-as-you-go',
        status: 'active',
        autoRenew: true,
        renewalCurrency: 'USD',
        billingCycle: 'monthly',
        hasActivePaymentMethod: true,
        lastChecked: new Date().toISOString(),
      });
    }

    return subs;
  }
}
