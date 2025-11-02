// Supabase 연결 테스트 스크립트
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

console.log('=== Supabase 클라이언트 테스트 ===');
console.log('URL:', supabaseUrl);
console.log('Anon Key 길이:', supabaseAnonKey.length);
console.log('Anon Key 시작:', supabaseAnonKey.substring(0, 20) + '...');

const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: true,
  },
});

// 연결 테스트
async function testConnection() {
  try {
    console.log('=== 연결 테스트 시작 ===');
    
    // 1. 기본 연결 테스트
    const { data, error } = await supabase.from('_supabase_migrations').select('*').limit(1);
    console.log('마이그레이션 테이블 접근:', { data, error });
    
    // 2. 인증 설정 확인
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('세션 확인:', { authData, authError });
    
    // 3. OAuth 설정 확인 (Google)
    console.log('=== OAuth 설정 확인 ===');
    console.log('현재 도메인:', window.location.origin);
    console.log('예상 리다이렉트 URL:', `${window.location.origin}/auth/callback`);
    
  } catch (err) {
    console.error('연결 테스트 오류:', err);
  }
}

// 페이지 로드 시 테스트 실행
if (typeof window !== 'undefined') {
  testConnection();
}

export { testConnection };
