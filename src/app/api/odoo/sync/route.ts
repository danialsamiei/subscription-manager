import { NextRequest, NextResponse } from 'next/server';
import { odooAuthenticate, syncFromOdoo } from '@/lib/odoo';
import { getDb } from '@/lib/db';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, password } = body;

    if (!username || !password) {
      return NextResponse.json(
        { success: false, message: 'نام کاربری و رمز عبور الزامی است' },
        { status: 400 }
      );
    }

    // Authenticate
    const auth = await odooAuthenticate(username, password);
    if (!auth) {
      return NextResponse.json(
        { success: false, message: 'احراز هویت Odoo ناموفق بود' },
        { status: 401 }
      );
    }

    // Sync data from Odoo
    const data = await syncFromOdoo(auth.uid, password);

    // Save synced subscriptions to local DB
    const db = await getDb();

    // Find or create the Odoo provider
    let odooProvider = await db.get(
      `SELECT * FROM providers WHERE type = 'odoo'`
    );

    if (!odooProvider) {
      await db.run(
        `INSERT INTO providers (name, type, icon, color, api_endpoint, auth_method, is_active)
         VALUES (?, ?, ?, ?, ?, ?, 1)`,
        ['Orcest Odoo', 'odoo', 'mdi:office-building', '#8E24AA', process.env.ODOO_URL || 'https://do.orcest.ai', 'login_2fa']
      );
      odooProvider = await db.get(`SELECT * FROM providers WHERE type = 'odoo'`);
    }

    const providerId = odooProvider!.id;

    // Import subscriptions as service_subscriptions
    let importedCount = 0;
    for (const sub of data.subscriptions) {
      const existing = await db.get(
        `SELECT id FROM service_subscriptions WHERE provider_id = ? AND service_name = ?`,
        [providerId, sub.name || `Odoo #${sub.id}`]
      );

      if (!existing) {
        await db.run(
          `INSERT INTO service_subscriptions (
            provider_id, service_name, plan_name, status, start_date, expiry_date,
            auto_renew, renewal_cost, renewal_currency, billing_cycle, last_checked
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
          [
            providerId,
            sub.name || `Odoo Subscription #${sub.id}`,
            sub.plan_id ? String(sub.plan_id[1] || '') : '',
            mapOdooStatus(sub.subscription_state || sub.state),
            sub.date_order || null,
            sub.next_invoice_date || sub.validity_date || null,
            1, // auto_renew
            sub.amount_total || 0,
            sub.currency_id ? String(sub.currency_id[1] || 'USD') : 'USD',
            'monthly',
          ]
        );
        importedCount++;
      }
    }

    // Import invoices info
    let invoiceCount = 0;
    for (const inv of data.invoices) {
      const existing = await db.get(
        `SELECT id FROM service_subscriptions WHERE provider_id = ? AND service_name = ?`,
        [providerId, `فاکتور: ${inv.name}`]
      );

      if (!existing) {
        await db.run(
          `INSERT INTO service_subscriptions (
            provider_id, service_name, plan_name, status, start_date, expiry_date,
            renewal_cost, renewal_currency, last_checked, notes
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
          [
            providerId,
            `فاکتور: ${inv.name}`,
            'فاکتور',
            mapOdooInvoiceStatus(inv.state, inv.payment_state),
            inv.invoice_date || null,
            inv.invoice_date_due || null,
            inv.amount_total || 0,
            inv.currency_id ? String(inv.currency_id[1] || 'USD') : 'USD',
            inv.amount_residual > 0 ? `مانده: ${inv.amount_residual}` : 'پرداخت شده',
          ]
        );
        invoiceCount++;
      }
    }

    await db.close();

    return NextResponse.json({
      success: true,
      message: `همگام‌سازی با Odoo موفق بود`,
      data: {
        subscriptionsFound: data.subscriptions.length,
        subscriptionsImported: importedCount,
        invoicesFound: data.invoices.length,
        invoicesImported: invoiceCount,
        productsFound: data.products.length,
      },
    });
  } catch (error) {
    const msg = error instanceof Error ? error.message : 'خطای ناشناخته';
    return NextResponse.json(
      { success: false, message: `خطا در همگام‌سازی: ${msg}` },
      { status: 500 }
    );
  }
}

function mapOdooStatus(state: string): string {
  const map: Record<string, string> = {
    '3_progress': 'active',
    '4_paused': 'paused',
    '5_renewed': 'active',
    '6_churn': 'cancelled',
    'sale': 'active',
    'done': 'active',
    'cancel': 'cancelled',
    'draft': 'unknown',
  };
  return map[state] || 'unknown';
}

function mapOdooInvoiceStatus(state: string, paymentState: string): string {
  if (paymentState === 'paid') return 'active';
  if (paymentState === 'partial') return 'expiring_soon';
  if (state === 'posted') return 'active';
  if (state === 'cancel') return 'cancelled';
  return 'unknown';
}
