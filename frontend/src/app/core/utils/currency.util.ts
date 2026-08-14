export function getCurrencySymbol(country: string): string {
  if (!country) return '$';
  const c = country.trim().toUpperCase();
  if (c === 'US' || c === 'UNITED STATES') return '$';
  if (c === 'CA' || c === 'CANADA') return 'CA$';
  if (c === 'UK' || c === 'UNITED KINGDOM') return '£';
  if (c === 'AU' || c === 'AUSTRALIA') return 'AU$';
  if (c === 'IN' || c === 'INDIA') return '₹';
  return '$';
}
