/**
 * 클라이언트 사이드에서 서버 인증 API 호출
 * HttpOnly 쿠키 기반 인증을 사용합니다.
 */

/**
 * 현재 세션 확인 (서버 API 호출)
 */
export async function getSession() {
  try {
    const response = await fetch('/api/auth/session', {
      method: 'GET',
      credentials: 'include', // 쿠키 포함
    });

    if (!response.ok) {
      return { user: null, session: null };
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('세션 확인 오류:', error);
    return { user: null, session: null };
  }
}

/**
 * 로그아웃 (서버 API 호출)
 */
export async function logout() {
  try {
    const response = await fetch('/api/auth/logout', {
      method: 'POST',
      credentials: 'include', // 쿠키 포함
    });

    if (!response.ok) {
      throw new Error('로그아웃 실패');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('로그아웃 오류:', error);
    throw error;
  }
}

