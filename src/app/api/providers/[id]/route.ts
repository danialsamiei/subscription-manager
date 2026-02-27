import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/providers/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const provider = await db.get('SELECT * FROM providers WHERE id = ?', params.id);
    await db.close();

    if (!provider) {
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    return NextResponse.json(provider);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch provider' }, { status: 500 });
  }
}

// PUT /api/providers/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const { name, type, icon, color, api_endpoint, auth_method, is_active } = body;

    const db = await getDb();
    await db.run(
      `UPDATE providers SET
        name = COALESCE(?, name),
        type = COALESCE(?, type),
        icon = COALESCE(?, icon),
        color = COALESCE(?, color),
        api_endpoint = COALESCE(?, api_endpoint),
        auth_method = COALESCE(?, auth_method),
        is_active = COALESCE(?, is_active),
        updated_at = datetime('now')
       WHERE id = ?`,
      [name, type, icon, color, api_endpoint, auth_method, is_active, params.id]
    );

    const provider = await db.get('SELECT * FROM providers WHERE id = ?', params.id);
    await db.close();

    return NextResponse.json(provider);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update provider' }, { status: 500 });
  }
}

// DELETE /api/providers/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM providers WHERE id = ?', params.id);
    await db.close();

    return NextResponse.json({ message: 'Provider deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete provider' }, { status: 500 });
  }
}
