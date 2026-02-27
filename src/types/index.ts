export interface UserConfiguration {
  currency: string;
  showCurrencySymbol: boolean;
}

export interface Subscription {
  id?: number;
  name: string;
  amount: number;
  dueDate: string;
  due_date?: string;
  icon?: string;
  color?: string;
  account?: string;
  autopay: boolean;
  intervalValue: number;
  intervalUnit: string;
  interval_value?: number;
  interval_unit?: 'days' | 'weeks' | 'months' | 'years';
  notify: boolean;
  currency: string;
  included?: boolean;
  tags?: string[];
}

export interface NtfySettings {
  topic: string;
  domain?: string;
}

export interface ApiResponse<T> {
  data?: T;
  error?: string;
  message?: string;
}

// ==================== NEW TYPES FOR DOMAIN & SUBSCRIPTION TRACKER ====================

export type ProviderType =
  | 'cloudflare'
  | 'arvancloud'
  | 'nicir'
  | 'namescom'
  | 'digitalocean'
  | 'replit'
  | 'boltnew'
  | 'rocketnew'
  | 'v0'
  | 'nsup'
  | 'spadserver'
  | 'openai'
  | 'anthropic'
  | 'deepseek'
  | 'google'
  | 'grok'
  | 'perplexity'
  | 'openrouter'
  | 'github'
  | 'googleworkspace'
  | 'render'
  | 'slack'
  | 'titanmail'
  | 'atakdomain';

export interface Provider {
  id?: number;
  name: string;
  type: ProviderType;
  icon: string;
  color: string;
  apiEndpoint?: string;
  authMethod: string;
  isActive: boolean;
  is_active?: boolean;  // snake_case from DB
  lastSync?: string;
  last_sync?: string;   // snake_case from DB
  syncStatus?: string;
  sync_status?: string; // snake_case from DB
  syncError?: string;
  sync_error?: string;  // snake_case from DB
  auth_method?: string; // snake_case from DB
}

export interface ProviderCredential {
  id?: number;
  providerId: number;
  credentialType: 'api_key' | 'api_token' | 'email' | 'password' | 'oauth_token' | 'totp_secret' | 'webhook_url';
  credentialKey: string;
  credentialValue: string;
  isEncrypted: boolean;
}

export interface Domain {
  id?: number;
  providerId: number;
  providerName?: string;
  providerType?: ProviderType;
  domainName: string;
  registrar?: string;
  expiryDate?: string;
  expiryDateJalali?: string;
  autoRenew: boolean;
  status: 'active' | 'expired' | 'expiring_soon' | 'pending' | 'transferred' | 'unknown';
  dnsProvider?: string;
  sslStatus?: 'active' | 'expired' | 'none' | 'pending';
  sslExpiry?: string;
  renewalCost?: number;
  renewalCurrency?: string;
  renewalCostToman?: number;
  paymentMethod?: string;
  hasActivePaymentMethod: boolean;
  nameservers?: string;
  lastChecked?: string;
  notes?: string;
}

export interface ServiceSubscription {
  id?: number;
  providerId: number;
  providerName?: string;
  providerType?: ProviderType;
  serviceName: string;
  planName?: string;
  status: 'active' | 'expired' | 'expiring_soon' | 'cancelled' | 'trial' | 'paused' | 'unknown';
  startDate?: string;
  expiryDate?: string;
  expiryDateJalali?: string;
  autoRenew: boolean;
  renewalCost?: number;
  renewalCurrency?: string;
  renewalCostToman?: number;
  billingCycle?: 'monthly' | 'yearly' | 'weekly' | 'one_time' | 'custom';
  paymentMethod?: string;
  hasActivePaymentMethod: boolean;
  lastChecked?: string;
  notes?: string;
}

export interface CurrencyRate {
  id?: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  lastUpdated: string;
  source: string;
}

export interface DomainStatusReport {
  domain: Domain;
  expiryGregorian: string;
  expiryJalali: string;
  expiryTimeUTC: string;
  expiryTimeIran: string;
  daysUntilExpiry: number;
  renewalCostBase: string;
  renewalCostToman: string;
  autoRenew: boolean;
  hasPaymentMethod: boolean;
  paymentMethod: string;
  status: string;
}

export interface SubscriptionStatusReport {
  subscription: ServiceSubscription;
  expiryGregorian: string;
  expiryJalali: string;
  expiryTimeUTC: string;
  expiryTimeIran: string;
  daysUntilExpiry: number;
  renewalCostBase: string;
  renewalCostToman: string;
  autoRenew: boolean;
  hasPaymentMethod: boolean;
  paymentMethod: string;
  status: string;
}

export interface ProviderSyncResult {
  providerId: number;
  providerName: string;
  success: boolean;
  domainsFound: number;
  subscriptionsFound: number;
  errors: string[];
  timestamp: string;
}

export interface DashboardSummary {
  totalDomains: number;
  activeDomains: number;
  expiringDomains: number;
  expiredDomains: number;
  totalSubscriptions: number;
  activeSubscriptions: number;
  expiringSubscriptions: number;
  totalMonthlyCostUSD: number;
  totalMonthlyCostToman: number;
  providers: Provider[];
}
