// Currency conversion with cached exchange rates (1hr TTL)
// Primary: exchangerate.host  Fallback: open.er-api.com

export interface CurrencyInfo {
  code: string;
  name: string;
  symbol: string;
}

interface RatesCache {
  base: string;
  rates: Record<string, number>;
  fetchedAt: number;
}

const TTL_MS = 60 * 60 * 1000; // 1 hour
let cache: RatesCache | null = null;

const TOP_50: CurrencyInfo[] = [
  { code: 'USD', name: 'US Dollar', symbol: '$' },
  { code: 'EUR', name: 'Euro', symbol: '€' },
  { code: 'GBP', name: 'British Pound', symbol: '£' },
  { code: 'JPY', name: 'Japanese Yen', symbol: '¥' },
  { code: 'CNY', name: 'Chinese Yuan', symbol: '¥' },
  { code: 'AUD', name: 'Australian Dollar', symbol: 'A$' },
  { code: 'CAD', name: 'Canadian Dollar', symbol: 'C$' },
  { code: 'CHF', name: 'Swiss Franc', symbol: 'CHF' },
  { code: 'NZD', name: 'New Zealand Dollar', symbol: 'NZ$' },
  { code: 'SEK', name: 'Swedish Krona', symbol: 'kr' },
  { code: 'NOK', name: 'Norwegian Krone', symbol: 'kr' },
  { code: 'DKK', name: 'Danish Krone', symbol: 'kr' },
  { code: 'SGD', name: 'Singapore Dollar', symbol: 'S$' },
  { code: 'HKD', name: 'Hong Kong Dollar', symbol: 'HK$' },
  { code: 'KRW', name: 'South Korean Won', symbol: '₩' },
  { code: 'INR', name: 'Indian Rupee', symbol: '₹' },
  { code: 'MXN', name: 'Mexican Peso', symbol: 'Mex$' },
  { code: 'BRL', name: 'Brazilian Real', symbol: 'R$' },
  { code: 'ZAR', name: 'South African Rand', symbol: 'R' },
  { code: 'RUB', name: 'Russian Ruble', symbol: '₽' },
  { code: 'TRY', name: 'Turkish Lira', symbol: '₺' },
  { code: 'AED', name: 'UAE Dirham', symbol: 'د.إ' },
  { code: 'SAR', name: 'Saudi Riyal', symbol: '﷼' },
  { code: 'PLN', name: 'Polish Zloty', symbol: 'zł' },
  { code: 'THB', name: 'Thai Baht', symbol: '฿' },
  { code: 'IDR', name: 'Indonesian Rupiah', symbol: 'Rp' },
  { code: 'MYR', name: 'Malaysian Ringgit', symbol: 'RM' },
  { code: 'PHP', name: 'Philippine Peso', symbol: '₱' },
  { code: 'VND', name: 'Vietnamese Dong', symbol: '₫' },
  { code: 'CZK', name: 'Czech Koruna', symbol: 'Kč' },
  { code: 'HUF', name: 'Hungarian Forint', symbol: 'Ft' },
  { code: 'ILS', name: 'Israeli Shekel', symbol: '₪' },
  { code: 'CLP', name: 'Chilean Peso', symbol: 'CLP$' },
  { code: 'ARS', name: 'Argentine Peso', symbol: 'AR$' },
  { code: 'COP', name: 'Colombian Peso', symbol: 'COL$' },
  { code: 'EGP', name: 'Egyptian Pound', symbol: 'E£' },
  { code: 'NGN', name: 'Nigerian Naira', symbol: '₦' },
  { code: 'PKR', name: 'Pakistani Rupee', symbol: '₨' },
  { code: 'BDT', name: 'Bangladeshi Taka', symbol: '৳' },
  { code: 'TWD', name: 'Taiwan Dollar', symbol: 'NT$' },
  { code: 'UAH', name: 'Ukrainian Hryvnia', symbol: '₴' },
  { code: 'RON', name: 'Romanian Leu', symbol: 'lei' },
  { code: 'ISK', name: 'Icelandic Krona', symbol: 'kr' },
  { code: 'BGN', name: 'Bulgarian Lev', symbol: 'лв' },
  { code: 'HRK', name: 'Croatian Kuna', symbol: 'kn' },
  { code: 'QAR', name: 'Qatari Riyal', symbol: '﷼' },
  { code: 'KWD', name: 'Kuwaiti Dinar', symbol: 'KD' },
  { code: 'PEN', name: 'Peruvian Sol', symbol: 'S/.' },
  { code: 'KES', name: 'Kenyan Shilling', symbol: 'KSh' },
  { code: 'MAD', name: 'Moroccan Dirham', symbol: 'MAD' },
];

interface ExchangeHostResponse {
  base?: string;
  rates?: Record<string, number>;
}

interface OpenErApiResponse {
  base_code?: string;
  rates?: Record<string, number>;
  result?: string;
}

async function fetchPrimary(): Promise<RatesCache> {
  const res = await fetch('https://api.exchangerate.host/latest?base=USD', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`primary status ${res.status}`);
  const data = (await res.json()) as ExchangeHostResponse;
  if (!data.rates || Object.keys(data.rates).length === 0) {
    throw new Error('primary empty rates');
  }
  return { base: 'USD', rates: data.rates, fetchedAt: Date.now() };
}

async function fetchFallback(): Promise<RatesCache> {
  const res = await fetch('https://open.er-api.com/v6/latest/USD', {
    cache: 'no-store',
  });
  if (!res.ok) throw new Error(`fallback status ${res.status}`);
  const data = (await res.json()) as OpenErApiResponse;
  if (!data.rates || Object.keys(data.rates).length === 0) {
    throw new Error('fallback empty rates');
  }
  return { base: 'USD', rates: data.rates, fetchedAt: Date.now() };
}

export async function getRates(): Promise<RatesCache> {
  if (cache && Date.now() - cache.fetchedAt < TTL_MS) {
    return cache;
  }
  try {
    cache = await fetchPrimary();
    return cache;
  } catch {
    cache = await fetchFallback();
    return cache;
  }
}

export async function getRate(from: string, to: string): Promise<number> {
  const fromCode = from.toUpperCase();
  const toCode = to.toUpperCase();
  if (fromCode === toCode) return 1;
  const { rates } = await getRates();
  const fromRate = fromCode === 'USD' ? 1 : rates[fromCode];
  const toRate = toCode === 'USD' ? 1 : rates[toCode];
  if (typeof fromRate !== 'number' || typeof toRate !== 'number') {
    throw new Error(`Unsupported currency: ${fromCode} or ${toCode}`);
  }
  // Cross via USD pivot: amount_to = amount_from * (toRate / fromRate)
  return toRate / fromRate;
}

export async function convert(
  amount: number,
  from: string,
  to: string,
): Promise<number> {
  const rate = await getRate(from, to);
  return amount * rate;
}

export function listCurrencies(): CurrencyInfo[] {
  return [...TOP_50];
}

export function formatCurrency(amount: number, code: string): string {
  try {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: code.toUpperCase(),
    }).format(amount);
  } catch {
    return `${amount.toFixed(2)} ${code.toUpperCase()}`;
  }
}
