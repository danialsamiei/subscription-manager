import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/domains/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const domain = await db.get(`
      SELECT d.*, p.name as provider_name, p.type as provider_type
      FROM domains d
      LEFT JOIN providers p ON d.provider_id = p.id
      WHERE d.id = ?
    `, params.id);
    await db.close();

    if (!domain) {
      return NextResponse.json({ error: 'Domain not found' }, { status: 404 });
    }

    return NextResponse.json(domain);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch domain' }, { status: 500 });
  }
}

// PUT /api/domains/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const db = await getDb();

    await db.run(
      `UPDATE domains SET
        provider_id = COALESCE(?, provider_id),
        domain_name = COALESCE(?, domain_name),
        registrar = COALESCE(?, registrar),
        expiry_date = COALESCE(?, expiry_date),
        auto_renew = COALESCE(?, auto_renew),
        status = COALESCE(?, status),
        dns_provider = COALESCE(?, dns_provider),
        ssl_status = COALESCE(?, ssl_status),
        ssl_expiry = COALESCE(?, ssl_expiry),
        renewal_cost = COALESCE(?, renewal_cost),
        renewal_currency = COALESCE(?, renewal_currency),
        payment_method = COALESCE(?, payment_method),
        has_active_payment_method = COALESCE(?, has_active_payment_method),
        nameservers = COALESCE(?, nameservers),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
       WHERE id = ?`,
      [
        body.provider_id, body.domain_name, body.registrar, body.expiry_date,
        body.auto_renew !== undefined ? (body.auto_renew ? 1 : 0) : undefined,
        body.status, body.dns_provider, body.ssl_status, body.ssl_expiry,
        body.renewal_cost, body.renewal_currency, body.payment_method,
        body.has_active_payment_method !== undefined ? (body.has_active_payment_method ? 1 : 0) : undefined,
        body.nameservers, body.notes, params.id
      ]
    );

    const domain = await db.get('SELECT * FROM domains WHERE id = ?', params.id);
    await db.close();

    return NextResponse.json(domain);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update domain' }, { status: 500 });
  }
}

// DELETE /api/domains/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM domains WHERE id = ?', params.id);
    await db.close();

    return NextResponse.json({ message: 'Domain deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete domain' }, { status: 500 });
  }
}
