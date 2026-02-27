import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { formatJalaliDate, daysUntil, getExpiryStatus } from '@/lib/jalaliUtils';

// GET /api/service-subscriptions - List all service subscriptions
export async function GET() {
  try {
    const db = await getDb();
    const subs = await db.all(`
      SELECT s.*, p.name as provider_name, p.type as provider_type, p.icon as provider_icon, p.color as provider_color
      FROM service_subscriptions s
      LEFT JOIN providers p ON s.provider_id = p.id
      ORDER BY s.expiry_date ASC
    `);
    await db.close();

    const enriched = subs.map((s: any) => {
      const daysRemaining = s.expiry_date ? daysUntil(s.expiry_date) : null;
      const computedStatus = s.expiry_date ? getExpiryStatus(daysRemaining!) : s.status;

      return {
        ...s,
        expiry_date_jalali: s.expiry_date ? formatJalaliDate(s.expiry_date) : null,
        days_until_expiry: daysRemaining,
        computed_status: computedStatus,
        auto_renew: s.auto_renew === 1,
        has_active_payment_method: s.has_active_payment_method === 1,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch service subscriptions' }, { status: 500 });
  }
}

// POST /api/service-subscriptions
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider_id, service_name, plan_name, status, start_date, expiry_date,
      auto_renew, renewal_cost, renewal_currency, billing_cycle,
      payment_method, has_active_payment_method, notes
    } = body;

    if (!provider_id || !service_name) {
      return NextResponse.json(
        { error: 'provider_id and service_name are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO service_subscriptions (provider_id, service_name, plan_name, status,
        start_date, expiry_date, auto_renew, renewal_cost, renewal_currency,
        billing_cycle, payment_method, has_active_payment_method, notes, last_checked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        provider_id, service_name, plan_name || '', status || 'unknown',
        start_date || null, expiry_date || null, auto_renew ? 1 : 0,
        renewal_cost || null, renewal_currency || 'USD', billing_cycle || 'monthly',
        payment_method || null, has_active_payment_method ? 1 : 0, notes || null
      ]
    );

    const sub = await db.get('SELECT * FROM service_subscriptions WHERE id = ?', result.lastID);
    await db.close();

    return NextResponse.json(sub, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create service subscription' }, { status: 500 });
  }
}
