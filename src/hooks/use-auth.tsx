'use client';

import { useEffect, useState } from 'react';
import { User } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';

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

  useEffect(() => {
    // 초기 인증 상태 확인 - 직접 getSession 사용
    const checkAuth = async () => {
      try {
        // 먼저 세션 확인
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          // AuthSessionMissingError는 로그인하지 않은 상태에서는 정상
          if (sessionError.message?.includes('Auth session missing')) {
            setAuthState({
              user: null,
              loading: false,
              error: null,
            });
            return;
          }
          setAuthState({
            user: null,
            loading: false,
            error: '세션 오류가 발생했습니다.',
          });
          return;
        }

        if (sessionData.session?.user) {
          setAuthState({
            user: sessionData.session.user,
            loading: false,
            error: null,
          });
        } else {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
        }
      } catch (error) {
        // AuthSessionMissingError는 로그인하지 않은 상태에서는 정상
        if (
          error instanceof Error &&
          error.message?.includes('Auth session missing')
        ) {
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
          return;
        }
        setAuthState({
          user: null,
          loading: false,
          error: '인증 확인 중 오류가 발생했습니다.',
        });
      }
    };

    checkAuth();

    // 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      switch (event) {
        case 'SIGNED_IN':
          if (session?.user) {
            setAuthState({
              user: session.user,
              loading: false,
              error: null,
            });
          }
          break;

        case 'SIGNED_OUT':
          setAuthState({
            user: null,
            loading: false,
            error: null,
          });
          break;

        case 'TOKEN_REFRESHED':
          if (session?.user) {
            setAuthState((prev) => ({
              ...prev,
              user: session.user,
              error: null,
            }));
          }
          break;

        case 'USER_UPDATED':
          if (session?.user) {
            setAuthState((prev) => ({
              ...prev,
              user: session.user,
            }));
          }
          break;
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();

      if (error) {
        throw error;
      }

      // 로컬 상태도 즉시 업데이트
      setAuthState({
        user: null,
        loading: false,
        error: null,
      });
    } catch (error) {
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
