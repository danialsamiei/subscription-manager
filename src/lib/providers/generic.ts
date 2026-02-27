import { BaseProvider } from './base';
import { ServiceSubscription } from '@/types';

// Generic provider for services without specific API integrations
// Used for: Grok/xAI, Perplexity, Render, Slack, Titan Mail, OpenRouter,
// NSUP, SpadServer, Google Workspace, etc.

export class GenericProvider extends BaseProvider {
  readonly name: string;
  readonly type: string;
  readonly supportsAPI: boolean;
  readonly supportsDomains: boolean;
  readonly supportsSubscriptions = true;
  readonly authMethods: string[];

  constructor(config: {
    name: string;
    type: string;
    supportsAPI?: boolean;
    supportsDomains?: boolean;
    authMethods?: string[];
  }) {
    super();
    this.name = config.name;
    this.type = config.type;
    this.supportsAPI = config.supportsAPI ?? false;
    this.supportsDomains = config.supportsDomains ?? false;
    this.authMethods = config.authMethods ?? ['manual'];
  }

  async testConnection(): Promise<{ success: boolean; message: string }> {
    return {
      success: true,
      message: `${this.name}: Credentials stored. Manual entry or AI agent sync available.`
    };
  }

  async fetchSubscriptions(): Promise<ServiceSubscription[]> {
    return [];
  }
}

// Pre-configured generic providers
export function createGrokProvider() {
  return new GenericProvider({
    name: 'Grok / xAI',
    type: 'grok',
    supportsAPI: true,
    authMethods: ['api_key'],
  });
}

export function createPerplexityProvider() {
  return new GenericProvider({
    name: 'Perplexity',
    type: 'perplexity',
    supportsAPI: true,
    authMethods: ['api_key'],
  });
}

export function createRenderProvider() {
  return new GenericProvider({
    name: 'Render',
    type: 'render',
    supportsAPI: true,
    authMethods: ['api_key'],
  });
}

export function createSlackProvider() {
  return new GenericProvider({
    name: 'Slack',
    type: 'slack',
    supportsAPI: true,
    authMethods: ['api_key', 'oauth'],
  });
}

export function createTitanMailProvider() {
  return new GenericProvider({
    name: 'Titan Mail',
    type: 'titanmail',
    supportsAPI: false,
    authMethods: ['login_2fa', 'manual'],
  });
}

export function createOpenRouterProvider() {
  return new GenericProvider({
    name: 'OpenRouter',
    type: 'openrouter',
    supportsAPI: true,
    authMethods: ['api_key'],
  });
}

export function createNsupProvider() {
  return new GenericProvider({
    name: 'NSUP.com',
    type: 'nsup',
    supportsAPI: false,
    supportsDomains: true,
    authMethods: ['login_2fa', 'manual'],
  });
}

export function createSpadServerProvider() {
  return new GenericProvider({
    name: 'SpadServer Cloud',
    type: 'spadserver',
    supportsAPI: false,
    supportsDomains: true,
    authMethods: ['login_2fa', 'manual'],
  });
}

export function createGoogleWorkspaceProvider() {
  return new GenericProvider({
    name: 'Google Workspace',
    type: 'googleworkspace',
    supportsAPI: true,
    supportsDomains: true,
    authMethods: ['oauth', 'api_key'],
  });
}
