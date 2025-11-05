import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { Database } from '@/lib/database.types';

/**
 * 미들웨어에서 사용하는 Supabase 클라이언트
 * 요청마다 세션을 갱신하고 쿠키를 업데이트합니다.
 */
export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            supabaseResponse.cookies.set(name, value, {
              ...options,
              httpOnly: true,
              secure: process.env.NODE_ENV === 'production',
              sameSite: 'lax' as const,
            });
          });
        },
      },
    }
  );

  // 세션 갱신 (만료된 토큰 자동 갱신)
  // 중요: getSession() 대신 getUser()를 사용하여 토큰을 재검증합니다
  await supabase.auth.getUser();

  return supabaseResponse;
}

