import { supabase } from './supabase';

/**
 * 사용자 인증 상태 확인 (도메인 검증 제거)
 */
export const validateUserAuth = async () => {
  const {
    data: { user },
    error,
  } = await supabase.auth.getUser();

  if (error || !user) {
    return { isValid: false, user: null, error: '인증되지 않은 사용자입니다.' };
  }

  console.log(`사용자 인증 성공: ${user.email}`);
  return { isValid: true, user, error: null };
};

/**
 * 인증 상태 변경 감지
 */
export const onAuthStateChange = (callback: (user: any) => void) => {
  return supabase.auth.onAuthStateChange(async (event, session) => {
    if (event === 'SIGNED_IN' && session?.user) {
      // 로그인 시 도메인 검증 제거
      const validation = await validateUserAuth();
      if (!validation.isValid) {
        callback(null);
        return;
      }
    }
    callback(session?.user || null);
  });
};
