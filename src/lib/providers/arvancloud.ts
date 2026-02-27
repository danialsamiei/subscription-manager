import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class ArvanCloudProvider extends BaseProvider {
  readonly name = 'ArvanCloud';
  readonly type = 'arvancloud';
  readonly supportsAPI = true;
  readonly supportsDomains = true;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
    const apiKey = this.getCredential('api_key');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'Authorization': apiKey ? `Apikey ${apiKey}` : '',
    };

    const response = await fetch(`https://napi.arvancloud.ir${path}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`ArvanCloud API error ${response.status}: ${errorData}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiRequest('/cdn/4.0/domains');
      return { success: true, message: `ArvanCloud connected. Found ${result.data?.length || 0} domains.` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchDomains(): Promise<Domain[]> {
    const domains: Domain[] = [];

    try {
      // Fetch CDN domains
      const result = await this.apiRequest('/cdn/4.0/domains');
      const domainList = result.data || [];

      for (const d of domainList) {
        domains.push({
          providerId: this.config?.providerId || 0,
          domainName: d.domain || d.name,
          registrar: 'ArvanCloud',
          expiryDate: d.plan_expiry_date || d.expires_at || undefined,
          autoRenew: d.auto_renew ?? false,
          status: d.status === 'active' ? 'active' : d.status === 'pending' ? 'pending' : 'unknown',
          dnsProvider: 'ArvanCloud',
          sslStatus: d.ssl?.certificate_mode ? 'active' : 'none',
          renewalCost: d.plan_price || undefined,
          renewalCurrency: d.currency || 'IRR',
          hasActivePaymentMethod: false,
          nameservers: d.ns_keys ? d.ns_keys.join(', ') : undefined,
          lastChecked: new Date().toISOString(),
        });
      }
    } catch (error) {
      console.error('ArvanCloud fetchDomains error:', error);
    }

    return domains;
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const subscriptions: ServiceSubscription[] = [];

    try {
      // Fetch cloud services (CDN, Cloud Server, etc.)
      const result = await this.apiRequest('/cdn/4.0/domains');
      const domainList = result.data || [];

      // Group by plan type
      const planTypes = new Set<string>();
      for (const d of domainList) {
        if (d.plan_name) planTypes.add(d.plan_name);
      }

      for (const planName of Array.from(planTypes)) {
        const domainsOnPlan = domainList.filter((d: any) => d.plan_name === planName);
        subscriptions.push({
          providerId: this.config?.providerId || 0,
          serviceName: 'ArvanCloud CDN',
          planName: planName,
          status: 'active',
          autoRenew: false,
          renewalCost: domainsOnPlan[0]?.plan_price || 0,
          renewalCurrency: 'IRR',
          billingCycle: 'monthly',
          hasActivePaymentMethod: false,
          lastChecked: new Date().toISOString(),
          notes: `${domainsOnPlan.length} domain(s) on this plan`,
        });
      }
    } catch (error) {
      console.error('ArvanCloud fetchSubscriptions error:', error);
    }

    return subscriptions;
  }
}
