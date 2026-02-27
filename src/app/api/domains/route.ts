import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { formatJalaliDate, daysUntil, getExpiryStatus } from '@/lib/jalaliUtils';

// GET /api/domains - List all domains
export async function GET() {
  try {
    const db = await getDb();
    const domains = await db.all(`
      SELECT d.*, p.name as provider_name, p.type as provider_type, p.icon as provider_icon, p.color as provider_color
      FROM domains d
      LEFT JOIN providers p ON d.provider_id = p.id
      ORDER BY d.expiry_date ASC
    `);
    await db.close();

    // Enrich with Jalali dates and expiry status
    const enriched = domains.map((d: any) => {
      const daysRemaining = d.expiry_date ? daysUntil(d.expiry_date) : null;
      const computedStatus = d.expiry_date ? getExpiryStatus(daysRemaining!) : d.status;

      return {
        ...d,
        expiry_date_jalali: d.expiry_date ? formatJalaliDate(d.expiry_date) : null,
        ssl_expiry_jalali: d.ssl_expiry ? formatJalaliDate(d.ssl_expiry) : null,
        days_until_expiry: daysRemaining,
        computed_status: computedStatus,
        auto_renew: d.auto_renew === 1,
        has_active_payment_method: d.has_active_payment_method === 1,
      };
    });

    return NextResponse.json(enriched);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch domains' }, { status: 500 });
  }
}

// POST /api/domains - Create a new domain (manual entry)
export async function POST(request: Request) {
  try {
    const body = await request.json();
    const {
      provider_id, domain_name, registrar, expiry_date, auto_renew,
      status, dns_provider, ssl_status, ssl_expiry, renewal_cost,
      renewal_currency, payment_method, has_active_payment_method,
      nameservers, notes
    } = body;

    if (!provider_id || !domain_name) {
      return NextResponse.json(
        { error: 'provider_id and domain_name are required' },
        { status: 400 }
      );
    }

    const db = await getDb();
    const result = await db.run(
      `INSERT INTO domains (provider_id, domain_name, registrar, expiry_date, auto_renew, status,
        dns_provider, ssl_status, ssl_expiry, renewal_cost, renewal_currency, payment_method,
        has_active_payment_method, nameservers, notes, last_checked)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
      [
        provider_id, domain_name, registrar || '', expiry_date || null,
        auto_renew ? 1 : 0, status || 'unknown', dns_provider || '',
        ssl_status || 'none', ssl_expiry || null, renewal_cost || null,
        renewal_currency || 'USD', payment_method || null,
        has_active_payment_method ? 1 : 0, nameservers || null, notes || null
      ]
    );

    const domain = await db.get('SELECT * FROM domains WHERE id = ?', result.lastID);
    await db.close();

    return NextResponse.json(domain, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to create domain' }, { status: 500 });
  }
}
