// Currency conversion utilities with support for Iranian Toman

import { CurrencyRate } from '@/types';

// Fallback rates (updated periodically) - these are used when API is unavailable
const FALLBACK_RATES: Record<string, number> = {
  'USD_IRR': 590000,
  'EUR_IRR': 640000,
  'GBP_IRR': 745000,
  'AED_IRR': 160000,
  'TRY_IRR': 18000,
  'USD_EUR': 0.92,
  'USD_GBP': 0.79,
  'EUR_USD': 1.09,
  'GBP_USD': 1.27,
};

// IRR to Toman divider (1 Toman = 10 Rials)
const RIAL_TO_TOMAN = 10;

export interface ConversionResult {
  amount: number;
  fromCurrency: string;
  toCurrency: string;
  rate: number;
  convertedAmount: number;
  tomanAmount?: number;
  lastUpdated: string;
  source: string;
}

export async function fetchExchangeRates(): Promise<Record<string, number>> {
  const rates: Record<string, number> = {};

  try {
    // Try fetching from a free exchange rate API
    const response = await fetch('https://api.exchangerate-api.com/v4/latest/USD', {
      next: { revalidate: 3600 } // cache for 1 hour
    });

    if (response.ok) {
      const data = await response.json();
      if (data.rates) {
        Object.entries(data.rates).forEach(([currency, rate]) => {
          rates[`USD_${currency}`] = rate as number;
        });
      }
    }
  } catch (error) {
    console.warn('Failed to fetch exchange rates, using fallback rates');
  }

  // Try fetching IRR rate from alternative sources
  try {
    const irrResponse = await fetch('https://api.navasan.tech/latest/?api=freeEbQREsW&item=usd_sell', {
      next: { revalidate: 3600 }
    });

    if (irrResponse.ok) {
      const irrData = await irrResponse.json();
      if (irrData?.usd_sell?.value) {
        rates['USD_IRR'] = parseFloat(irrData.usd_sell.value);
      }
    }
  } catch {
    // Use fallback for IRR
  }

  // Merge with fallback rates (fallback only fills missing values)
  Object.entries(FALLBACK_RATES).forEach(([key, value]) => {
    if (!rates[key]) {
      rates[key] = value;
    }
  });

  return rates;
}

export function convertCurrency(
  amount: number,
  fromCurrency: string,
  toCurrency: string,
  rates: Record<string, number>
): number {
  if (fromCurrency === toCurrency) return amount;

  const directKey = `${fromCurrency}_${toCurrency}`;
  if (rates[directKey]) {
    return amount * rates[directKey];
  }

  // Try via USD as intermediary
  const toUSDKey = `${fromCurrency}_USD`;
  const fromUSDKey = `USD_${toCurrency}`;

  if (fromCurrency === 'USD' && rates[fromUSDKey]) {
    return amount * rates[fromUSDKey];
  }

  if (toCurrency === 'USD' && rates[`USD_${fromCurrency}`]) {
    return amount / rates[`USD_${fromCurrency}`];
  }

  // Cross conversion via USD
  let amountInUSD = amount;
  if (fromCurrency !== 'USD') {
    const usdRate = rates[`USD_${fromCurrency}`];
    if (usdRate) {
      amountInUSD = amount / usdRate;
    } else {
      return amount; // Cannot convert
    }
  }

  if (toCurrency !== 'USD') {
    const targetRate = rates[`USD_${toCurrency}`];
    if (targetRate) {
      return amountInUSD * targetRate;
    }
  }

  return amountInUSD;
}

export function convertToToman(
  amount: number,
  fromCurrency: string,
  rates: Record<string, number>
): number {
  const rialAmount = convertCurrency(amount, fromCurrency, 'IRR', rates);
  return Math.round(rialAmount / RIAL_TO_TOMAN);
}

export function formatToman(amount: number): string {
  return new Intl.NumberFormat('fa-IR').format(amount) + ' تومان';
}

export function formatCurrencyWithToman(
  amount: number,
  currency: string,
  rates: Record<string, number>
): { base: string; toman: string } {
  const baseFormatted = new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: 2
  }).format(amount);

  const tomanAmount = convertToToman(amount, currency, rates);
  const tomanFormatted = formatToman(tomanAmount);

  return { base: baseFormatted, toman: tomanFormatted };
}

export function getDefaultRates(): Record<string, number> {
  return { ...FALLBACK_RATES };
}
