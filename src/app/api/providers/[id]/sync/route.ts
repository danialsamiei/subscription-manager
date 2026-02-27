import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { createProvider } from '@/lib/providers';

// POST /api/providers/[id]/sync - Trigger sync for a provider
export async function POST(request: Request, { params }: { params: { id: string } }) {
  try {
    const db = await getDb();

    // Get provider info
    const providerRow = await db.get('SELECT * FROM providers WHERE id = ?', params.id);
    if (!providerRow) {
      await db.close();
      return NextResponse.json({ error: 'Provider not found' }, { status: 404 });
    }

    // Get credentials
    const credentials = await db.all(
      'SELECT * FROM provider_credentials WHERE provider_id = ?',
      params.id
    );

    // Create provider instance
    const provider = createProvider(providerRow.type);
    if (!provider) {
      await db.close();
      return NextResponse.json({ error: `Unknown provider type: ${providerRow.type}` }, { status: 400 });
    }

    // Configure provider
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

    // Update sync status
    await db.run(
      "UPDATE providers SET sync_status = 'syncing', updated_at = datetime('now') WHERE id = ?",
      params.id
    );

    // Create sync log
    const syncLog = await db.run(
      "INSERT INTO sync_logs (provider_id, sync_type, status) VALUES (?, 'manual', 'started')",
      params.id
    );

    // Perform sync
    const result = await provider.sync();

    // Save domains
    if (result.domainsFound > 0) {
      const domains = await provider.fetchDomains();
      for (const domain of domains) {
        // Check if domain already exists
        const existing = await db.get(
          'SELECT id FROM domains WHERE provider_id = ? AND domain_name = ?',
          [params.id, domain.domainName]
        );

        if (existing) {
          await db.run(
            `UPDATE domains SET
              registrar = ?, expiry_date = ?, auto_renew = ?, status = ?,
              dns_provider = ?, ssl_status = ?, ssl_expiry = ?,
              renewal_cost = ?, renewal_currency = ?, payment_method = ?,
              has_active_payment_method = ?, nameservers = ?,
              last_checked = datetime('now'), updated_at = datetime('now')
             WHERE id = ?`,
            [
              domain.registrar, domain.expiryDate, domain.autoRenew ? 1 : 0,
              domain.status, domain.dnsProvider, domain.sslStatus,
              domain.sslExpiry, domain.renewalCost, domain.renewalCurrency,
              domain.paymentMethod, domain.hasActivePaymentMethod ? 1 : 0,
              domain.nameservers, existing.id
            ]
          );
        } else {
          await db.run(
            `INSERT INTO domains (provider_id, domain_name, registrar, expiry_date, auto_renew, status,
              dns_provider, ssl_status, ssl_expiry, renewal_cost, renewal_currency, payment_method,
              has_active_payment_method, nameservers, last_checked)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))`,
            [
              params.id, domain.domainName, domain.registrar, domain.expiryDate,
              domain.autoRenew ? 1 : 0, domain.status, domain.dnsProvider,
              domain.sslStatus, domain.sslExpiry, domain.renewalCost,
              domain.renewalCurrency, domain.paymentMethod,
              domain.hasActivePaymentMethod ? 1 : 0, domain.nameservers
            ]
          );
        }
      }
    }

    // Save subscriptions
    if (result.subscriptionsFound > 0) {
      const subs = await provider.fetchSubscriptions();
      for (const sub of subs) {
        const existing = await db.get(
          'SELECT id FROM service_subscriptions WHERE provider_id = ? AND service_name = ?',
          [params.id, sub.serviceName]
        );

        if (existing) {
          await db.run(
            `UPDATE service_subscriptions SET
              plan_name = ?, status = ?, start_date = ?, expiry_date = ?,
              auto_renew = ?, renewal_cost = ?, renewal_currency = ?,
              billing_cycle = ?, payment_method = ?, has_active_payment_method = ?,
              last_checked = datetime('now'), notes = ?, updated_at = datetime('now')
             WHERE id = ?`,
            [
              sub.planName, sub.status, sub.startDate, sub.expiryDate,
              sub.autoRenew ? 1 : 0, sub.renewalCost, sub.renewalCurrency,
              sub.billingCycle, sub.paymentMethod,
              sub.hasActivePaymentMethod ? 1 : 0, sub.notes, existing.id
            ]
          );
        } else {
          await db.run(
            `INSERT INTO service_subscriptions (provider_id, service_name, plan_name, status,
              start_date, expiry_date, auto_renew, renewal_cost, renewal_currency,
              billing_cycle, payment_method, has_active_payment_method, last_checked, notes)
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?)`,
            [
              params.id, sub.serviceName, sub.planName, sub.status,
              sub.startDate, sub.expiryDate, sub.autoRenew ? 1 : 0,
              sub.renewalCost, sub.renewalCurrency, sub.billingCycle,
              sub.paymentMethod, sub.hasActivePaymentMethod ? 1 : 0, sub.notes
            ]
          );
        }
      }
    }

    // Update provider sync status
    const syncStatus = result.success ? 'success' : 'error';
    await db.run(
      `UPDATE providers SET sync_status = ?, last_sync = datetime('now'), sync_error = ?, updated_at = datetime('now') WHERE id = ?`,
      [syncStatus, result.errors.join('; ') || null, params.id]
    );

    // Update sync log
    await db.run(
      `UPDATE sync_logs SET status = ?, domains_found = ?, subscriptions_found = ?, errors = ?, completed_at = datetime('now') WHERE id = ?`,
      [syncStatus, result.domainsFound, result.subscriptionsFound, result.errors.join('; ') || null, syncLog.lastID]
    );

    await db.close();

    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json(
      { error: `Sync failed: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
