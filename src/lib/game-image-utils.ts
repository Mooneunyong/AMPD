/**
 * 게임 스토어 URL에서 이미지 URL을 추출하는 유틸리티
 * TanStack Query의 useGameInfo 훅을 사용하는 것을 권장합니다
 */

import { fetchGameInfoWithCache } from '@/lib/utils/game-info-cache';

/**
 * 스토어 URL로부터 게임 이미지 URL을 가져옵니다
 * @deprecated 컴포넌트에서는 useGameInfo 훅을 직접 사용하는 것을 권장합니다
 */
export async function getGameImageUrl(storeUrl: string | null): Promise<string | null> {
  if (!storeUrl || !storeUrl.trim()) {
    return null;
  }

  try {
    const gameInfo = await fetchGameInfoWithCache(storeUrl);
    return gameInfo.logo_url || null;
  } catch (error) {
    console.error('게임 이미지 가져오기 오류:', error);
    return null;
  }
}

