export const COUNTRY_OPTIONS = [
  { value: 'KR', label: '🇰🇷 Korea', code: 'KR' },
  { value: 'CN', label: '🇨🇳 China', code: 'CN' },
  { value: 'JP', label: '🇯🇵 Japan', code: 'JP' },
  { value: 'US', label: '🇺🇸 United States', code: 'US' },
  { value: 'OTHER', label: '🌍 Other', code: 'OTHER' },
];

export function getCountryDisplay(countryCode: string): string {
  const country = COUNTRY_OPTIONS.find((option) => option.code === countryCode);
  return country ? country.label : `🌍 ${countryCode}`;
}
