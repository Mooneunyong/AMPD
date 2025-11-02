/**
 * 게임 정보 가져오기 TanStack Query 훅
 */

import { useQuery, UseQueryOptions } from '@tanstack/react-query';

interface GameInfo {
  game_name?: string;
  logo_url?: string;
  package_identifier?: string;
}

interface FetchGameInfoResponse {
  data?: GameInfo;
  error?: string;
}

/**
 * 게임 정보를 가져오는 API 호출
 */
async function fetchGameInfo(url: string): Promise<GameInfo> {
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

  const result: FetchGameInfoResponse = await response.json();
  return result.data || {};
}

/**
 * 게임 정보를 가져오는 TanStack Query 훅
 * 같은 URL에 대한 자동 캐싱 및 중복 요청 방지
 */
export function useGameInfo(
  url: string | null | undefined,
  options?: Omit<UseQueryOptions<GameInfo, Error>, 'queryKey' | 'queryFn'>
) {
  return useQuery({
    queryKey: ['game-info', url],
    queryFn: () => fetchGameInfo(url!),
    enabled: !!url && !!url.trim(),
    staleTime: 1000 * 60 * 5, // 5분 동안 캐시 유지
    gcTime: 1000 * 60 * 10, // 10분 동안 가비지 컬렉션 방지
    retry: 1,
    ...options,
  });
}

