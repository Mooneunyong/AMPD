/**
 * 스토어 URL을 지역에 맞게 변환하는 유틸리티 함수
 */

// 지역별 국가 코드 및 언어 코드 매핑
const REGION_TO_STORE_CODES: Record<
  string,
  { countryCode: string; languageCode: string }
> = {
  KR: { countryCode: 'kr', languageCode: 'ko' },
  JP: { countryCode: 'jp', languageCode: 'ja' },
  TW: { countryCode: 'tw', languageCode: 'zh-TW' },
  US: { countryCode: 'us', languageCode: 'en' },
};

/**
 * App Store URL을 특정 지역으로 변환
 * @param url - App Store URL
 * @param region - 지역 코드 (KR, JP, TW, US)
 * @returns 변환된 App Store URL
 */
function convertAppStoreUrl(url: string, region: string): string {
  const codes = REGION_TO_STORE_CODES[region];
  if (!codes) return url;

  // App Store URL 패턴: https://apps.apple.com/{country}/app/... 또는 https://apps.apple.com/app/...
  const appStorePattern =
    /^https?:\/\/(apps\.apple\.com|itunes\.apple\.com)\/([a-z]{2}\/)?app\//i;

  if (!appStorePattern.test(url)) {
    return url; // App Store URL이 아니면 그대로 반환
  }

  try {
    const urlObj = new URL(url);
    const pathname = urlObj.pathname;

    // 이미 국가 코드가 있는 경우 (예: /kr/app/...)
    const pathMatch = pathname.match(/^\/([a-z]{2})\/app\//i);
    if (pathMatch) {
      // 기존 국가 코드를 새로운 것으로 교체
      const newPathname = pathname.replace(
        /^\/([a-z]{2})\/app\//i,
        `/${codes.countryCode}/app/`
      );
      urlObj.pathname = newPathname;
    } else {
      // 국가 코드가 없는 경우 (예: /app/...) 추가
      const newPathname = pathname.replace(
        /^\/app\//i,
        `/${codes.countryCode}/app/`
      );
      urlObj.pathname = newPathname;
    }

    return urlObj.toString();
  } catch (error) {
    console.error('App Store URL 변환 오류:', error);
    return url;
  }
}

/**
 * Google Play URL을 특정 지역으로 변환
 * @param url - Google Play URL
 * @param region - 지역 코드 (KR, JP, TW, US)
 * @returns 변환된 Google Play URL
 */
function convertGooglePlayUrl(url: string, region: string): string {
  const codes = REGION_TO_STORE_CODES[region];
  if (!codes) return url;

  // Google Play URL 패턴 확인
  const googlePlayPattern = /^https?:\/\/play\.google\.com\//i;

  if (!googlePlayPattern.test(url)) {
    return url; // Google Play URL이 아니면 그대로 반환
  }

  try {
    const urlObj = new URL(url);

    // hl 파라미터 추가 또는 교체
    urlObj.searchParams.set('hl', codes.languageCode);

    return urlObj.toString();
  } catch (error) {
    console.error('Google Play URL 변환 오류:', error);
    return url;
  }
}

/**
 * 스토어 URL을 특정 지역으로 변환
 * @param url - 스토어 URL (App Store 또는 Google Play)
 * @param region - 지역 코드 (KR, JP, TW, US)
 * @returns 변환된 스토어 URL
 */
export function convertStoreUrlByRegion(
  url: string | null | undefined,
  region: string | null | undefined
): string | null {
  if (!url || !region) {
    return url || null;
  }

  // App Store URL인지 확인
  if (/apps\.apple\.com|itunes\.apple\.com/i.test(url)) {
    return convertAppStoreUrl(url, region);
  }

  // Google Play URL인지 확인
  if (/play\.google\.com/i.test(url)) {
    return convertGooglePlayUrl(url, region);
  }

  // 둘 다 아닌 경우 원본 URL 반환
  return url;
}
