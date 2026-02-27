import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class NamesComProvider extends BaseProvider {
  readonly name = 'Names.com';
  readonly type = 'namescom';
  readonly supportsAPI = true;
  readonly supportsDomains = true;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
    const username = this.getCredential('username');
    const apiToken = this.getCredential('api_token');

    if (!username || !apiToken) {
      throw new Error('Names.com requires username and API token');
    }

    const auth = Buffer.from(`${username}:${apiToken}`).toString('base64');

    const response = await fetch(`https://api.name.com/v4${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Basic ${auth}`,
        ...options.headers,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`Names.com API error ${response.status}: ${errorData}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      await this.apiRequest('/hello');
      return { success: true, message: 'Names.com API connection successful' };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchDomains(): Promise<Domain[]> {
    const domains: Domain[] = [];

    try {
      const result = await this.apiRequest('/domains');

      for (const d of result.domains || []) {
        domains.push({
          providerId: this.config?.providerId || 0,
          domainName: d.domainName,
          registrar: 'Name.com',
          expiryDate: d.expireDate,
          autoRenew: d.autorenewEnabled || false,
          status: d.locked ? 'active' : 'active',
          renewalCost: d.renewalPrice || undefined,
          renewalCurrency: 'USD',
          paymentMethod: undefined,
          hasActivePaymentMethod: d.autorenewEnabled || false,
          nameservers: (d.nameservers || []).join(', '),
          lastChecked: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Names.com fetchDomains error:', error);
    }

    return domains;
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const subscriptions: ServiceSubscription[] = [];

    try {
      // Names.com domain-related services
      const domains = await this.fetchDomains();
      if (domains.length > 0) {
        subscriptions.push({
          providerId: this.config?.providerId || 0,
          serviceName: 'Names.com Domain Registration',
          planName: `${domains.length} Domain(s)`,
          status: 'active',
          autoRenew: domains.some(d => d.autoRenew),
          renewalCost: domains.reduce((sum, d) => sum + (d.renewalCost || 0), 0),
          renewalCurrency: 'USD',
          billingCycle: 'yearly',
          hasActivePaymentMethod: domains.some(d => d.hasActivePaymentMethod),
          lastChecked: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('Names.com fetchSubscriptions error:', error);
    }

    return subscriptions;
  }
}
