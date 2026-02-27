import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';
import { odooAuthenticate, fetchOdooSubscriptions, fetchOdooInvoices } from '@/lib/odoo';

export class OdooProvider extends BaseProvider {
  readonly name = 'Orcest Odoo';
  readonly type = 'odoo';
  readonly supportsAPI = true;
  readonly supportsDomains = false;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['login_2fa'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const username = this.getCredential('username') || this.getCredential('email');
    const password = this.getCredential('password');

    if (!username || !password) {
      return { success: false, message: 'نام کاربری و رمز عبور Odoo الزامی است' };
    }

    try {
      const auth = await odooAuthenticate(username, password);
      if (auth) {
        return {
          success: true,
          message: `اتصال به Odoo موفق بود (UID: ${auth.uid})`,
        };
      }
      return { success: false, message: 'احراز هویت Odoo ناموفق بود' };
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      return { success: false, message: `خطا در اتصال به Odoo: ${msg}` };
    }
  }

  async fetchDomains(): Promise<Domain[]> {
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    const username = this.getCredential('username') || this.getCredential('email');
    const password = this.getCredential('password');

    if (!username || !password) return [];

    try {
      const auth = await odooAuthenticate(username, password);
      if (!auth) return [];

      const odooSubs = await fetchOdooSubscriptions(auth.uid, password);

      return odooSubs.map(sub => ({
        providerId: this.config?.providerId || 0,
        serviceName: sub.name || `Odoo #${sub.id}`,
        planName: sub.plan_id ? String(sub.plan_id[1] || '') : undefined,
        status: this.mapStatus(sub.subscription_state || sub.state),
        startDate: sub.date_order,
        expiryDate: sub.next_invoice_date || sub.validity_date,
        autoRenew: true,
        renewalCost: sub.amount_total,
        renewalCurrency: sub.currency_id ? String(sub.currency_id[1] || 'USD') : 'USD',
        billingCycle: 'monthly' as const,
        hasActivePaymentMethod: (sub.payment_token_ids?.length || 0) > 0,
        lastChecked: new Date().toISOString(),
      }));
    } catch (error) {
      console.error('Odoo subscription fetch failed:', error);
      return [];
    }
  }

  private mapStatus(state: string): ServiceSubscription['status'] {
    const map: Record<string, ServiceSubscription['status']> = {
      '3_progress': 'active',
      '4_paused': 'paused',
      '5_renewed': 'active',
      '6_churn': 'cancelled',
      'sale': 'active',
      'done': 'active',
      'cancel': 'cancelled',
      'draft': 'unknown',
    };
    return map[state] || 'unknown';
  }
}
