import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createProvider } from '@/lib/providers';

// POST /api/providers/[id]/test - Test provider connection
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();

    const providerRow = await db.get('SELECT * FROM providers WHERE id = ?', params.id);
    if (!providerRow) {
      await db.close();
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    const credentials = await db.all(
      'SELECT * FROM provider_credentials WHERE provider_id = ?',
      params.id
    );

    await db.close();

    const provider = createProvider(providerRow.type);
    if (!provider) {
      return NextResponse.json({ error: `Unknown provider type: ${providerRow.type}` }, { status: 400 });
    }

    provider.configure({
      providerId: providerRow.id,
      providerName: providerRow.name,
      apiEndpoint: providerRow.api_endpoint,
      credentials: credentials.map((c: any) => ({
        id: c.id,
        providerId: c.provider_id,
        credentialType: c.credential_type,
        credentialKey: c.credential_key,
        credentialValue: c.credential_value,
        isEncrypted: c.is_encrypted === 1,
      }))
    });

    const result = await provider.testConnection();
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: `Test failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
