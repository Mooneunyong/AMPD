import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { setAuthCookies } from '@/lib/supabase-server';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * OAuth 콜백 처리 및 HttpOnly 쿠키에 토큰 저장
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const code = searchParams.get('code');
    const error = searchParams.get('error');
    const errorDescription = searchParams.get('error_description');

    console.log('========================================');
    console.log('[Auth Callback API] 시작');
    console.log('URL:', request.url);
    console.log('Search Params:', request.nextUrl.search);
    console.log('Has Code:', !!code);
    console.log('Code Length:', code?.length || 0);
    console.log('Error:', error);
    console.log('Error Description:', errorDescription);
    console.log('========================================');

    // 에러가 있으면 처리
    if (error) {
      console.error('[Auth Callback] OAuth 에러:', { error, errorDescription });
      const redirectUrl = new URL('/auth/callback', request.url);
      redirectUrl.searchParams.set('error', error);
      if (errorDescription) {
        redirectUrl.searchParams.set('error_description', errorDescription);
      }
      return NextResponse.redirect(redirectUrl);
    }

    // 코드가 없으면 에러
    if (!code) {
      console.error('[Auth Callback] 인증 코드 없음');
      const redirectUrl = new URL('/auth/callback', request.url);
      redirectUrl.searchParams.set('error', 'missing_code');
      redirectUrl.searchParams.set('error_description', '인증 코드가 제공되지 않았습니다.');
      return NextResponse.redirect(redirectUrl);
    }

    // Supabase 클라이언트 생성
    const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    });

    // 코드를 세션으로 교환
    console.log('[Auth Callback] 세션 교환 시도...');
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);

    if (exchangeError || !data.session) {
      console.error('[Auth Callback] 세션 교환 실패:', {
        error: exchangeError,
        hasSession: !!data.session,
      });
      const redirectUrl = new URL('/auth/callback', request.url);
      redirectUrl.searchParams.set('error', 'exchange_failed');
      redirectUrl.searchParams.set(
        'error_description',
        exchangeError?.message || '세션 교환에 실패했습니다.'
      );
      return NextResponse.redirect(redirectUrl);
    }

    const { access_token, refresh_token, expires_in } = data.session;

    if (!access_token || !refresh_token) {
      console.error('[Auth Callback] 토큰 없음:', {
        hasAccessToken: !!access_token,
        hasRefreshToken: !!refresh_token,
      });
      const redirectUrl = new URL('/auth/callback', request.url);
      redirectUrl.searchParams.set('error', 'missing_tokens');
      redirectUrl.searchParams.set('error_description', '토큰을 받아오지 못했습니다.');
      return NextResponse.redirect(redirectUrl);
    }

    console.log('[Auth Callback] 쿠키 저장 시도...');
    
    // Next.js 15 Route Handler에서 쿠키 설정은 NextResponse 객체를 사용해야 함
    const redirectResponse = NextResponse.redirect(new URL('/', request.url));
    
    const expiresIn = expires_in || 3600;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // HttpOnly 쿠키에 토큰 저장
    redirectResponse.cookies.set('sb-access-token', access_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: expiresIn,
      path: '/',
    });
    
    redirectResponse.cookies.set('sb-refresh-token', refresh_token, {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7, // 7일
      path: '/',
    });

    console.log('========================================');
    console.log('[Auth Callback] 성공! 쿠키 설정 완료');
    console.log('쿠키 정보:');
    console.log('- sb-access-token: 설정됨');
    console.log('- sb-refresh-token: 설정됨');
    console.log('- Secure:', isProduction);
    console.log('- SameSite: lax');
    console.log('- MaxAge (access):', expiresIn);
    console.log('- MaxAge (refresh):', 60 * 60 * 24 * 7);
    console.log('홈으로 리다이렉트합니다.');
    console.log('========================================');
    return redirectResponse;
  } catch (error) {
    console.error('[Auth Callback] 예외 발생:', error);
    const redirectUrl = new URL('/auth/callback', request.url);
    redirectUrl.searchParams.set('error', 'internal_error');
    redirectUrl.searchParams.set(
      'error_description',
      error instanceof Error ? error.message : '내부 오류가 발생했습니다.'
    );
    return NextResponse.redirect(redirectUrl);
  }
}

