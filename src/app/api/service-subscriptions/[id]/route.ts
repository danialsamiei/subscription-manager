import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

// GET /api/service-subscriptions/[id]
export async function GET(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    const sub = await db.get(`
      SELECT s.*, p.name as provider_name, p.type as provider_type
      FROM service_subscriptions s
      LEFT JOIN providers p ON s.provider_id = p.id
      WHERE s.id = ?
    `, params.id);
    await db.close();

    if (!sub) {
      return NextResponse.json({ error: 'Service subscription not found' }, { status: 404 });
    }

    return NextResponse.json(sub);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch service subscription' }, { status: 500 });
  }
}

// PUT /api/service-subscriptions/[id]
export async function PUT(request: Request, { params }: { params: { id: string } }) {
  try {
    const body = await request.json();
    const db = await getDb();

    await db.run(
      `UPDATE service_subscriptions SET
        provider_id = COALESCE(?, provider_id),
        service_name = COALESCE(?, service_name),
        plan_name = COALESCE(?, plan_name),
        status = COALESCE(?, status),
        start_date = COALESCE(?, start_date),
        expiry_date = COALESCE(?, expiry_date),
        auto_renew = COALESCE(?, auto_renew),
        renewal_cost = COALESCE(?, renewal_cost),
        renewal_currency = COALESCE(?, renewal_currency),
        billing_cycle = COALESCE(?, billing_cycle),
        payment_method = COALESCE(?, payment_method),
        has_active_payment_method = COALESCE(?, has_active_payment_method),
        notes = COALESCE(?, notes),
        updated_at = datetime('now')
       WHERE id = ?`,
      [
        body.provider_id, body.service_name, body.plan_name, body.status,
        body.start_date, body.expiry_date,
        body.auto_renew !== undefined ? (body.auto_renew ? 1 : 0) : undefined,
        body.renewal_cost, body.renewal_currency, body.billing_cycle,
        body.payment_method,
        body.has_active_payment_method !== undefined ? (body.has_active_payment_method ? 1 : 0) : undefined,
        body.notes, params.id
      ]
    );

    const sub = await db.get('SELECT * FROM service_subscriptions WHERE id = ?', params.id);
    await db.close();

    return NextResponse.json(sub);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update service subscription' }, { status: 500 });
  }
}

// DELETE /api/service-subscriptions/[id]
export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();
    await db.run('DELETE FROM service_subscriptions WHERE id = ?', params.id);
    await db.close();

    return NextResponse.json({ message: 'Service subscription deleted' });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete service subscription' }, { status: 500 });
  }
}
