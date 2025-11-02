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
        await handleUserNotFound();
        return;
      }

      // 사용자 프로필 정보 가져오기 - 병렬로 처리
      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      const { data: profileData, error: profileError } = await profilePromise;

      if (profileError) {
        console.error('프로필 조회 오류:', profileError);

        // 사용자가 존재하지 않는 경우 (PGRST116: 0 rows returned)
        if (
          profileError.code === 'PGRST116' ||
          profileError.message?.includes('No rows found')
        ) {
          // 사용자가 이미 auth.users에 있는 경우에만 프로필 자동 생성
          // (첫 로그인 시)
          // auth.users에 사용자가 없으면 삭제된 것으로 간주하여 강제 로그아웃
          const { data: authUser, error: authUserError } =
            await supabase.auth.getUser();

          if (authUserError || !authUser?.user) {
            console.log('Auth 사용자도 없음 - 강제 로그아웃');
            await handleUserNotFound();
            return;
          }

          // Auth 사용자는 있지만 프로필이 없는 경우 - 첫 로그인으로 간주하여 프로필 생성
          console.log('사용자 프로필이 존재하지 않음 - 자동 생성 시도');
          
          try {
            const displayName = 
              authUser.user.user_metadata?.full_name ||
              authUser.user.user_metadata?.name ||
              authUser.user.email?.split('@')[0] ||
              'User';
            
            // Google OAuth는 picture 필드에 아바타 URL을 제공합니다
            const avatarUrl = 
              authUser.user.user_metadata?.avatar_url ||
              authUser.user.user_metadata?.picture ||
              null;
            
            const { data: newProfileData, error: createError } = await supabase
              .from('user_profiles')
              .insert({
                user_id: authUser.user.id,
                email: authUser.user.email || '',
                display_name: displayName,
                avatar_url: avatarUrl,
                role: 'am',
                is_active: false, // 첫 로그인 시 비활성 상태
              })
              .select()
              .single();

            if (createError) {
              console.error('프로필 생성 오류:', createError);
              // 프로필 생성 실패 시 강제 로그아웃
              await handleUserNotFound();
              return;
            }

            console.log('프로필 자동 생성 성공:', newProfileData);
            setProfile(newProfileData as UserProfile);
            return;
          } catch (createErr) {
            console.error('프로필 생성 중 예외 발생:', createErr);
            // 프로필 생성 실패 시 강제 로그아웃
            await handleUserNotFound();
            return;
          }
        }

        setError('프로필 정보를 가져올 수 없습니다.');
        setLoading(false);
        return;
      }

      setProfile(profileData as UserProfile);
    } catch (err) {
      console.error('사용자 프로필 조회 오류:', err);
      setError('프로필 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
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
    // 사용자가 로그인되어 있을 때만 프로필을 가져옴
    const checkUserAndFetch = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (user) {
        fetchUserProfile();
      } else {
        setLoading(false);
      }
    };

    checkUserAndFetch();

    // Auth 상태 변경 감지 (사용자 삭제 시 강제 로그아웃 처리)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.id);

      // 세션이 없거나 사용자가 없으면 로그아웃 처리
      if (event === 'SIGNED_OUT' || !session?.user) {
        console.log('세션 만료 또는 사용자 삭제 감지 - 강제 로그아웃');
        setProfile(null);
        setLoading(false);
        return;
      }

      // 사용자가 있으면 프로필 확인
      if (session.user) {
        // 프로필 확인 - 삭제된 사용자인지 체크
        const { data: profileData, error: profileError } = await supabase
          .from('user_profiles')
          .select('*')
          .eq('user_id', session.user.id)
          .single();

        // 프로필이 없으면 사용자가 삭제된 것으로 간주
        if (
          profileError &&
          (profileError.code === 'PGRST116' ||
            profileError.message?.includes('No rows found'))
        ) {
          console.log('사용자 프로필이 없음 (삭제됨) - 강제 로그아웃');
          await handleUserNotFound();
          return;
        }

        // 프로필이 있으면 업데이트
        if (profileData) {
          setProfile(profileData as UserProfile);
        }
      }
    });

    return () => {
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
