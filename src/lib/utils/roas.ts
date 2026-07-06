import * as React from 'react';

// ROAS 계열 컬럼 판별 (ROAS, D0 ROAS, D7 ROAS ...)
export const isRoasColumn = (header: string) =>
  header.toLowerCase().includes('roas');

// "130.20%" / "0.6502" 같은 문자열을 0.0~∞ 비율로 파싱
export const parseRoasPercent = (val: unknown): number | null => {
  if (val === null || val === undefined) return null;
  const str = String(val).trim();
  if (!str || str === '-') return null;
  const hasPercent = str.endsWith('%');
  const cleaned = str.replace(/[$,\s]/g, '').replace(/%$/, '');
  const n = parseFloat(cleaned);
  if (isNaN(n)) return null;
  return hasPercent ? n / 100 : n;
};

// ROAS 값 스타일:
// - 텍스트: 진한 초록(green-700) — 값이 있으면 항상 적용
// - 배경: 0% → 투명, 100% 이상 → 가장 진한 녹색(green-500, 투명도 0.6 상한)
export const roasBgStyle = (
  val: unknown
): React.CSSProperties | undefined => {
  const num = parseRoasPercent(val);
  if (num === null) return undefined;
  const style: React.CSSProperties = {
    color: 'rgb(21, 128, 61)', // Tailwind green-700 (진한 초록)
    fontWeight: 600,
  };
  if (num > 0) {
    const opacity = Math.min(num, 1) * 0.6;
    style.backgroundColor = `rgba(34, 197, 94, ${opacity})`;
  }
  return style;
};
