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
          console.log('사용자 프로필이 존재하지 않음 - 강제 로그아웃');
          await handleUserNotFound();
          return;
        }

        setError('프로필 정보를 가져올 수 없습니다.');
        setLoading(false);
        return;
      }

      setProfile(profileData);
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
