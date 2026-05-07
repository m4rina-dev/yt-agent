import type { OddsFormat } from './types.js';

export function parseDecimal(raw: string): number {
    const trimmed = raw.trim();
    if (trimmed.includes('/')) {
        const [n, d] = trimmed.split('/').map(Number);
        return 1 + n / d;
    }
    return Number(trimmed);
}

export function toFractional(decimal: number): string {
    const numerator = decimal - 1;
    const precision = 1_000_000;
    const gcd = (a: number, b: number): number => (b ? gcd(b, a % b) : a);
    const top = Math.round(numerator * precision);
    const bottom = precision;
    const divisor = gcd(top, bottom);
    return `${top / divisor}/${bottom / divisor}`;
}

export function toAmerican(decimal: number): string {
    if (decimal >= 2) {
        return `+${Math.round((decimal - 1) * 100)}`;
    }
    return `${Math.round(-100 / (decimal - 1))}`;
}

export function formatOdds(decimalRaw: string, format: OddsFormat): string {
    if (format === 'fractional' && decimalRaw.includes('/')) return decimalRaw;
    const decimal = parseDecimal(decimalRaw);
    if (!Number.isFinite(decimal) || decimal <= 1) return decimalRaw;
    switch (format) {
        case 'decimal':
            return decimal.toFixed(2);
        case 'fractional':
            return toFractional(decimal);
        case 'american':
            return toAmerican(decimal);
    }
}
