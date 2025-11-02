/**
 * 게임 정보 캐싱 유틸리티 (레거시 호환)
 * @deprecated 컴포넌트에서는 useGameInfo 훅을 직접 사용하는 것을 권장합니다
 */

/**
 * 게임 정보를 가져오는 함수 (레거시 호환)
 * @deprecated useGameInfo 훅을 직접 사용하는 것을 권장합니다
 */
export async function fetchGameInfoWithCache(
  url: string
): Promise<{ game_name?: string; logo_url?: string }> {
  const response = await fetch('/api/fetch-game-info', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ url }),
  });

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();
  const gameInfo = result.data || result;

  return {
    game_name: gameInfo?.game_name,
    logo_url: gameInfo?.logo_url,
  };
}

