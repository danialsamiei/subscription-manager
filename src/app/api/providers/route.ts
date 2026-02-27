import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/providers - List all providers
export async function GET() {
  try {
    const db = await getDb();
    const providers = await db.all('SELECT * FROM providers ORDER BY name');
    await db.close();

    return NextResponse.json(providers);
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch providers' },
      { status: 500 }
    );
  }
}

// POST /api/providers - Create a new provider
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { name, type, icon, color, api_endpoint, auth_method } = body;

    if (!name || !type) {
      return NextResponse.json(
        { error: 'Name and type are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO providers (name, type, icon, color, api_endpoint, auth_method, is_active)
       VALUES (?, ?, ?, ?, ?, ?, 1)`,
      [name, type, icon || '', color || '#03DAC6', api_endpoint || '', auth_method || 'manual']
    );

    const provider = await db.get('SELECT * FROM providers WHERE id = ?', result.lastID);
    await db.close();

    return NextResponse.json(provider, { status: 201 });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to create provider' },
      { status: 500 }
    );
  }
}
