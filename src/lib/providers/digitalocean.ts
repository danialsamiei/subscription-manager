import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class DigitalOceanProvider extends BaseProvider {
  readonly name = 'DigitalOcean';
  readonly type = 'digitalocean';
  readonly supportsAPI = true;
  readonly supportsDomains = true;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  private async apiRequest(path: string, options: RequestInit = {}): Promise<any> {
    const apiToken = this.getCredential('api_token');

    if (!apiToken) {
      throw new Error('DigitalOcean requires an API token');
    }

    const response = await fetch(`https://api.digitalocean.com/v2${path}`, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiToken}`,
        ...options.headers,
      }
    });

    if (!response.ok) {
      const errorData = await response.text();
      throw new Error(`DigitalOcean API error ${response.status}: ${errorData}`);
    }

    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const result = await this.apiRequest('/account');
      if (result.account) {
        return {
          success: true,
          message: `DigitalOcean connected. Account: ${result.account.email}, Status: ${result.account.status}`
        };
      }
      return { success: false, message: 'Account info not available' };
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
          domainName: d.name,
          registrar: 'External (DNS on DigitalOcean)',
          dnsProvider: 'DigitalOcean',
          status: 'active',
          autoRenew: false,
          hasActivePaymentMethod: true,
          nameservers: 'ns1.digitalocean.com, ns2.digitalocean.com, ns3.digitalocean.com',
          lastChecked: new Date().toISOString(),
          notes: `Zone file: ${d.zone_file ? 'Yes' : 'No'}`,
        });
      }
    } catch (error) {
      console.error('DigitalOcean fetchDomains error:', error);
    }

    return domains;
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const subscriptions: ServiceSubscription[] = [];

    try {
      // Fetch Droplets
      const dropletsResult = await this.apiRequest('/droplets');
      for (const droplet of dropletsResult.droplets || []) {
        const monthlyCost = droplet.size?.price_monthly || 0;
        subscriptions.push({
          providerId: this.config?.providerId || 0,
          serviceName: `Droplet: ${droplet.name}`,
          planName: droplet.size_slug,
          status: droplet.status === 'active' ? 'active' : 'unknown',
          startDate: droplet.created_at,
          autoRenew: true, // Droplets auto-bill
          renewalCost: monthlyCost,
          renewalCurrency: 'USD',
          billingCycle: 'monthly',
          hasActivePaymentMethod: true,
          lastChecked: new Date().toISOString(),
          notes: `Region: ${droplet.region?.slug}, Image: ${droplet.image?.slug}`,
        });
      }

      // Fetch Databases
      try {
        const dbResult = await this.apiRequest('/databases');
        for (const db of dbResult.databases || []) {
          subscriptions.push({
            providerId: this.config?.providerId || 0,
            serviceName: `Database: ${db.name}`,
            planName: `${db.engine} - ${db.size}`,
            status: db.status === 'online' ? 'active' : 'unknown',
            startDate: db.created_at,
            autoRenew: true,
            renewalCost: db.monthly_cost || 0,
            renewalCurrency: 'USD',
            billingCycle: 'monthly',
            hasActivePaymentMethod: true,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch { /* No databases */ }

      // Fetch Apps
      try {
        const appsResult = await this.apiRequest('/apps');
        for (const app of appsResult.apps || []) {
          subscriptions.push({
            providerId: this.config?.providerId || 0,
            serviceName: `App Platform: ${app.spec?.name || 'Unknown'}`,
            planName: app.tier_slug || 'Unknown',
            status: app.active_deployment ? 'active' : 'unknown',
            startDate: app.created_at,
            autoRenew: true,
            renewalCost: app.monthly_cost || 0,
            renewalCurrency: 'USD',
            billingCycle: 'monthly',
            hasActivePaymentMethod: true,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch { /* No apps */ }

      // Fetch Kubernetes clusters
      try {
        const k8sResult = await this.apiRequest('/kubernetes/clusters');
        for (const cluster of k8sResult.kubernetes_clusters || []) {
          subscriptions.push({
            providerId: this.config?.providerId || 0,
            serviceName: `K8s: ${cluster.name}`,
            planName: `${cluster.version} - ${cluster.node_pools?.[0]?.size || 'Unknown'}`,
            status: cluster.status?.state === 'running' ? 'active' : 'unknown',
            startDate: cluster.created_at,
            autoRenew: true,
            renewalCost: cluster.monthly_cost || 0,
            renewalCurrency: 'USD',
            billingCycle: 'monthly',
            hasActivePaymentMethod: true,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch { /* No K8s clusters */ }

    } catch (error) {
      console.error('DigitalOcean fetchSubscriptions error:', error);
    }

    return subscriptions;
  }
}
