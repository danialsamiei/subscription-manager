import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/providers/[id]/credentials
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const credentials = await db.all(
      'SELECT id, provider_id, credential_type, credential_key, is_encrypted FROM provider_credentials WHERE provider_id = ?',
      params.id
    );
    await db.close();

    // Don't return actual credential values for security
    return NextResponse.json(credentials.map(c => ({
      ...c,
      credential_value: '••••••••',
      hasValue: true
    })));
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch credentials' }, { status: 500 });
  }
}

// POST /api/providers/[id]/credentials
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { credential_type, credential_key, credential_value } = body;

    if (!credential_type || !credential_key || !credential_value) {
      return NextResponse.json(
        { error: 'credential_type, credential_key, and credential_value are required' },
        { status: 400 }
      );
    }

    const db = await getDb();

    // Check if this key already exists for this provider
    const existing = await db.get(
      'SELECT id FROM provider_credentials WHERE provider_id = ? AND credential_key = ?',
      [params.id, credential_key]
    );

    if (existing) {
      // Update existing credential
      await db.run(
        'UPDATE provider_credentials SET credential_value = ?, credential_type = ? WHERE id = ?',
        [credential_value, credential_type, existing.id]
      );
    } else {
      // Insert new credential
      await db.run(
        `INSERT INTO provider_credentials (provider_id, credential_type, credential_key, credential_value, is_encrypted)
         VALUES (?, ?, ?, ?, 0)`,
        [params.id, credential_type, credential_key, credential_value]
      );
    }

    await db.close();

    return NextResponse.json({ message: 'Credential saved successfully' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to save credential' }, { status: 500 });
  }
}

// DELETE /api/providers/[id]/credentials
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const url = new URL(request.url);
    const credentialKey = url.searchParams.get('key');

    const db = await getDb();

    if (credentialKey) {
      await db.run(
        'DELETE FROM provider_credentials WHERE provider_id = ? AND credential_key = ?',
        [params.id, credentialKey]
      );
    } else {
      await db.run('DELETE FROM provider_credentials WHERE provider_id = ?', params.id);
    }

    await db.close();

    return NextResponse.json({ message: 'Credentials deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete credentials' }, { status: 500 });
  }
}
