// Base provider interface for all service providers
import { Domain, ServiceSubscription, ProviderSyncResult, ProviderCredential } from '@/types';

export interface ProviderConfig {
  providerId: number;
  providerName: string;
  apiEndpoint?: string;
  credentials: ProviderCredential[];
}

export interface ProviderInterface {
  readonly name: string;
  readonly type: string;
  readonly supportsAPI: boolean;
  readonly supportsDomains: boolean;
  readonly supportsSubscriptions: boolean;
  readonly authMethods: string[];

  // Initialize provider with credentials
  configure(config: ProviderConfig): void;

  // Test connection / credentials
  testConnection(): Promise<{ success: boolean; message: string }>;

  // Fetch domains from provider
  fetchDomains(): Promise<Domain[]>;

  // Fetch service subscriptions from provider
  fetchSubscriptions(): Promise<ServiceSubscription[]>;

  // Full sync - fetches everything
  sync(): Promise<ProviderSyncResult>;
}

export abstract class BaseProvider implements ProviderInterface {
  abstract readonly name: string;
  abstract readonly type: string;
  abstract readonly supportsAPI: boolean;
  abstract readonly supportsDomains: boolean;
  abstract readonly supportsSubscriptions: boolean;
  abstract readonly authMethods: string[];

  protected config: ProviderConfig | null = null;

  configure(config: ProviderConfig): void {
    this.config = config;
  }

  protected getCredential(key: string): string | undefined {
    return this.config?.credentials.find(c => c.credentialKey === key)?.credentialValue;
  }

  protected getApiEndpoint(): string {
    return this.config?.apiEndpoint || '';
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    if (!this.config) {
      return { success: false, message: 'Provider not configured' };
    }
    return { success: true, message: 'Connection test not implemented for this provider' };
  }

  async fetchDomains(): Promise<Domain[]> {
    return [];
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [];
  }

  async sync(): Promise<ProviderSyncResult> {
    const timestamp = new Date().toISOString();
    const errors: string[] = [];
    let domainsFound = 0;
    let subscriptionsFound = 0;

    try {
      if (this.supportsDomains) {
        const domains = await this.fetchDomains();
        domainsFound = domains.length;
      }
    } catch (error) {
      errors.push(`Domain fetch error: ${error instanceof Error ? error.message : String(error)}`);
    }

    try {
      if (this.supportsSubscriptions) {
        const subs = await this.fetchSubscriptions();
        subscriptionsFound = subs.length;
      }
    } catch (error) {
      errors.push(`Subscription fetch error: ${error instanceof Error ? error.message : String(error)}`);
    }

    return {
      providerId: this.config?.providerId || 0,
      providerName: this.config?.providerName || this.name,
      success: errors.length === 0,
      domainsFound,
      subscriptionsFound,
      errors,
      timestamp
    };
  }
}
