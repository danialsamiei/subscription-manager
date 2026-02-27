import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class GitHubProvider extends BaseProvider {
  readonly name = 'GitHub';
  readonly type = 'github';
  readonly supportsAPI = true;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['api_key'];

  private async apiRequest(path: string): Promise<any> {
    const token = this.getCredential('api_token');
    if (!token) throw new Error('GitHub token required');

    const response = await fetch(`https://api.github.com${path}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/vnd.github+json',
        'X-GitHub-Api-Version': '2022-11-28',
      }
    });

    if (!response.ok) throw new Error(`GitHub API error ${response.status}`);
    return response.json();
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const user = await this.apiRequest('/user');
      return { success: true, message: `GitHub connected. User: ${user.login}, Plan: ${user.plan?.name || 'Free'}` };
    } catch (error) {
      return { success: false, message: `Connection failed: ${error instanceof Error ? error.message : String(error)}` };
    }
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const subs: ServiceSubscription[] = [];
    try {
      const user = await this.apiRequest('/user');
      const planName = user.plan?.name || 'Free';

      subs.push({
        providerId: this.config?.providerId || 0,
        serviceName: 'GitHub',
        planName: planName,
        status: 'active',
        autoRenew: planName !== 'free',
        renewalCost: planName === 'pro' ? 4 : planName === 'team' ? 4 : 0,
        renewalCurrency: 'USD',
        billingCycle: 'monthly',
        hasActivePaymentMethod: planName !== 'free',
        lastChecked: new Date().toISOString(),
        notes: `${user.public_repos || 0} public repos, ${user.total_private_repos || 0} private repos`,
      });

      // Check for Copilot subscription
      try {
        const copilot = await this.apiRequest('/user/copilot');
        if (copilot) {
          subs.push({
            providerId: this.config?.providerId || 0,
            serviceName: 'GitHub Copilot',
            planName: copilot.plan || 'Individual',
            status: 'active',
            autoRenew: true,
            renewalCost: 10,
            renewalCurrency: 'USD',
            billingCycle: 'monthly',
            hasActivePaymentMethod: true,
            lastChecked: new Date().toISOString(),
          });
        }
      } catch {
        // No Copilot subscription
      }
    } catch (error) {
      console.error('GitHub fetchSubscriptions error:', error);
    }
    return subs;
  }
}
