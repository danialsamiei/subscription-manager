import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// Map of Render environment variable names to provider types and credential keys
const ENV_TO_PROVIDER: Record<string, { providerType: string; credentialKey: string; credentialType: string }> = {
  OPENAI_API_KEY:      { providerType: 'openai',      credentialKey: 'api_key',  credentialType: 'api_key' },
  ANTHROPIC_API_KEY:   { providerType: 'anthropic',   credentialKey: 'api_key',  credentialType: 'api_key' },
  DEEPSEEK_API_KEY:    { providerType: 'deepseek',    credentialKey: 'api_key',  credentialType: 'api_key' },
  GEMINI_API_KEY:      { providerType: 'google',      credentialKey: 'api_key',  credentialType: 'api_key' },
  XAI_API_KEY:         { providerType: 'grok',        credentialKey: 'api_key',  credentialType: 'api_key' },
  OPENROUTER_API_KEY:  { providerType: 'openrouter',  credentialKey: 'api_key',  credentialType: 'api_key' },
  HF_TOKEN:            { providerType: 'github',      credentialKey: 'token',    credentialType: 'api_key' },
};

// POST /api/env-sync - Auto-configure providers from environment variables
export async function POST() {
  try {
    const db = await getDb();
    const results: Array<{ provider: string; status: string }> = [];

    for (const [envVar, mapping] of Object.entries(ENV_TO_PROVIDER)) {
      const value = process.env[envVar];
      if (!value) continue;

      // Find the provider
      const provider = await db.get(
        'SELECT id FROM providers WHERE type = ?',
        mapping.providerType
      );

      if (!provider) {
        results.push({ provider: mapping.providerType, status: 'سرویس‌دهنده یافت نشد' });
        continue;
      }

      // Check if credential already exists
      const existing = await db.get(
        'SELECT id FROM provider_credentials WHERE provider_id = ? AND credential_key = ?',
        [provider.id, mapping.credentialKey]
      );

      if (existing) {
        // Update
        await db.run(
          'UPDATE provider_credentials SET credential_value = ?, updated_at = datetime(\'now\') WHERE id = ?',
          [value, existing.id]
        );
        results.push({ provider: mapping.providerType, status: 'به‌روزرسانی شد' });
      } else {
        // Insert
        await db.run(
          `INSERT INTO provider_credentials (provider_id, credential_type, credential_key, credential_value)
           VALUES (?, ?, ?, ?)`,
          [provider.id, mapping.credentialType, mapping.credentialKey, value]
        );
        results.push({ provider: mapping.providerType, status: 'اضافه شد' });
      }

      // Activate the provider
      await db.run(
        "UPDATE providers SET is_active = 1, updated_at = datetime('now') WHERE id = ?",
        provider.id
      );
    }

    await db.close();

    return NextResponse.json({
      success: true,
      message: `${results.length} سرویس‌دهنده از متغیرهای محیطی پیکربندی شد`,
      results,
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'خطای ناشناخته';
    return NextResponse.json(
      { success: false, message: `خطا در همگام‌سازی متغیرهای محیطی: ${msg}` },
      { status: 500 }
    );
  }
}

// GET /api/env-sync - Check which env vars are available
export async function GET() {
  const available: Record<string, boolean> = {};
  for (const envVar of Object.keys(ENV_TO_PROVIDER)) {
    available[envVar] = !!process.env[envVar];
  }

  // SSO config status
  available['LOGIN_SSO_URL'] = !!process.env.LOGIN_SSO_URL;
  available['SSO_ENABLED'] = process.env.SSO_ENABLED === 'true';
  available['NEXTAUTH_SECRET'] = !!process.env.NEXTAUTH_SECRET;
  available['ORCEST_SSO_CLIENT_ID'] = !!process.env.ORCEST_SSO_CLIENT_ID;
  available['ORCEST_SSO_CLIENT_SECRET'] = !!process.env.ORCEST_SSO_CLIENT_SECRET;
  available['ODOO_URL'] = !!process.env.ODOO_URL;

  return NextResponse.json({ available });
}
