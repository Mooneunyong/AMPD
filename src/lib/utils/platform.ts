/**
 * 플랫폼 관련 유틸리티 함수
 */

/**
 * 플랫폼 표시 텍스트 변환 (이모지 포함)
 */
export function getPlatformDisplay(platform: string): string {
  const platformMap: Record<string, string> = {
    iOS: 'iOS',
    Android: 'Android',
    Both: 'Both',
    ios: '📱 iOS',
    android: '🤖 Android',
    both: '📱🤖 Both',
  };
  return platformMap[platform] || platform;
}
