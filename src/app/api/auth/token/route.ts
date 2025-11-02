import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from '@/lib/supabase-server';

/**
 * 클라이언트 사이드에서 토큰 가져오기
 * HttpOnly 쿠키에서 토큰을 읽어 클라이언트에 제공
 * (Supabase 클라이언트에서 데이터베이스 쿼리를 위해 필요)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession();

    if (!session) {
      return NextResponse.json(
        { error: 'No session' },
        { status: 401 }
      );
    }

    // 클라이언트에 토큰 제공 (일시적으로만 사용, localStorage에 저장하지 않음)
    return NextResponse.json({
      access_token: session.access_token,
      refresh_token: session.refresh_token,
      expires_at: session.expires_at,
      expires_in: session.expires_in,
      token_type: session.token_type,
    });
  } catch (error) {
    console.error('토큰 가져오기 오류:', error);
    return NextResponse.json(
      { error: 'Failed to get token' },
      { status: 500 }
    );
  }
}

