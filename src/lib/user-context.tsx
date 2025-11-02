'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
  useRef,
} from 'react';
import { supabase, clearAllSessions } from '@/lib/supabase';
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

  const fetchUserProfile = async (skipLoading = false) => {
    try {
      if (!skipLoading) {
        setLoading(true);
      }
      setError(null);

      // Supabase에서 현재 사용자 정보 가져오기
      const {
        data: { session },
        error: sessionError,
      } = await supabase.auth.getSession();

      if (sessionError || !session || !session.user) {
        console.log('세션 확인 실패 - 로그인하지 않은 상태');
        setProfile(null);
        setLoading(false);
        setIsInitialLoad(false);
        isInitialLoadRef.current = false;
        hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시
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
          console.log('사용자 프로필이 존재하지 않음 - 자동 생성 시도');

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
              setLoading(false);
              setIsInitialLoad(false);
              isInitialLoadRef.current = false;
              hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시 (에러여도 완료로 간주)
              setError('프로필 생성에 실패했습니다.');
              return;
            }

            console.log('프로필 자동 생성 성공:', newProfileData);
            setProfile(newProfileData as UserProfile);
            setLoading(false);
            setIsInitialLoad(false);
            isInitialLoadRef.current = false;
            hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시
            return;
          } catch (createErr) {
            console.error('프로필 생성 중 예외 발생:', createErr);
            setLoading(false);
            setIsInitialLoad(false);
            isInitialLoadRef.current = false;
            hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시 (에러여도 완료로 간주)
            setError('프로필 생성 중 오류가 발생했습니다.');
            return;
          }
        }

        // 다른 에러인 경우
        setError('프로필 정보를 가져올 수 없습니다.');
        setLoading(false);
        setIsInitialLoad(false);
        isInitialLoadRef.current = false;
        hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시 (에러여도 완료로 간주)
        return;
      }

      // 프로필이 정상적으로 조회된 경우
      if (profileData) {
        setProfile(profileData as UserProfile);
      }
      setLoading(false);
      setIsInitialLoad(false);
      isInitialLoadRef.current = false;
      hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시
    } catch (err) {
      console.error('사용자 프로필 조회 오류:', err);
      setError('프로필 정보를 가져오는 중 오류가 발생했습니다.');
      setLoading(false);
      setIsInitialLoad(false);
      isInitialLoadRef.current = false;
      hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시 (에러여도 완료로 간주)
    }
  };

  // 사용자가 존재하지 않을 때 처리하는 함수
  const handleUserNotFound = async () => {
    try {
      console.log('사용자 없음 - 모든 세션 정리 중...');
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

    // 초기 사용자 확인 및 프로필 가져오기
    const checkUserAndFetch = async () => {
      try {
        // Supabase에서 사용자 정보 가져오기
        const {
          data: { session },
        } = await supabase.auth.getSession();

        if (!isMounted) return;

        if (session?.user) {
          // fetchUserProfile 내부에서 setLoading(false)를 호출합니다
          await fetchUserProfile();
        } else {
          // 세션이 없으면 로딩 완료로 표시
          setLoading(false);
          setIsInitialLoad(false);
          isInitialLoadRef.current = false;
          hasInitiallyLoadedRef.current = true; // 초기 로드 완료 표시
        }
      } catch (error) {
        console.error('초기 사용자 확인 오류:', error);
        if (isMounted) {
          setLoading(false);
          setIsInitialLoad(false);
        }
      }
    };

    checkUserAndFetch();

    // onAuthStateChange로 인증 상태 변경 감지
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('[UserProvider] 인증 상태 변경:', event, {
        hasSession: !!session,
        hasUser: !!session?.user,
        hasInitiallyLoaded: hasInitiallyLoadedRef.current,
      });

      // 초기 로드가 완료된 후에는 개발자 도구 열 때 발생하는 이벤트들을 완전히 무시
      // 이렇게 하면 개발자 도구를 열고 닫을 때 loading 상태가 변경되지 않습니다
      if (hasInitiallyLoadedRef.current) {
        // 초기 로드 완료 후에는 TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION 등 무시
        if (
          event === 'TOKEN_REFRESHED' ||
          event === 'USER_UPDATED' ||
          event === 'INITIAL_SESSION'
        ) {
          console.log('[UserProvider] 초기 로드 완료 후 무시할 이벤트:', event);
          return;
        }

        // 초기 로드 완료 후에는 SIGNED_IN 이벤트도 무시
        // (이미 로그인된 상태이므로 중복 로그인 처리가 필요 없음)
        if (event === 'SIGNED_IN') {
          console.log('[UserProvider] 초기 로드 완료 후 SIGNED_IN 무시');
          return;
        }

        // 초기 로드 완료 후에는 다른 이벤트도 loading 상태를 변경하지 않음
        console.log('[UserProvider] 초기 로드 완료 후 이벤트 무시:', event);
        return;
      }

      // 초기 로드 중에는 이벤트 처리
      // TOKEN_REFRESHED, USER_UPDATED, INITIAL_SESSION 이벤트 무시
      if (
        event === 'TOKEN_REFRESHED' ||
        event === 'USER_UPDATED' ||
        event === 'INITIAL_SESSION'
      ) {
        console.log('[UserProvider] 초기 로드 중 무시할 이벤트:', event);
        return;
      }

      // SIGNED_IN 이벤트 처리 (초기 로드 중에만)
      if (event === 'SIGNED_IN' && session?.user) {
        console.log('[UserProvider] 로그인 감지');
        await fetchUserProfile();
        return;
      }

      // SIGNED_OUT 이벤트 처리
      if (event === 'SIGNED_OUT') {
        console.log('[UserProvider] 로그아웃 감지');
        setProfile(null);
        setLoading(false);
        setIsInitialLoad(false);
        isInitialLoadRef.current = false;
        hasInitiallyLoadedRef.current = false; // 로그아웃 시 초기화
        return;
      }

      // 다른 이벤트는 무시
      console.log('[UserProvider] 처리하지 않은 이벤트:', event);
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
