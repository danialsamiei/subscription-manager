import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { fetchExchangeRates, convertToToman, convertCurrency } from '@/lib/currencyUtils';

// GET /api/currency-rates - Get all cached rates
export async function GET() {
  try {
    const db = await getDb();
    const rates = await db.all('SELECT * FROM currency_rates ORDER BY from_currency, to_currency');
    await db.close();

    // Convert to a lookup map
    const rateMap: Record<string, number> = {};
    for (const r of rates) {
      rateMap[`${r.from_currency}_${r.to_currency}`] = r.rate;
    }

    return NextResponse.json({
      rates: rateMap,
      lastUpdated: rates[0]?.last_updated || null,
      count: rates.length
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch currency rates' }, { status: 500 });
  }
}

// POST /api/currency-rates/refresh - Refresh rates from external API
export async function POST() {
  try {
    const rates = await fetchExchangeRates();

    const db = await getDb();

    for (const [key, rate] of Object.entries(rates)) {
      const [from, to] = key.split('_');
      await db.run(
        `INSERT OR REPLACE INTO currency_rates (from_currency, to_currency, rate, last_updated, source)
         VALUES (?, ?, ?, datetime('now'), 'api')`,
        [from, to, rate]
      );
    }

    await db.close();

    return NextResponse.json({
      message: 'Rates refreshed successfully',
      ratesUpdated: Object.keys(rates).length,
      rates
    });
  } catch (error) {
    return NextResponse.json(
      { error: `Failed to refresh rates: ${error instanceof Error ? error.message : String(error)}` },
      { status: 500 }
    );
  }
}
