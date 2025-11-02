import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';
import { cookies } from 'next/headers';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
// 서비스 롤 키는 서버 사이드에서만 사용 (절대 클라이언트에 노출하지 않음)
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

/**
 * 서버 사이드에서 사용하는 Supabase 클라이언트 (서비스 롤 키 사용)
 * 이 클라이언트는 서버 사이드에서만 사용되어야 합니다.
 */
export function createServerSupabaseClient() {
  if (supabaseServiceKey) {
    // 서비스 롤 키가 있으면 관리자 권한으로 생성
    return createClient<Database>(supabaseUrl, supabaseServiceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });
  }

  // 서비스 롤 키가 없으면 일반 클라이언트 생성 (개발 환경 대비)
  return createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
}

/**
 * 쿠키에서 세션을 읽어 서버 사이드 Supabase 클라이언트 생성
 * 이 클라이언트는 쿠키에 저장된 토큰을 사용합니다.
 */
export async function createServerSupabaseClientFromCookies() {
  const cookieStore = await cookies();
  const accessToken = cookieStore.get('sb-access-token')?.value;
  const refreshToken = cookieStore.get('sb-refresh-token')?.value;

  console.log('[createServerSupabaseClientFromCookies] 쿠키 읽기:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    accessTokenLength: accessToken?.length || 0,
    refreshTokenLength: refreshToken?.length || 0,
  });

  const client = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // 쿠키에 토큰이 있으면 세션 설정
  if (accessToken && refreshToken) {
    console.log('[createServerSupabaseClientFromCookies] 세션 설정 시도...');
    const { data, error } = await client.auth.setSession({
      access_token: accessToken,
      refresh_token: refreshToken,
    });
    
    if (error) {
      console.error('[createServerSupabaseClientFromCookies] 세션 설정 오류:', error);
    } else {
      console.log('[createServerSupabaseClientFromCookies] 세션 설정 성공:', {
        userId: data.session?.user?.id,
        email: data.session?.user?.email,
      });
    }
  } else {
    console.log('[createServerSupabaseClientFromCookies] 토큰 없음 - 세션 설정 건너뜀');
  }

  return client;
}

/**
 * HttpOnly 쿠키에 토큰 저장
 * Next.js 15에서는 cookies() 함수가 Route Handler에서만 작동합니다.
 * 이 함수는 Server Component나 다른 서버 사이드 컨텍스트에서 사용할 수 없습니다.
 */
export async function setAuthCookies(
  accessToken: string,
  refreshToken: string,
  expiresIn: number = 3600
) {
  const cookieStore = await cookies();

  // HttpOnly, Secure, SameSite 쿠키 설정
  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    maxAge: expiresIn,
    path: '/',
  };

  console.log('[setAuthCookies] 쿠키 설정:', {
    hasAccessToken: !!accessToken,
    hasRefreshToken: !!refreshToken,
    expiresIn,
    secure: cookieOptions.secure,
    sameSite: cookieOptions.sameSite,
  });

  try {
    cookieStore.set('sb-access-token', accessToken, cookieOptions);
    cookieStore.set('sb-refresh-token', refreshToken, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7일 (refresh token은 더 오래 유지)
    });

    console.log('[setAuthCookies] 쿠키 설정 완료');
  } catch (error) {
    console.error('[setAuthCookies] 쿠키 설정 오류:', error);
    throw error;
  }
}

/**
 * 인증 쿠키 제거
 */
export async function clearAuthCookies() {
  const cookieStore = await cookies();

  cookieStore.delete('sb-access-token');
  cookieStore.delete('sb-refresh-token');
}

/**
 * 서버 사이드에서 현재 사용자 정보 가져오기
 */
export async function getServerUser() {
  try {
    const client = await createServerSupabaseClientFromCookies();
    const {
      data: { user },
      error,
    } = await client.auth.getUser();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error('서버 사이드 사용자 확인 오류:', error);
    return null;
  }
}

/**
 * 서버 사이드에서 현재 세션 확인
 */
export async function getServerSession() {
  try {
    const client = await createServerSupabaseClientFromCookies();
    
    // getSession() 대신 getUser()를 사용하여 세션 확인
    // setSession() 후 getSession()이 즉시 반영되지 않을 수 있음
    const {
      data: { user },
      error: userError,
    } = await client.auth.getUser();

    if (userError || !user) {
      console.log('[getServerSession] 사용자 없음:', userError?.message);
      return null;
    }

    // 쿠키에서 토큰을 다시 읽어서 세션 객체 구성
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;

    if (!accessToken || !refreshToken) {
      console.log('[getServerSession] 쿠키에서 토큰 없음');
      return null;
    }

    // 세션 객체 구성 (Supabase 세션 구조에 맞춤)
    const session = {
      access_token: accessToken,
      refresh_token: refreshToken,
      expires_in: 3600,
      expires_at: Math.floor(Date.now() / 1000) + 3600, // 대략적인 만료 시간
      token_type: 'bearer',
      user,
    };

    console.log('[getServerSession] 세션 확인 성공:', {
      userId: user.id,
      email: user.email,
    });

    return session as any; // Supabase Session 타입에 맞춤
  } catch (error) {
    console.error('[getServerSession] 서버 사이드 세션 확인 오류:', error);
    return null;
  }
}

