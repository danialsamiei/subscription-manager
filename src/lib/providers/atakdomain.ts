import { BaseProvider } from './base';
import { Domain, ServiceSubscription } from '@/types';

export class AtakDomainProvider extends BaseProvider {
  readonly name = 'Atak Domain';
  readonly type = 'atakdomain';
  readonly supportsAPI = false;
  readonly supportsDomains = true;
  readonly supportsSubscriptions = true;
  readonly authMethods = ['login_2fa', 'manual'];

  async testConnection(): Promise<{ success: boolean; message: string }> {
    const username = this.getCredential('username');
    const password = this.getCredential('password');

    if (!username || !password) {
      return { success: false, message: 'نام کاربری و رمز عبور الزامی است' };
    }

    try {
      // Attempt to reach the login page to verify connectivity
      const response = await fetch('https://www.atakdomain.com/clientarea.php', {
        method: 'HEAD',
        signal: AbortSignal.timeout(10000),
      });

      if (response.ok || response.status === 302 || response.status === 301) {
        return {
          success: true,
          message: 'اعتبارنامه‌ها ذخیره شد. همگام‌سازی دستی یا از طریق عامل هوشمند در دسترس است.',
        };
      }

      return {
        success: true,
        message: 'اعتبارنامه‌ها ذخیره شد. ورود خودکار به atakdomain.com.tr پشتیبانی نمی‌شود — از ورود دستی استفاده کنید.',
      };
    } catch {
      return {
        success: true,
        message: 'اعتبارنامه‌ها ذخیره شد. اتصال مستقیم به atakdomain.com.tr ممکن نیست — از ورود دستی استفاده کنید.',
      };
    }
  }

  async fetchDomains(): Promise<Domain[]> {
    // Atak Domain does not have a public API
    // Domains must be added manually or via AI agent scraping
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    // Subscriptions must be added manually or via AI agent scraping
    return [];
  }
}
