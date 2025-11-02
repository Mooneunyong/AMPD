'use client';

import { useEffect, useState, useRef } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase, signOut as supabaseSignOut } from '@/lib/supabase';

interface AuthState {
  user: User | null;
  loading: boolean;
  error: string | null;
}

export function useAuth() {
  const [authState, setAuthState] = useState<AuthState>({
    user: null,
    loading: true,
    error: null,
  });
  const hasInitiallyLoadedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    // 초기 인증 상태 확인
    const checkAuth = async () => {
      try {
        const {
          data: { session },
          error,
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (error) {
          console.error('[useAuth] 세션 확인 오류:', error);
          setAuthState({
            user: null,
            loading: false,
            error: '인증 확인 중 오류가 발생했습니다.',
          });
          return;
        }

        setAuthState({
          user: session?.user || null,
          loading: false,
          error: null,
        });
        hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시
      } catch (error) {
        console.error('[useAuth] 인증 확인 오류:', error);
        if (isMounted) {
          setAuthState({
            user: null,
            loading: false,
            error: '인증 확인 중 오류가 발생했습니다.',
          });
          hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시 (에러여도 완료로 간주)
        }
      }
    };

    checkAuth();

    // onAuthStateChange로 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      if (!isMounted) return;

      // 개발 환경에서만 상세 로그 출력
      if (process.env.NODE_ENV === 'development') {
        console.log('[useAuth] 인증 상태 변경:', event, {
          hasSession: !!session,
          hasUser: !!session?.user,
          hasInitiallyLoaded: hasInitiallyLoadedRef.current,
        });
      }

      // 초기 로드가 완료된 후에는 개발자 도구 열 때 발생하는 이벤트들을 완전히 무시
      // 이렇게 하면 개발자 도구를 열고 닫을 때 loading 상태가 변경되지 않습니다
      if (hasInitiallyLoadedRef.current) {
        // 초기 로드 완료 후에는 모든 이벤트를 무시
        if (
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN'
        ) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAuth] 초기 로드 완료 후 무시할 이벤트:', event);
          }
          return;
        }

        // 초기 로드 완료 후에는 다른 이벤트도 loading 상태를 변경하지 않음
        if (process.env.NODE_ENV === 'development') {
          console.log('[useAuth] 초기 로드 완료 후 이벤트 무시:', event);
        }
        return;
      }

      // 초기 로드 중에는 이벤트 처리
      // TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION 이벤트 무시
      if (
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION'
      ) {
        if (process.env.NODE_ENV === 'development') {
          console.log('[useAuth] 초기 로드 중 무시할 이벤트:', event);
        }
        return;
      }

      setAuthState((prev) => {
        const user = session?.user || null;

        // 사용자 상태가 변경되었을 때만 업데이트
        const userChanged =
          prev.user?.id !== user?.id ||
          (prev.user === null && user !== null) ||
          (prev.user !== null && user === null);

        if (userChanged) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[useAuth] 사용자 상태 변경:', {
              from: prev.user?.id || null,
              to: user?.id || null,
            });
          }
          return {
            user,
            loading: false,
            error: null,
          };
        }

        // 사용자가 같으면 상태 유지 (불필요한 리렌더링 방지)
        return prev;
      });
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      await supabaseSignOut();

      // 로컬 상태도 즉시 업데이트
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });

      // 페이지 새로고침하여 완전한 상태 초기화
      window.location.href = '/';
    } catch (error) {
      console.error('로그아웃 오류:', error);
      setAuthState((prev) => ({
        ...prev,
        error: '로그아웃 중 오류가 발생했습니다.',
      }));
    }
  };

  return {
    ...authState,
    signOut,
  };
}
