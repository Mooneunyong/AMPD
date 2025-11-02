import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    // detectSessionInUrl 제거 - 수동으로 처리하겠음
  },
});

// Google OAuth 로그인 함수
export const signInWithGoogle = async () => {
  // 환경에 따라 올바른 리다이렉트 URL 생성
  const redirectUrl = 
    typeof window !== 'undefined'
      ? `${window.location.origin}/auth/callback`
      : process.env.NEXT_PUBLIC_SITE_URL
      ? `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`
      : 'http://localhost:3000/auth/callback';

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
    throw error;
  }

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
    // Supabase 로그아웃
    await supabase.auth.signOut();

    // 로컬 스토리지 정리
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
