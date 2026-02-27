import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import fs from 'fs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_PATH = path.join(DB_DIR, 'subscriptions.db');

// Ensure data directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export async function getDb() {
  return open({
    filename: DB_PATH,
    driver: sqlite3.Database
  });
}

export async function initializeDb() {
  const db = await getDb();

  // Create user_configuration table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS user_configuration (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      currency TEXT NOT NULL,
      show_currency_symbol INTEGER NOT NULL DEFAULT 1
    )
  `);

  // Create subscriptions table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      amount REAL NOT NULL,
      due_date TEXT NOT NULL,
      icon TEXT,
      color TEXT,
      account TEXT,
      autopay INTEGER NOT NULL DEFAULT 0,
      interval_value INTEGER NOT NULL DEFAULT 1,
      interval_unit TEXT NOT NULL,
      notify INTEGER NOT NULL DEFAULT 0,
      currency TEXT DEFAULT 'default',
      tags TEXT
    )
  `);

  // Create ntfy_settings table
  await db.exec(`
    CREATE TABLE IF NOT EXISTS ntfy_settings (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      topic TEXT NOT NULL,
      domain TEXT DEFAULT 'https://ntfy.sh'
    )
  `);

  // ==================== NEW TABLES FOR DOMAIN & SUBSCRIPTION TRACKER ====================

  // Providers table - stores service provider info (Cloudflare, ArvanCloud, etc.)
  await db.exec(`
    CREATE TABLE IF NOT EXISTS providers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      type TEXT NOT NULL,
      icon TEXT DEFAULT '',
      color TEXT DEFAULT '#03DAC6',
      api_endpoint TEXT,
      auth_method TEXT NOT NULL DEFAULT 'manual',
      is_active INTEGER NOT NULL DEFAULT 1,
      last_sync TEXT,
      sync_status TEXT DEFAULT 'idle',
      sync_error TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `);

  // Provider credentials - securely store API keys, tokens, etc.
  await db.exec(`
    CREATE TABLE IF NOT EXISTS provider_credentials (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      credential_type TEXT NOT NULL,
      credential_key TEXT NOT NULL,
      credential_value TEXT NOT NULL,
      is_encrypted INTEGER NOT NULL DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    )
  `);

  // Domains table - track domain registrations across providers
  await db.exec(`
    CREATE TABLE IF NOT EXISTS domains (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      domain_name TEXT NOT NULL,
      registrar TEXT,
      expiry_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      status TEXT DEFAULT 'unknown',
      dns_provider TEXT,
      ssl_status TEXT DEFAULT 'none',
      ssl_expiry TEXT,
      renewal_cost REAL,
      renewal_currency TEXT DEFAULT 'USD',
      payment_method TEXT,
      has_active_payment_method INTEGER NOT NULL DEFAULT 0,
      nameservers TEXT,
      last_checked TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    )
  `);

  // Service subscriptions table - track service plans across providers
  await db.exec(`
    CREATE TABLE IF NOT EXISTS service_subscriptions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      service_name TEXT NOT NULL,
      plan_name TEXT,
      status TEXT DEFAULT 'unknown',
      start_date TEXT,
      expiry_date TEXT,
      auto_renew INTEGER NOT NULL DEFAULT 0,
      renewal_cost REAL,
      renewal_currency TEXT DEFAULT 'USD',
      billing_cycle TEXT DEFAULT 'monthly',
      payment_method TEXT,
      has_active_payment_method INTEGER NOT NULL DEFAULT 0,
      last_checked TEXT,
      notes TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    )
  `);

  // Currency rates cache
  await db.exec(`
    CREATE TABLE IF NOT EXISTS currency_rates (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      from_currency TEXT NOT NULL,
      to_currency TEXT NOT NULL,
      rate REAL NOT NULL,
      last_updated TEXT DEFAULT (datetime('now')),
      source TEXT DEFAULT 'manual',
      UNIQUE(from_currency, to_currency)
    )
  `);

  // Sync logs for tracking provider sync history
  await db.exec(`
    CREATE TABLE IF NOT EXISTS sync_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      provider_id INTEGER NOT NULL,
      sync_type TEXT DEFAULT 'manual',
      status TEXT DEFAULT 'started',
      domains_found INTEGER DEFAULT 0,
      subscriptions_found INTEGER DEFAULT 0,
      errors TEXT,
      started_at TEXT DEFAULT (datetime('now')),
      completed_at TEXT,
      FOREIGN KEY (provider_id) REFERENCES providers(id) ON DELETE CASCADE
    )
  `);

  // Check if we need to insert default user configuration
  const config = await db.get('SELECT * FROM user_configuration ORDER BY id DESC LIMIT 1');
  if (!config) {
    await db.run(
      'INSERT INTO user_configuration (currency, show_currency_symbol) VALUES (?, ?)',
      ['USD', 1]
    );
  }

  // Seed default providers if none exist
  const providerCount = await db.get('SELECT COUNT(*) as count FROM providers');
  if (providerCount?.count === 0) {
    await seedDefaultProviders(db);
  }

  // Seed default currency rates if none exist
  const rateCount = await db.get('SELECT COUNT(*) as count FROM currency_rates');
  if (rateCount?.count === 0) {
    await seedDefaultCurrencyRates(db);
  }

  await db.close();
}

async function seedDefaultProviders(db: any) {
  const providers = [
    // Domain & Infrastructure Providers
    { name: 'Cloudflare', type: 'cloudflare', icon: 'simple-icons:cloudflare', color: '#F38020', api_endpoint: 'https://api.cloudflare.com/client/v4', auth_method: 'api_key' },
    { name: 'ArvanCloud', type: 'arvancloud', icon: 'simple-icons:icloud', color: '#4C9BD9', api_endpoint: 'https://napi.arvancloud.ir', auth_method: 'api_key' },
    { name: 'NIC.ir', type: 'nicir', icon: 'mdi:earth', color: '#00875A', api_endpoint: 'https://www.nic.ir', auth_method: 'login_2fa' },
    { name: 'Names.com', type: 'namescom', icon: 'mdi:domain', color: '#0066CC', api_endpoint: 'https://api.name.com/v4', auth_method: 'api_key' },
    { name: 'DigitalOcean', type: 'digitalocean', icon: 'simple-icons:digitalocean', color: '#0080FF', api_endpoint: 'https://api.digitalocean.com/v2', auth_method: 'api_key' },
    { name: 'NSUP.com', type: 'nsup', icon: 'mdi:server', color: '#2196F3', api_endpoint: 'https://nsup.com', auth_method: 'login_2fa' },
    { name: 'SpadServer Cloud', type: 'spadserver', icon: 'mdi:cloud-outline', color: '#7C4DFF', api_endpoint: 'https://spadserver.com', auth_method: 'login_2fa' },

    // AI Development Platforms
    { name: 'Replit', type: 'replit', icon: 'simple-icons:replit', color: '#F26207', api_endpoint: 'https://replit.com', auth_method: 'login_2fa' },
    { name: 'Bolt.new', type: 'boltnew', icon: 'mdi:lightning-bolt', color: '#FFD700', api_endpoint: 'https://bolt.new', auth_method: 'login_2fa' },
    { name: 'Rocket.new', type: 'rocketnew', icon: 'mdi:rocket-launch', color: '#FF4500', api_endpoint: 'https://rocket.new', auth_method: 'login_2fa' },
    { name: 'v0', type: 'v0', icon: 'mdi:alpha-v-box', color: '#000000', api_endpoint: 'https://v0.dev', auth_method: 'login_2fa' },

    // AI API Providers
    { name: 'OpenAI', type: 'openai', icon: 'simple-icons:openai', color: '#412991', api_endpoint: 'https://api.openai.com/v1', auth_method: 'api_key' },
    { name: 'Claude (Anthropic)', type: 'anthropic', icon: 'mdi:robot-outline', color: '#D4A574', api_endpoint: 'https://api.anthropic.com/v1', auth_method: 'api_key' },
    { name: 'DeepSeek', type: 'deepseek', icon: 'mdi:brain', color: '#4A90D9', api_endpoint: 'https://api.deepseek.com', auth_method: 'api_key' },
    { name: 'Google Gemini', type: 'google', icon: 'simple-icons:google', color: '#4285F4', api_endpoint: 'https://generativelanguage.googleapis.com/v1', auth_method: 'api_key' },
    { name: 'Grok / xAI', type: 'grok', icon: 'mdi:alpha-x-box', color: '#1DA1F2', api_endpoint: 'https://api.x.ai/v1', auth_method: 'api_key' },
    { name: 'Perplexity', type: 'perplexity', icon: 'mdi:magnify', color: '#20B8CD', api_endpoint: 'https://api.perplexity.ai', auth_method: 'api_key' },
    { name: 'OpenRouter', type: 'openrouter', icon: 'mdi:router-network', color: '#6366F1', api_endpoint: 'https://openrouter.ai/api/v1', auth_method: 'api_key' },

    // Collaboration & Services
    { name: 'GitHub', type: 'github', icon: 'simple-icons:github', color: '#FFFFFF', api_endpoint: 'https://api.github.com', auth_method: 'api_key' },
    { name: 'Google Workspace', type: 'googleworkspace', icon: 'mdi:google', color: '#34A853', api_endpoint: 'https://www.googleapis.com', auth_method: 'oauth' },
    { name: 'Render', type: 'render', icon: 'mdi:server-network', color: '#46E3B7', api_endpoint: 'https://api.render.com/v1', auth_method: 'api_key' },
    { name: 'Slack', type: 'slack', icon: 'simple-icons:slack', color: '#4A154B', api_endpoint: 'https://slack.com/api', auth_method: 'api_key' },
    { name: 'Titan Mail', type: 'titanmail', icon: 'mdi:email', color: '#1E88E5', api_endpoint: 'https://titan.email', auth_method: 'login_2fa' },
  ];

  for (const p of providers) {
    await db.run(
      `INSERT INTO providers (name, type, icon, color, api_endpoint, auth_method, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [p.name, p.type, p.icon, p.color, p.api_endpoint, p.auth_method]
    );
  }
}

async function seedDefaultCurrencyRates(db: any) {
  const rates = [
    { from: 'USD', to: 'IRR', rate: 590000, source: 'fallback' },
    { from: 'EUR', to: 'IRR', rate: 640000, source: 'fallback' },
    { from: 'GBP', to: 'IRR', rate: 745000, source: 'fallback' },
    { from: 'AED', to: 'IRR', rate: 160000, source: 'fallback' },
    { from: 'TRY', to: 'IRR', rate: 18000, source: 'fallback' },
    { from: 'USD', to: 'EUR', rate: 0.92, source: 'fallback' },
    { from: 'USD', to: 'GBP', rate: 0.79, source: 'fallback' },
  ];

  for (const r of rates) {
    await db.run(
      `INSERT OR REPLACE INTO currency_rates (from_currency, to_currency, rate, source)
       VALUES (?, ?, ?, ?)`,
      [r.from, r.to, r.rate, r.source]
    );
  }
}
