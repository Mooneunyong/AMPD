import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { Database } from '@/lib/database.types';

/**
 * 서버 사이드 Supabase 클라이언트
 * HttpOnly 쿠키를 사용하여 세션을 안전하게 관리합니다.
 * 
 * 사용 위치:
 * - Server Components
 * - Server Actions
 * - Route Handlers
 * - API Routes
 */
export async function createClient() {
  const cookieStore = await cookies();

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Server Component에서 호출된 경우 무시
            // 미들웨어에서 세션을 갱신하므로 문제없음
          }
        },
      },
    }
  );
}

