/**
 * Supabase 연결 테스트 스크립트
 * 개발 환경에서만 사용합니다.
 */
import { supabase } from './supabase';

// 연결 테스트 함수
export async function testConnection() {
  if (process.env.NODE_ENV !== 'development') {
    console.warn('testConnection은 개발 환경에서만 사용할 수 있습니다.');
    return;
  }

  try {
    console.log('=== Supabase 연결 테스트 시작 ===');

    // 1. 기본 연결 테스트
    const { data, error } = await supabase
      .from('_supabase_migrations')
      .select('*')
      .limit(1);
    console.log('마이그레이션 테이블 접근:', { data, error });

    // 2. 인증 설정 확인
    const { data: authData, error: authError } = await supabase.auth.getSession();
    console.log('세션 확인:', { authData, authError });

    // 3. OAuth 설정 확인 (Google)
    if (typeof window !== 'undefined') {
      console.log('=== OAuth 설정 확인 ===');
      console.log('현재 도메인:', window.location.origin);
      console.log('예상 리다이렉트 URL:', `${window.location.origin}/auth/callback`);
    }

    console.log('=== 연결 테스트 완료 ===');
  } catch (err) {
    console.error('연결 테스트 오류:', err);
  }
}
