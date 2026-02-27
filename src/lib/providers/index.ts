// Provider registry - maps provider types to their implementations
import { ProviderInterface } from './base';
import { CloudflareProvider } from './cloudflare';
import { ArvanCloudProvider } from './arvancloud';
import { NicIrProvider } from './nicir';
import { NamesComProvider } from './namescom';
import { DigitalOceanProvider } from './digitalocean';
import { ReplitProvider } from './replit';
import { BoltNewProvider } from './boltnew';
import { RocketNewProvider } from './rocketnew';
import { V0Provider } from './v0';
import { OpenAIProvider } from './openai';
import { GitHubProvider } from './github';
import { AnthropicProvider } from './anthropic';
import { DeepSeekProvider } from './deepseek';
import { GoogleProvider } from './google';
import { AtakDomainProvider } from './atakdomain';
import { OdooProvider } from './odoo';
import {
  createGrokProvider,
  createPerplexityProvider,
  createRenderProvider,
  createSlackProvider,
  createTitanMailProvider,
  createOpenRouterProvider,
  createNsupProvider,
  createSpadServerProvider,
  createGoogleWorkspaceProvider,
} from './generic';

export type { ProviderInterface, ProviderConfig } from './base';

const providerRegistry: Record<string, () => ProviderInterface> = {
  // Domain & Infrastructure Providers
  cloudflare: () => new CloudflareProvider(),
  arvancloud: () => new ArvanCloudProvider(),
  nicir: () => new NicIrProvider(),
  namescom: () => new NamesComProvider(),
  digitalocean: () => new DigitalOceanProvider(),
  nsup: () => createNsupProvider(),
  spadserver: () => createSpadServerProvider(),
  atakdomain: () => new AtakDomainProvider(),

  // AI Development Platforms
  replit: () => new ReplitProvider(),
  boltnew: () => new BoltNewProvider(),
  rocketnew: () => new RocketNewProvider(),
  v0: () => new V0Provider(),

  // AI API Providers
  openai: () => new OpenAIProvider(),
  anthropic: () => new AnthropicProvider(),
  deepseek: () => new DeepSeekProvider(),
  google: () => new GoogleProvider(),
  grok: () => createGrokProvider(),
  perplexity: () => createPerplexityProvider(),
  openrouter: () => createOpenRouterProvider(),

  // Collaboration & Services
  github: () => new GitHubProvider(),
  render: () => createRenderProvider(),
  slack: () => createSlackProvider(),
  titanmail: () => createTitanMailProvider(),
  googleworkspace: () => createGoogleWorkspaceProvider(),

  // ERP & Business
  odoo: () => new OdooProvider(),
};

export function createProvider(type: string): ProviderInterface | null {
  const factory = providerRegistry[type];
  if (!factory) return null;
  return factory();
}

export function getAvailableProviders(): string[] {
  return Object.keys(providerRegistry);
}

export function getProviderInfo(): Array<{
  type: string;
  name: string;
  supportsAPI: boolean;
  supportsDomains: boolean;
  supportsSubscriptions: boolean;
  authMethods: string[];
}> {
  return Object.entries(providerRegistry).map(([type, factory]) => {
    const provider = factory();
    return {
      type,
      name: provider.name,
      supportsAPI: provider.supportsAPI,
      supportsDomains: provider.supportsDomains,
      supportsSubscriptions: provider.supportsSubscriptions,
      authMethods: provider.authMethods,
    };
  });
}
