import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase-server';

/**
 * 현재 세션 정보 확인 (클라이언트에서 호출)
 */
export async function GET(request: NextRequest) {
  try {
    // 쿠키 확인
    const { cookies } = await import('next/headers');
    const cookieStore = await cookies();
    const accessToken = cookieStore.get('sb-access-token')?.value;
    const refreshToken = cookieStore.get('sb-refresh-token')?.value;
    
    console.log('========================================');
    console.log('[Auth Session API] 쿠키 확인');
    console.log('Has Access Token:', !!accessToken);
    console.log('Has Refresh Token:', !!refreshToken);
    console.log('Access Token Length:', accessToken?.length || 0);
    console.log('Refresh Token Length:', refreshToken?.length || 0);
    console.log('========================================');

    const session = await getServerSession();

    if (!session) {
      console.log('[Auth Session API] 세션 없음 - 쿠키에서 토큰을 읽었지만 세션 생성 실패');
      return NextResponse.json(
        { user: null, session: null },
        { status: 200 }
      );
    }

    console.log('========================================');
    console.log('[Auth Session API] 세션 확인 성공');
    console.log('User ID:', session.user?.id);
    console.log('User Email:', session.user?.email);
    console.log('========================================');

    return NextResponse.json({
      user: session.user,
      session: {
        access_token: session.access_token,
        expires_at: session.expires_at,
        expires_in: session.expires_in,
        refresh_token: session.refresh_token,
        token_type: session.token_type,
      },
    });
  } catch (error) {
    console.error('[Auth Session API] 세션 확인 오류:', error);
    return NextResponse.json(
      { error: '세션 확인 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}

