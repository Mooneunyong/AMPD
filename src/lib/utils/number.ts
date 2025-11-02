/**
 * 숫자 및 통화 관련 유틸리티 함수
 */

/**
 * 숫자를 통화 형식으로 포맷팅
 */
export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * 숫자를 퍼센트 형식으로 포맷팅
 */
export function formatPercentage(value: number, decimals = 1): string {
  const sign = value > 0 ? '+' : '';
  return `${sign}${value.toFixed(decimals)}%`;
}

/**
 * 숫자를 천 단위 구분자와 함께 포맷팅
 */
export function formatNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR').format(value);
}

/**
 * 큰 숫자를 축약 형식으로 포맷팅 (예: 1.2K, 1.5M)
 */
export function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('ko-KR', {
    notation: 'compact',
    maximumFractionDigits: 1,
  }).format(value);
}

/**
 * 숫자 범위 유효성 검사
 */
export function isValidNumberRange(min: number, max: number): boolean {
  return min <= max;
}

/**
 * 숫자가 양수인지 확인
 */
export function isPositiveNumber(value: number): boolean {
  return value > 0;
}

/**
 * 숫자가 음수인지 확인
 */
export function isNegativeNumber(value: number): boolean {
  return value < 0;
}

/**
 * 숫자가 0인지 확인
 */
export function isZero(value: number): boolean {
  return value === 0;
}
