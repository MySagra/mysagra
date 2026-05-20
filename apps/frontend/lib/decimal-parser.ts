export function parseDecimal(value: string): number {
  const normalized = value.trim().replace(/,/g, ".");
  const parsed = parseFloat(normalized);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatDecimal(value: number | string, decimals = 2): string {
  const num = typeof value === 'string' ? parseFloat(value) : Number(value);
  return isNaN(num) ? '0.00' : num.toFixed(decimals);
}
