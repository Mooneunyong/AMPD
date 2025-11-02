import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

// localStorage에 토큰 저장 (Supabase 기본 동작)
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true, // URL에서 세션 자동 감지
  },
});


// Google OAuth 로그인 함수 - 간단하고 명확한 구조로 재작성
export const signInWithGoogle = async () => {
  if (typeof window === 'undefined') {
    throw new Error('signInWithGoogle은 클라이언트 사이드에서만 호출할 수 있습니다.');
  }

  // 클라이언트 사이드 콜백 페이지로 리다이렉트 (hash fragment 처리용)
  // Supabase는 hash fragment나 query parameter로 토큰을 전달할 수 있음
  const redirectUrl = `${window.location.origin}/auth/callback`;

  console.log('[signInWithGoogle] OAuth 시작, redirectTo:', redirectUrl);

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'google',
    options: {
      redirectTo: redirectUrl,
      queryParams: {
        prompt: 'select_account',
      },
    },
  });

  if (error) {
    console.error('[signInWithGoogle] OAuth 에러:', error);
    throw error;
  }

  if (!data.url) {
    console.error('[signInWithGoogle] 리다이렉트 URL 없음');
    throw new Error('OAuth 리다이렉트 URL을 받지 못했습니다.');
  }

  console.log('[signInWithGoogle] OAuth 리다이렉트 성공');
  // Supabase가 자동으로 리다이렉트하므로 여기서는 데이터만 반환
  return data;
};

// 로그아웃 함수
export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) {
    throw error;
  }
};

// 현재 사용자 정보 가져오기
export const getCurrentUser = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error) {
    return null;
  }

  return user;
};

// 사용자 프로필 정보 가져오기
export const getUserProfile = async (userId: string) => {
  const { data, error } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('user_id', userId)
    .single();

  if (error) {
    return null;
  }

  return data;
};

// 안전한 세션 확인 함수 (에러를 발생시키지 않음)
export const safeGetSession = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();

    if (error) {
      // AuthSessionMissingError는 로그인하지 않은 상태에서는 정상
      if (error.message?.includes('Auth session missing')) {
        return { success: true, session: null, user: null };
      }
      return { success: false, error };
    }

    return {
      success: true,
      session: data.session,
      user: data.session?.user || null,
    };
  } catch (error) {
    // AuthSessionMissingError는 로그인하지 않은 상태에서는 정상
    if (
      error instanceof Error &&
      error.message?.includes('Auth session missing')
    ) {
      return { success: true, session: null, user: null };
    }
    return { success: false, error };
  }
};

// 안전한 사용자 정보 확인 함수
export const safeGetUser = async () => {
  try {
    const { data, error } = await supabase.auth.getUser();

    if (error) {
      // AuthSessionMissingError는 로그인하지 않은 상태에서는 정상
      if (error.message?.includes('Auth session missing')) {
        return { success: true, user: null };
      }
      return { success: false, error };
    }

    return { success: true, user: data.user };
  } catch (error) {
    // AuthSessionMissingError는 로그인하지 않은 상태에서는 정상
    if (
      error instanceof Error &&
      error.message?.includes('Auth session missing')
    ) {
      return { success: true, user: null };
    }
    return { success: false, error };
  }
};

// 세션 완전 초기화
export const clearAllSessions = async () => {
  try {
    // Supabase 세션 종료
    await supabase.auth.signOut();

    // localStorage 정리 (이전 세션 데이터 제거)
    if (typeof window !== 'undefined') {
      const keysToRemove = [];
      for (let i = 0; i < localStorage.length; i++) {
        const key = localStorage.key(i);
        if (
          key &&
          (key.includes('supabase') ||
            key.includes('auth') ||
            key.includes('sb-'))
        ) {
          keysToRemove.push(key);
        }
      }

      keysToRemove.forEach((key) => {
        localStorage.removeItem(key);
      });

      // 세션 스토리지도 정리
      const sessionKeysToRemove = [];
      for (let i = 0; i < sessionStorage.length; i++) {
        const key = sessionStorage.key(i);
        if (
          key &&
          (key.includes('supabase') ||
            key.includes('auth') ||
            key.includes('sb-'))
        ) {
          sessionKeysToRemove.push(key);
        }
      }

      sessionKeysToRemove.forEach((key) => {
        sessionStorage.removeItem(key);
      });
    }

    return { success: true };
  } catch (error) {
    console.error('세션 정리 오류:', error);
    return { success: false, error };
  }
};

// 간단한 로그인 테스트 함수 (개발 환경에서만 사용)
export const testLoginFlow = async () => {
  try {
    // 1. 현재 세션 상태 확인
    const { data: sessionData, error: sessionError } =
      await supabase.auth.getSession();

    // 2. 사용자 정보 확인
    const { data: userData, error: userError } = await supabase.auth.getUser();

    // 3. 스토리지 확인
    if (typeof window !== 'undefined') {
      const authKeys = Object.keys(localStorage).filter(
        (key) =>
          key.includes('supabase') ||
          key.includes('auth') ||
          key.includes('sb-')
      );

      const sessionKeys = Object.keys(sessionStorage).filter(
        (key) =>
          key.includes('supabase') ||
          key.includes('auth') ||
          key.includes('sb-')
      );
    }

    // 4. OAuth 설정 확인
    const oauthConfig = {
      currentUrl: typeof window !== 'undefined' ? window.location.href : 'N/A',
      redirectUrl:
        typeof window !== 'undefined'
          ? `${window.location.origin}/auth/callback`
          : 'N/A',
      supabaseUrl,
      anonKeyLength: supabaseAnonKey.length,
    };

    return {
      session: sessionData,
      user: userData,
      timestamp: new Date().toISOString(),
    };
  } catch (error) {
    return { error };
  }
};
