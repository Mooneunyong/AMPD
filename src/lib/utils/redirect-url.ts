/**
 * 리다이렉트 URL 유틸리티
 * 환경에 따라 올바른 리다이렉트 URL을 생성
 */

/**
 * 현재 환경에서 사용할 리다이렉트 URL 반환
 */
export function getRedirectUrl(path: string = '/auth/callback'): string {
  // 클라이언트 사이드에서는 window.location.origin 사용
  if (typeof window !== 'undefined') {
    return `${window.location.origin}${path}`;
  }

  // 서버 사이드에서는 환경 변수 사용
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || process.env.VERCEL_URL;
  
  if (siteUrl) {
    // VERCEL_URL은 https://가 없을 수 있으므로 처리
    const url = siteUrl.startsWith('http') ? siteUrl : `https://${siteUrl}`;
    return `${url}${path}`;
  }

  // 환경 변수가 없으면 localhost 사용 (개발 환경)
  return `http://localhost:3000${path}`;
}

/**
 * Supabase 리다이렉트 URL 생성
 */
export function getSupabaseRedirectUrl(): string {
  return getRedirectUrl('/auth/callback');
}

