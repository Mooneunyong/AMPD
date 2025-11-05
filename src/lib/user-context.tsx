'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { createClient } from '@/utils/supabase/client';
import { clearAllSessions } from '@/lib/supabase';
import { UserProfile } from '@/lib/permissions';

interface UserContextType {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  forceLogout: () => Promise<void>;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const isInitialLoadRef = useRef(true);
  const hasInitiallyLoadedRef = useRef(false); // 초기 로드 완료 여부 추적
  const isFetchingProfileRef = useRef(false); // 프로필 가져오기 중 여부 추적 (중복 호출 방지)

  // 로딩 완료 처리 헬퍼 함수 (중복 코드 제거)
  const finishLoading = () => {
    setLoading(false);
    setIsInitialLoad(false);
    isInitialLoadRef.current = false;
    hasInitiallyLoadedRef.current = true;
  };

  // 에러 발생 시 로딩 완료 처리 헬퍼 함수
  const finishLoadingWithError = () => {
    setLoading(false);
    setIsInitialLoad(false);
    isInitialLoadRef.current = false;
    hasInitiallyLoadedRef.current = true; // 에러여도 완료로 간주
  };

  const fetchUserProfile = async (skipLoading = false) => {
    // 이미 프로필을 가져오는 중이면 중복 호출 방지
    if (isFetchingProfileRef.current) {
      return;
    }

    try {
      isFetchingProfileRef.current = true;
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);

      // Supabase에서 현재 사용자 정보 가져오기
      const supabase = createClient();
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        setProfile(null);
        finishLoading();
        return;
      }

      // 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', session.user.id)
        .single();

      if (profileError) {
        console.error('프로필 조회 오류:', profileError);

        // 사용자가 존재하지 않는 경우 (PGRST116: 0 rows returned)
        if (
          profileError.code === 'PGRST116' ||
          profileError.message?.includes('No rows found')
        ) {
          // 사용자가 이미 auth.users에 있는 경우에만 프로필 자동 생성
          // (첫 로그인 시)
          try {
            const displayName =
              session.user.user_metadata?.full_name ||
              session.user.user_metadata?.name ||
              session.user.email?.split('@')[0] ||
              'User';

            // Google OAuth는 picture 필드에 아바타 URL을 제공합니다
            const avatarUrl =
              session.user.user_metadata?.avatar_url ||
              session.user.user_metadata?.picture ||
              null;

            const { data: newProfileData, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: session.user.id,
                email: session.user.email || '',
                display_name: displayName,
                avatar_url: avatarUrl,
                role: 'am',
                is_active: false, // 첫 로그인 시 비활성 상태
              })
              .select()
              .single();

            if (createError) {
              console.error('프로필 생성 오류:', createError);
              finishLoadingWithError();
              setError('프로필 생성에 실패했습니다.');
              return;
            }

            setProfile(newProfileData as UserProfile);
            finishLoading();
            return;
          } catch (createErr) {
            console.error('프로필 생성 중 예외 발생:', createErr);
            finishLoadingWithError();
            setError('프로필 생성 중 오류가 발생했습니다.');
            return;
          }
        }

        // 다른 에러인 경우
        setError('프로필 정보를 가져올 수 없습니다.');
        finishLoadingWithError();
        return;
      }

      // 프로필이 정상적으로 조회된 경우
      if (profileData) {
        setProfile(profileData as UserProfile);
        finishLoading();
      } else {
        // profileData가 null인 경우도 로딩 완료 처리
        setProfile(null);
        finishLoading();
      }
    } catch (err) {
      console.error('사용자 프로필 조회 오류:', err);
      setError('프로필 정보를 가져오는 중 오류가 발생했습니다.');
      finishLoadingWithError();
    } finally {
      isFetchingProfileRef.current = false;
    }
  };

  // 사용자가 존재하지 않을 때 처리하는 함수
  const handleUserNotFound = async () => {
    try {
      await clearAllSessions();

      // 페이지 새로고침으로 완전한 상태 초기화
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    } catch (error) {
      console.error('세션 정리 중 오류:', error);
      // 세션 정리 실패해도 페이지 새로고침
      if (typeof window !== 'undefined') {
        window.location.href = '/';
      }
    }
  };

  // 강제 로그아웃 함수
  const forceLogout = async () => {
    try {
      setLoading(true);
      await handleUserNotFound();
    } catch (error) {
      console.error('강제 로그아웃 오류:', error);
    }
  };

  useEffect(() => {
    let isMounted = true;
    let isCheckingUserRef = false; // checkUserAndFetch 실행 중 여부 추적

    // 초기 사용자 확인 및 프로필 가져오기
    const checkUserAndFetch = async () => {
      // 이미 실행 중이면 중복 호출 방지
      if (isCheckingUserRef) {
        return;
      }

      try {
        isCheckingUserRef = true;

        // Supabase에서 사용자 정보 가져오기
        const supabase = createClient();
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) {
          isCheckingUserRef = false;
          return;
        }

        if (session?.user) {
          // fetchUserProfile 내부에서 setLoading(false)를 호출합니다
          await fetchUserProfile();
        } else {
          // 세션이 없으면 로딩 완료로 표시
          finishLoading();
        }
      } catch (error) {
        console.error('초기 사용자 확인 오류:', error);
        if (isMounted) {
          finishLoadingWithError();
        }
      } finally {
        isCheckingUserRef = false;
      }
    };

    checkUserAndFetch();

    // onAuthStateChange로 인증 상태 변경 감지
    const supabase = createClient();
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      // 초기 로드가 완료된 후에는 개발자 도구 열 때 발생하는 이벤트들을 완전히 무시
      // 이렇게 하면 개발자 도구를 열고 닫을 때 loading 상태가 변경되지 않습니다
      if (hasInitiallyLoadedRef.current) {
        // 초기 로드 완료 후에는 TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION, SIGNED_IN 등 무시
        if (
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION' ||
          event === 'SIGNED_IN'
        ) {
          return;
        }

        // 초기 로드 완료 후에는 다른 이벤트도 loading 상태를 변경하지 않음
        return;
      }

      // 초기 로드 중에는 이벤트 처리
      // TOKEN_REFRESHED, USER_UPDATED 이벤트 무시
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        return;
      }

      // INITIAL_SESSION 이벤트 처리 (토큰이 localStorage에 있을 때 발생)
      // checkUserAndFetch가 이미 초기 로드를 처리하므로, INITIAL_SESSION 이벤트는 완전히 무시
      // 배포 환경에서 타이밍 이슈를 방지하기 위해 항상 무시함
      // checkUserAndFetch가 supabase.auth.getSession()을 호출하여 localStorage에서 세션을 직접 읽어옴
      if (event === 'INITIAL_SESSION') {
        // checkUserAndFetch가 이미 초기 로드를 처리하므로 이 이벤트는 무시
        // 이렇게 하면 배포 환경에서 타이밍 경쟁 조건을 완전히 방지할 수 있음
        return;
      }

      // SIGNED_IN 이벤트 처리 (초기 로드 중에만)
      if (event === 'SIGNED_IN' && session?.user) {
        // checkUserAndFetch가 실행 중이면 무시
        if (isCheckingUserRef) {
          return;
        }
        await fetchUserProfile();
        return;
      }

      // SIGNED_OUT 이벤트 처리
      if (event === 'SIGNED_OUT') {
        setProfile(null);
        setLoading(false);
        setIsInitialLoad(false);
        isInitialLoadRef.current = false;
        hasInitiallyLoadedRef.current = false; // 로그아웃 시 초기화
        return;
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <UserContext.Provider
      value={{
        profile,
        loading,
        error,
        refetch: fetchUserProfile,
        forceLogout,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUserContext() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUserContext must be used within a UserProvider');
  }
  return context;
}
