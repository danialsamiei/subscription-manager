import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { daysUntil } from '@/lib/jalaliUtils';
import { convertToToman, getDefaultRates } from '@/lib/currencyUtils';

// GET /api/dashboard-summary - Get overall dashboard summary
export async function GET() {
  try {
    const db = await getDb();

    // Fetch providers
    const providers = await db.all('SELECT * FROM providers ORDER BY name');

    // Fetch domains
    const domains = await db.all('SELECT * FROM domains');

    // Fetch service subscriptions
    const subs = await db.all('SELECT * FROM service_subscriptions');

    // Fetch currency rates
    const rateRows = await db.all('SELECT * FROM currency_rates');
    const rates: Record<string, number> = {};
    for (const r of rateRows) {
      rates[`${r.from_currency}_${r.to_currency}`] = r.rate;
    }
    // Fill in defaults if needed
    const defaultRates = getDefaultRates();
    for (const [key, value] of Object.entries(defaultRates)) {
      if (!rates[key]) rates[key] = value;
    }

    await db.close();

    // Calculate domain stats
    const activeDomains = domains.filter((d: any) => {
      if (!d.expiry_date) return d.status === 'active';
      return daysUntil(d.expiry_date) > 30;
    }).length;

    const expiringDomains = domains.filter((d: any) => {
      if (!d.expiry_date) return false;
      const days = daysUntil(d.expiry_date);
      return days > 0 && days <= 30;
    }).length;

    const expiredDomains = domains.filter((d: any) => {
      if (!d.expiry_date) return d.status === 'expired';
      return daysUntil(d.expiry_date) < 0;
    }).length;

    // Calculate subscription stats
    const activeSubs = subs.filter((s: any) => {
      if (!s.expiry_date) return s.status === 'active';
      return daysUntil(s.expiry_date) > 0;
    }).length;

    const expiringSubs = subs.filter((s: any) => {
      if (!s.expiry_date) return false;
      const days = daysUntil(s.expiry_date);
      return days > 0 && days <= 30;
    }).length;

    // Calculate total monthly costs
    let totalMonthlyCostUSD = 0;
    for (const sub of subs) {
      if (!sub.renewal_cost) continue;
      const currency = sub.renewal_currency || 'USD';
      let monthlyCost = sub.renewal_cost;

      // Normalize to monthly
      switch (sub.billing_cycle) {
        case 'yearly':
          monthlyCost = sub.renewal_cost / 12;
          break;
        case 'weekly':
          monthlyCost = sub.renewal_cost * 4.33;
          break;
      }

      // Convert to USD
      if (currency !== 'USD') {
        const usdRate = rates[`USD_${currency}`];
        if (usdRate) {
          monthlyCost = monthlyCost / usdRate;
        }
      }

      totalMonthlyCostUSD += monthlyCost;
    }

    const totalMonthlyCostToman = convertToToman(totalMonthlyCostUSD, 'USD', rates);

    return NextResponse.json({
      totalDomains: domains.length,
      activeDomains,
      expiringDomains,
      expiredDomains,
      totalSubscriptions: subs.length,
      activeSubscriptions: activeSubs,
      expiringSubscriptions: expiringSubs,
      totalMonthlyCostUSD: Math.round(totalMonthlyCostUSD * 100) / 100,
      totalMonthlyCostToman,
      providers: providers.map((p: any) => ({
        ...p,
        is_active: p.is_active === 1,
      })),
    });
  } catch (error) {
    return NextResponse.json(
      { error: 'Failed to fetch dashboard summary' },
      { status: 500 }
    );
  }
}
