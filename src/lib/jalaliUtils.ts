// Jalali (Persian/Shamsi) calendar utilities
// Using jalaali-js for conversion

interface JalaaliResult {
  jy: number;
  jm: number;
  jd: number;
}

interface GregorianResult {
  gy: number;
  gm: number;
  gd: number;
}

let jalaali: {
  toJalaali: (gy: number, gm: number, gd: number) => JalaaliResult;
  toGregorian: (jy: number, jm: number, jd: number) => GregorianResult;
  isValidJalaaliDate: (jy: number, jm: number, jd: number) => boolean;
  jalaaliMonthLength: (jy: number, jm: number) => number;
} | null = null;

try {
  jalaali = require('jalaali-js');
} catch {
  console.warn('jalaali-js not available, Jalali conversion will use fallback');
}

const JALALI_MONTHS = [
  'فروردین', 'اردیبهشت', 'خرداد',
  'تیر', 'مرداد', 'شهریور',
  'مهر', 'آبان', 'آذر',
  'دی', 'بهمن', 'اسفند'
];

const JALALI_WEEKDAYS = [
  'یکشنبه', 'دوشنبه', 'سه‌شنبه', 'چهارشنبه', 'پنجشنبه', 'جمعه', 'شنبه'
];

export function gregorianToJalali(date: Date | string): { year: number; month: number; day: number } {
  const d = typeof date === 'string' ? new Date(date) : date;

  if (!jalaali) {
    // Fallback: approximate conversion
    const gy = d.getFullYear();
    const gm = d.getMonth() + 1;
    const gd = d.getDate();
    return approximateGregorianToJalali(gy, gm, gd);
  }

  const result = jalaali.toJalaali(d.getFullYear(), d.getMonth() + 1, d.getDate());
  return { year: result.jy, month: result.jm, day: result.jd };
}

export function jalaliToGregorian(jy: number, jm: number, jd: number): Date {
  if (!jalaali) {
    // Fallback
    const approx = approximateJalaliToGregorian(jy, jm, jd);
    return new Date(approx.year, approx.month - 1, approx.day);
  }

  const result = jalaali.toGregorian(jy, jm, jd);
  return new Date(result.gy, result.gm - 1, result.gd);
}

export function formatJalaliDate(date: Date | string): string {
  const j = gregorianToJalali(date);
  return `${j.year}/${j.month.toString().padStart(2, '0')}/${j.day.toString().padStart(2, '0')}`;
}

export function formatJalaliDateFull(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const j = gregorianToJalali(d);
  const weekday = JALALI_WEEKDAYS[d.getDay()];
  const monthName = JALALI_MONTHS[j.month - 1];
  return `${weekday} ${j.day} ${monthName} ${j.year}`;
}

export function formatJalaliDateWithMonth(date: Date | string): string {
  const j = gregorianToJalali(date);
  const monthName = JALALI_MONTHS[j.month - 1];
  return `${j.day} ${monthName} ${j.year}`;
}

export function getJalaliMonthName(month: number): string {
  return JALALI_MONTHS[month - 1] || '';
}

export function getJalaliWeekdayName(dayIndex: number): string {
  return JALALI_WEEKDAYS[dayIndex] || '';
}

// Format date in Iran timezone (Asia/Tehran = UTC+3:30)
export function formatIranTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('fa-IR', {
    timeZone: 'Asia/Tehran',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatIranDateTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const jalali = formatJalaliDateWithMonth(d);
  const time = formatIranTime(d);
  return `${jalali} - ${time}`;
}

export function formatUTCTime(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleString('en-US', {
    timeZone: 'UTC',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
}

export function formatGregorianDate(date: Date | string): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

export function formatDualDate(date: Date | string): { gregorian: string; jalali: string; utc: string; iran: string } {
  const d = typeof date === 'string' ? new Date(date) : date;
  return {
    gregorian: formatGregorianDate(d),
    jalali: formatJalaliDateFull(d),
    utc: formatUTCTime(d),
    iran: formatIranTime(d)
  };
}

export function daysUntil(date: Date | string): number {
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  const diffTime = d.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
}

export function getExpiryStatus(daysRemaining: number): 'active' | 'expiring_soon' | 'expired' {
  if (daysRemaining < 0) return 'expired';
  if (daysRemaining <= 30) return 'expiring_soon';
  return 'active';
}

// Fallback conversions when jalaali-js is not available
function approximateGregorianToJalali(gy: number, gm: number, gd: number): { year: number; month: number; day: number } {
  const g_d_m = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334];
  let gy2 = (gm > 2) ? (gy + 1) : gy;
  let days = 355666 + (365 * gy) + Math.floor((gy2 + 3) / 4) - Math.floor((gy2 + 99) / 100) + Math.floor((gy2 + 399) / 400) + gd + g_d_m[gm - 1];
  let jy = -1595 + (33 * Math.floor(days / 12053));
  days %= 12053;
  jy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    jy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  let jm, jd;
  if (days < 186) {
    jm = 1 + Math.floor(days / 31);
    jd = 1 + (days % 31);
  } else {
    jm = 7 + Math.floor((days - 186) / 30);
    jd = 1 + ((days - 186) % 30);
  }
  return { year: jy, month: jm, day: jd };
}

function approximateJalaliToGregorian(jy: number, jm: number, jd: number): { year: number; month: number; day: number } {
  let gy, gm, gd;
  jy += 1595;
  let days = -355668 + (365 * jy) + (Math.floor(jy / 33) * 8) + Math.floor(((jy % 33) + 3) / 4) + jd + ((jm < 7) ? (jm - 1) * 31 : ((jm - 7) * 30) + 186);
  gy = 400 * Math.floor(days / 146097);
  days %= 146097;
  if (days > 36524) {
    gy += 100 * Math.floor(--days / 36524);
    days %= 36524;
    if (days >= 365) days++;
  }
  gy += 4 * Math.floor(days / 1461);
  days %= 1461;
  if (days > 365) {
    gy += Math.floor((days - 1) / 365);
    days = (days - 1) % 365;
  }
  gd = days + 1;
  const sal_a = [0, 31, ((gy % 4 === 0 && gy % 100 !== 0) || (gy % 400 === 0)) ? 29 : 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31];
  gm = 0;
  for (gm = 0; gm < 13 && gd > sal_a[gm]; gm++) {
    gd -= sal_a[gm];
  }
  return { year: gy, month: gm, day: gd };
}
