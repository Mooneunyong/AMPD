import { NextRequest, NextResponse } from 'next/server';

/**
 * Hash fragment에서 토큰을 추출하여 HttpOnly 쿠키에 저장
 * 클라이언트에서 hash fragment를 처리한 후 이 API를 호출합니다.
 */
export async function POST(request: NextRequest) {
  try {
    const { access_token, refresh_token, expires_in } = await request.json();

    if (!access_token || !refresh_token) {
      return NextResponse.json(
        { error: '토큰이 제공되지 않았습니다.' },
        { status: 400 }
      );
    }

    console.log('[Auth Callback Hash] 쿠키 저장 시도...', {
      hasAccessToken: !!access_token,
      hasRefreshToken: !!refresh_token,
      expiresIn: expires_in || 3600,
      tokenLength: access_token.length,
    });
    
    const expiresIn = expires_in || 3600;
    const isProduction = process.env.NODE_ENV === 'production';
    
    // 중요: Next.js 15에서 POST 요청의 JSON 응답으로 쿠키가 설정되지 않을 수 있음
    // 따라서 리다이렉트 응답을 사용하여 쿠키 설정 (브라우저가 쿠키를 저장하도록 보장)
    
    // 리다이렉트 URL 생성 (쿠키 설정을 위해 리다이렉트 응답 사용)
    // 클라이언트로 리다이렉트하여 쿠키 설정 확인
    const redirectUrl = new URL('/auth/callback?success=true', request.url);
    
    // 리다이렉트 응답 생성 (쿠키 설정용)
    // 리다이렉트 응답이 브라우저에서 쿠키 설정을 보장합니다
    const response = NextResponse.redirect(redirectUrl, {
      status: 302,
    });
    
    // HttpOnly 쿠키 설정 옵션
    const cookieOptions = {
      httpOnly: true,
      secure: isProduction,
      sameSite: 'lax' as const,
      path: '/',
    };

    // 쿠키 설정 - 명시적으로 모든 옵션 지정
    response.cookies.set('sb-access-token', access_token, {
      ...cookieOptions,
      maxAge: expiresIn,
    });
    
    response.cookies.set('sb-refresh-token', refresh_token, {
      ...cookieOptions,
      maxAge: 60 * 60 * 24 * 7, // 7일 (604800초)
    });

    // 쿠키가 실제로 설정되었는지 확인
    const accessTokenCookie = response.cookies.get('sb-access-token');
    const refreshTokenCookie = response.cookies.get('sb-refresh-token');

    console.log('[Auth Callback Hash] 쿠키 설정 완료!', {
      secure: isProduction,
      sameSite: 'lax',
      accessTokenMaxAge: expiresIn,
      refreshTokenMaxAge: 60 * 60 * 24 * 7,
      accessTokenCookieSet: !!accessTokenCookie,
      refreshTokenCookieSet: !!refreshTokenCookie,
      cookieValueLength: accessTokenCookie?.value?.length || 0,
      redirectUrl: redirectUrl.toString(),
    });
    
    // 리다이렉트 응답 반환 (쿠키는 Set-Cookie 헤더로 포함됨)
    return response;
  } catch (error) {
    console.error('[Auth Callback Hash] 예외 발생:', error);
    return NextResponse.json(
      {
        error: '내부 오류가 발생했습니다.',
        details: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

