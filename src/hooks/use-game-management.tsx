/**
 * 게임 관리 훅
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

export interface Game {
  id: string;
  account_id: string;
  game_name: string;
  platform: string;
  store_url: string | null;
  package_identifier: string | null;
  created_at: string | null;
  updated_at: string | null;
  // 조인된 데이터
  account_company?: string;
  account_country?: string;
}

export interface GameFormData {
  account_id: string;
  game_name: string;
  platform: string;
  store_url?: string;
  package_identifier?: string;
}

// 플랫폼 옵션
export const PLATFORM_OPTIONS = [
  { value: 'ios', label: 'iOS' },
  { value: 'android', label: 'Android' },
  { value: 'both', label: 'Both' },
];

// 모든 게임 조회 (계정 정보 포함)
export async function getAllGames(): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(
      `
      *,
      accounts!inner(
        id,
        company,
        country
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('게임 조회 오류:', error);
    throw new Error('게임을 불러올 수 없습니다.');
  }

  return data.map((game: any) => ({
    ...game,
    account_company: game.accounts.company,
    account_country: game.accounts.country,
  }));
}

// 특정 계정의 게임 조회
export async function getGamesByAccount(accountId: string): Promise<Game[]> {
  const { data, error } = await supabase
    .from('games')
    .select(
      `
      *,
      accounts!inner(
        id,
        company,
        country
      )
    `
    )
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('계정별 게임 조회 오류:', error);
    throw new Error('게임을 불러올 수 없습니다.');
  }

  return data.map((game: any) => ({
    ...game,
    account_company: game.accounts.company,
    account_country: game.accounts.country,
  }));
}

// 게임 생성
export async function createGame(gameData: GameFormData): Promise<Game> {
  // 데이터 검증
  if (!gameData.account_id) {
    throw new Error('Account ID is required');
  }
  if (!gameData.game_name || !gameData.game_name.trim()) {
    throw new Error('Game name is required');
  }
  if (!gameData.platform) {
    throw new Error('Platform is required');
  }

  // Platform 값 검증 (데이터베이스 제약조건: 'iOS', 'Android', 'Both')
  const validPlatforms = ['iOS', 'Android', 'Both'];
  if (!validPlatforms.includes(gameData.platform)) {
    throw new Error(
      `Invalid platform: ${
        gameData.platform
      }. Must be one of: ${validPlatforms.join(', ')}`
    );
  }

  // 중복 체크: 같은 account_id와 game_name 조합이 이미 존재하는지 확인
  const { data: existingGames, error: checkError } = await supabase
    .from('games')
    .select('id, game_name')
    .eq('account_id', gameData.account_id)
    .eq('game_name', gameData.game_name.trim());

  if (checkError) {
    console.error('중복 체크 오류:', checkError);
    throw new Error('게임 중복 확인 중 오류가 발생했습니다.');
  }

  if (existingGames && existingGames.length > 0) {
    throw new Error(
      `이미 같은 이름의 게임이 존재합니다: "${gameData.game_name}"`
    );
  }

  // 추가 중복 체크: 같은 account_id와 store_url 조합 확인 (store_url이 있는 경우)
  if (gameData.store_url) {
    const { data: existingStoreUrlGames, error: storeUrlCheckError } =
      await supabase
        .from('games')
        .select('id, game_name, store_url')
        .eq('account_id', gameData.account_id)
        .eq('store_url', gameData.store_url);

    if (storeUrlCheckError) {
      console.error('스토어 URL 중복 체크 오류:', storeUrlCheckError);
      throw new Error('스토어 URL 중복 확인 중 오류가 발생했습니다.');
    }

    if (
      existingStoreUrlGames &&
      existingStoreUrlGames.length > 0 &&
      existingStoreUrlGames[0]
    ) {
      const existingGame = existingStoreUrlGames[0] as unknown as {
        id: string;
        game_name: string;
        store_url: string | null;
      };
      throw new Error(
        `이미 같은 스토어 URL을 가진 게임이 존재합니다: "${existingGame.game_name}"`
      );
    }
  }

  // 추가 중복 체크: 같은 account_id와 package_identifier 조합 확인 (package_identifier가 있는 경우)
  if (gameData.package_identifier) {
    const { data: existingPackageGames, error: packageCheckError } =
      await supabase
        .from('games')
        .select('id, game_name, package_identifier')
        .eq('account_id', gameData.account_id)
        .eq('package_identifier', gameData.package_identifier);

    if (packageCheckError) {
      console.error('패키지 ID 중복 체크 오류:', packageCheckError);
      throw new Error('패키지 ID 중복 확인 중 오류가 발생했습니다.');
    }

    if (
      existingPackageGames &&
      existingPackageGames.length > 0 &&
      existingPackageGames[0]
    ) {
      const existingGame = existingPackageGames[0] as unknown as {
        id: string;
        game_name: string;
        package_identifier: string | null;
      };
      throw new Error(
        `이미 같은 패키지 ID를 가진 게임이 존재합니다: "${existingGame.game_name}"`
      );
    }
  }

  // 현재 사용자 세션 확인
  const {
    data: { session },
    error: sessionError,
  } = await supabase.auth.getSession();
  if (sessionError || !session) {
    console.error('세션 오류:', sessionError);
    throw new Error('로그인이 필요합니다. 다시 로그인해주세요.');
  }

  const { data, error } = await supabase
    .from('games')
    .insert([gameData])
    .select(
      `
      *,
      accounts!inner(
        id,
        company,
        country
      )
    `
    )
    .single();

  if (error) {
    console.error('게임 생성 오류:', error);
    console.error('에러 타입:', typeof error);
    console.error('에러 키:', Object.keys(error || {}));
    console.error('에러 전체:', JSON.stringify(error, null, 2));
    console.error('전송된 데이터:', JSON.stringify(gameData, null, 2));

    // Supabase 에러 객체에서 메시지 추출
    let errorMessage = '알 수 없는 오류';

    // 에러 객체의 모든 속성을 확인
    try {
      // Supabase PostgREST 에러는 보통 이런 구조를 가짐
      if (error && typeof error === 'object') {
        // 직접 속성 접근
        const message = (error as any).message;
        const code = (error as any).code;
        const details = (error as any).details;
        const hint = (error as any).hint;

        if (message && typeof message === 'string') {
          errorMessage = message;
        } else if (code && typeof code === 'string') {
          errorMessage = `Error code: ${code}`;
          if (details) errorMessage += ` - ${details}`;
        } else if (details && typeof details === 'string') {
          errorMessage = details;
        } else if (hint && typeof hint === 'string') {
          errorMessage = hint;
        } else {
          // 객체를 문자열로 변환 시도
          const errorStr = JSON.stringify(
            error,
            (key, value) => {
              // 순환 참조 방지
              if (typeof value === 'object' && value !== null) {
                return value;
              }
              return value;
            },
            2
          );

          if (errorStr && errorStr !== '{}') {
            errorMessage = `Error details: ${errorStr}`;
          } else {
            // 객체의 모든 열거 가능한 속성 추출
            const props: string[] = [];
            for (const key in error) {
              if (Object.prototype.hasOwnProperty.call(error, key)) {
                props.push(`${key}: ${(error as any)[key]}`);
              }
            }
            if (props.length > 0) {
              errorMessage = props.join(', ');
            }
          }
        }

        // 힌트가 있으면 추가
        const finalHint = (error as any).hint;
        if (finalHint && typeof finalHint === 'string') {
          errorMessage += ` (${finalHint})`;
        }
      } else if (typeof error === 'string') {
        errorMessage = error;
      }
    } catch (parseError) {
      console.error('에러 파싱 오류:', parseError);
      errorMessage = `Failed to parse error: ${error}`;
    }

    throw new Error(`게임을 생성할 수 없습니다: ${errorMessage}`);
  }

  return {
    ...data,
    store_url: data.store_url || null,
    package_identifier: data.package_identifier || null,
    account_company: data.accounts.company,
    account_country: data.accounts.country,
  };
}

// 게임 수정
export async function updateGame(
  gameId: string,
  gameData: Partial<GameFormData>
): Promise<Game> {
  const { data, error } = await supabase
    .from('games')
    .update(gameData)
    .eq('id', gameId)
    .select(
      `
      *,
      accounts!inner(
        id,
        company,
        country
      )
    `
    )
    .single();

  if (error) {
    console.error('게임 수정 오류:', error);
    throw new Error('게임을 수정할 수 없습니다.');
  }

  return {
    ...data,
    store_url: data.store_url || null,
    package_identifier: data.package_identifier || null,
    account_company: data.accounts.company,
    account_country: data.accounts.country,
  };
}

// 게임 삭제
export async function deleteGame(gameId: string): Promise<void> {
  const { data, error } = await supabase
    .from('games')
    .delete()
    .eq('id', gameId)
    .select();

  if (error) {
    console.error('게임 삭제 오류:', error);
    const errorMessage =
      error.message ||
      error.code ||
      error.details ||
      '게임을 삭제할 수 없습니다.';
    throw new Error(errorMessage);
  }

  // 삭제된 레코드가 없는 경우
  if (!data || data.length === 0) {
    console.warn('삭제된 게임이 없습니다. 게임 ID:', gameId);
    throw new Error('게임을 찾을 수 없거나 삭제 권한이 없습니다.');
  }
}

export function useGameManagement() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 게임 목록 로드
  const loadGames = async () => {
    try {
      setLoading(true);
      setError(null);
      const gameData = await getAllGames();
      setGames(gameData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '게임을 불러올 수 없습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 새 게임 추가
  const addGame = async (gameData: GameFormData) => {
    try {
      const newGame = await createGame(gameData);
      setGames((prevGames) => [newGame, ...prevGames]);
      return newGame;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '게임을 생성할 수 없습니다.'
      );
      throw err;
    }
  };

  // 게임 수정
  const updateGameData = async (
    gameId: string,
    gameData: Partial<GameFormData>
  ) => {
    try {
      const updatedGame = await updateGame(gameId, gameData);
      setGames((prevGames) =>
        prevGames.map((game) => (game.id === gameId ? updatedGame : game))
      );
      return updatedGame;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '게임을 수정할 수 없습니다.'
      );
      throw err;
    }
  };

  // 게임 삭제
  const removeGame = async (gameId: string) => {
    try {
      await deleteGame(gameId);
      setGames((prevGames) => prevGames.filter((game) => game.id !== gameId));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '게임을 삭제할 수 없습니다.'
      );
      throw err;
    }
  };

  // 초기 로드
  useEffect(() => {
    loadGames();
  }, []);

  return {
    games,
    loading,
    error,
    loadGames,
    addGame,
    updateGame: updateGameData,
    removeGame,
  };
}
