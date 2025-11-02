'use client';

import React, { createContext, useContext, useEffect, useState } from 'react';
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

  const fetchUserProfile = async () => {
    try {
      setLoading(true);
      setError(null);

      // 현재 사용자 정보 가져오기
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        console.log('사용자 정보 없음 - 로그아웃 처리');
        setLoading(false);
        await handleUserNotFound();
        return;
      }

      // 사용자 프로필 정보 가져오기
      const { data: profileData, error: profileError } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
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
              user.user_metadata?.full_name ||
              user.user_metadata?.name ||
              user.email?.split('@')[0] ||
              'User';
            
            // Google OAuth는 picture 필드에 아바타 URL을 제공합니다
            const avatarUrl = 
              user.user_metadata?.avatar_url ||
              user.user_metadata?.picture ||
              null;
            
            const { data: newProfileData, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: user.id,
                email: user.email || '',
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
              // 프로필 생성 실패 시 강제 로그아웃
              await handleUserNotFound();
              return;
            }

            console.log('프로필 자동 생성 성공:', newProfileData);
            setProfile(newProfileData as UserProfile);
            setLoading(false);
            return;
          } catch (createErr) {
            console.error('프로필 생성 중 예외 발생:', createErr);
            setLoading(false);
            // 프로필 생성 실패 시 강제 로그아웃
            await handleUserNotFound();
            return;
          }
        }

        // 다른 에러인 경우
        setError('프로필 정보를 가져올 수 없습니다.');
        setLoading(false);
        return;
      }

      // 프로필이 정상적으로 조회된 경우
      if (profileData) {
        setProfile(profileData as UserProfile);
      }
      setLoading(false);
      setIsInitialLoad(false);
    } catch (err) {
      console.error('사용자 프로필 조회 오류:', err);
      setError('프로필 정보를 가져오는 중 오류가 발생했습니다.');
      setLoading(false);
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
        const {
          data: { user },
        } = await supabase.auth.getUser();
        
        if (!isMounted) return;

        if (user) {
          await fetchUserProfile();
        } else {
          setLoading(false);
          setIsInitialLoad(false);
        }
      } catch (error) {
        console.error('초기 사용자 확인 오류:', error);
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    checkUserAndFetch();

    // Auth 상태 변경 감지 (사용자 삭제 시 강제 로그아웃 처리)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!isMounted) return;

      console.log('Auth state changed:', event, session?.user?.id);

      // 세션이 없거나 사용자가 없으면 로그아웃 처리
      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('세션 만료 또는 사용자 삭제 감지 - 강제 로그아웃');
        setProfile(null);
        setLoading(false);
        return;
      }

      // SIGNED_IN 이벤트만 fetchUserProfile 호출 (중복 방지)
      if (event === 'SIGNED_IN') {
        await fetchUserProfile();
        return;
      }

      // TOKEN_REFRESHED나 USER_UPDATED 이벤트는 초기 로드가 완료된 후에는 무시
      // (개발자 도구 열고 닫을 때 발생하는 불필요한 이벤트 방지)
      if (event === 'TOKEN_REFRESHED' || event === 'USER_UPDATED') {
        // 초기 로드가 완료되었고 프로필이 이미 있으면 무시
        if (!isInitialLoad && profile && session?.user && profile.user_id === session.user.id) {
          return;
        }
        
        // 초기 로드 중이거나 프로필이 없을 때만 처리
        // 하지만 초기 로드가 완료된 후에는 로딩 상태를 변경하지 않음
        if (!profile && session?.user) {
          try {
            const { data: profileData, error: profileError } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('user_id', session.user.id)
              .single();

            if (!isMounted) return;

            if (profileData) {
              setProfile(profileData as UserProfile);
              // 초기 로드 중일 때만 로딩 상태 변경
              if (isInitialLoad) {
                setLoading(false);
                setIsInitialLoad(false);
              }
            } else if (profileError && profileError.code === 'PGRST116') {
              // 프로필이 없으면 자동 생성 시도 (초기 로드 중일 때만)
              if (isInitialLoad) {
                try {
                  const displayName = 
                    session.user.user_metadata?.full_name ||
                    session.user.user_metadata?.name ||
                    session.user.email?.split('@')[0] ||
                    'User';
                  
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
                      is_active: false,
                    })
                    .select()
                    .single();

                  if (!isMounted) return;

                  if (createError) {
                    console.error('프로필 자동 생성 오류:', createError);
                    setLoading(false);
                    setIsInitialLoad(false);
                    await handleUserNotFound();
                    return;
                  }

                  setProfile(newProfileData as UserProfile);
                  setLoading(false);
                  setIsInitialLoad(false);
                } catch (createErr) {
                  console.error('프로필 생성 중 예외 발생:', createErr);
                  if (isMounted) {
                    setLoading(false);
                    setIsInitialLoad(false);
                    await handleUserNotFound();
                  }
                }
              }
            } else if (isInitialLoad) {
              // 다른 에러이지만 초기 로드 중이면 로딩 종료
              setLoading(false);
              setIsInitialLoad(false);
            }
          } catch (err) {
            console.error('프로필 조회 오류:', err);
            // 초기 로드 중일 때만 로딩 상태 변경
            if (isInitialLoad && isMounted) {
              setLoading(false);
              setIsInitialLoad(false);
            }
          }
        }
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
