import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class CloudflareProvider extends BaseProvider {
  readonly name = 'Cloudflare';
  readonly type = 'cloudflare';
  readonly supportsAPI = true;
  readonly supportsDomains = true;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key', 'api_token'];

  private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
    const apiToken = this.getCredential('api_token');
    const apiKey = this.getCredential('api_key');
    const email = this.getCredential('email');

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    if (apiToken) {
      headers['Authorization'] = `Bearer ${apiToken}`;
    } else if (apiKey && email) {
      headers['X-Auth-Key'] = apiKey;
      headers['X-Auth-Email'] = email;
    }

    const response = await fetch(`https://api.cloudflare.com/client/v4${path}`, {
      ...options,
      headers: { ...headers, ...options.headers }
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(`Cloudflare API error ${response.status}: ${JSON.stringify(errorData)}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiRequest('/user/tokens/verify');
      if (result.success) {
        return { success: true, message: 'Cloudflare API connection successful' };
      }
      return { success: false, message: 'Token verification failed' };
    } catch (error) {
      // Try with API key/email
      try {
        const result = await this.apiRequest('/user');
        if (result.success) {
          return { success: true, message: 'Cloudflare API connection successful' };
        }
      } catch {
        // Both methods failed
      }
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchDomains(): Promise<Domain[]> {
    const domains: Domain[] = [];

    try {
      // Fetch zones (domains)
      const zonesResult = await this.apiRequest('/zones?per_page=50');
      if (!zonesResult.success) return domains;

      for (const zone of zonesResult.result || []) {
        // Fetch registrar info for each domain
        let registrarInfo: any = null;
        try {
          const regResult = await this.apiRequest(`/zones/${zone.id}/registrar`);
          if (regResult.success && regResult.result) {
            registrarInfo = regResult.result;
          }
        } catch {
          // Domain may not be registered via Cloudflare
        }

        const domain: Domain = {
          providerId: this.config?.providerId || 0,
          domainName: zone.name,
          registrar: registrarInfo ? 'Cloudflare Registrar' : (zone.original_registrar || 'External'),
          expiryDate: registrarInfo?.expires_at || zone.name_servers_expires_at || undefined,
          autoRenew: registrarInfo?.auto_renew ?? false,
          status: zone.status === 'active' ? 'active' : 'unknown',
          dnsProvider: 'Cloudflare',
          sslStatus: zone.ssl?.status === 'active' ? 'active' : 'pending',
          sslExpiry: zone.ssl?.certificate_expires_at || undefined,
          renewalCost: registrarInfo?.renewal_price || undefined,
          renewalCurrency: 'USD',
          paymentMethod: registrarInfo?.payment_method || undefined,
          hasActivePaymentMethod: !!registrarInfo?.payment_method,
          nameservers: (zone.name_servers || []).join(', '),
          lastChecked: new Date().toISOString(),
        };

        domains.push(domain);
      }
    } catch (error) {
      console.error('Cloudflare fetchDomains error:', error);
    }

    return domains;
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const subscriptions: ServiceSubscription[] = [];

    try {
      // Fetch account subscriptions
      const accountResult = await this.apiRequest('/user');
      if (accountResult.success) {
        const user = accountResult.result;

        // Get subscriptions
        try {
          const subsResult = await this.apiRequest('/user/subscriptions');
          if (subsResult.success) {
            for (const sub of subsResult.result || []) {
              subscriptions.push({
                providerId: this.config?.providerId || 0,
                serviceName: sub.name || 'Cloudflare Plan',
                planName: sub.plan?.name || sub.name,
                status: sub.state === 'active' ? 'active' : 'unknown',
                startDate: sub.current_period_start,
                expiryDate: sub.current_period_end,
                autoRenew: true,
                renewalCost: sub.price || 0,
                renewalCurrency: sub.currency || 'USD',
                billingCycle: sub.frequency === 'monthly' ? 'monthly' : 'yearly',
                hasActivePaymentMethod: true,
                lastChecked: new Date().toISOString(),
              });
            }
          }
        } catch {
          // Free plan may not have subscriptions
          subscriptions.push({
            providerId: this.config?.providerId || 0,
            serviceName: 'Cloudflare',
            planName: 'Free Plan',
            status: 'active',
            autoRenew: false,
            renewalCost: 0,
            renewalCurrency: 'USD',
            billingCycle: 'monthly',
            hasActivePaymentMethod: false,
            lastChecked: new Date().toISOString(),
          });
        }
      }
    } catch (error) {
      console.error('Cloudflare fetchSubscriptions error:', error);
    }

    return subscriptions;
  }
}
