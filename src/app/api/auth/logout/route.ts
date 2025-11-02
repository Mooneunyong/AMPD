import { NextRequest, NextResponse } from 'next/server';
import { clearAuthCookies } from '@/lib/supabase-server';
import { createServerSupabaseClientFromCookies } from '@/lib/supabase-server';

/**
 * 로그아웃 처리 및 쿠키 제거
 */
export async function POST(request: NextRequest) {
  try {
    // Supabase에서 세션 종료
    const client = await createServerSupabaseClientFromCookies();
    await client.auth.signOut();

    // HttpOnly 쿠키 제거
    await clearAuthCookies();

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('로그아웃 처리 오류:', error);

    // 에러가 발생해도 쿠키는 제거
    await clearAuthCookies();

    return NextResponse.json({ success: true });
  }
}

