import { createBrowserClient } from '@supabase/ssr';
import { Database } from '@/lib/database.types';

/**
 * 클라이언트 사이드 Supabase 클라이언트
 * 브라우저 환경에서 사용되며, localStorage에 토큰을 저장합니다.
 * 
 * 사용 위치:
 * - Client Components ('use client')
 * - 브라우저에서 실행되는 코드
 * 
 * 주의: localStorage는 XSS 공격에 취약하지만,
 * Supabase 클라이언트 라이브러리가 필요로 하므로 사용합니다.
 * 서버 사이드 작업은 server.ts의 createClient를 사용하세요.
 */
export function createClient() {
  return createBrowserClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

