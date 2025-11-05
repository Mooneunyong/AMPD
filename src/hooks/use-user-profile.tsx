/**
 * 사용자 프로필 조회 훅
 */

'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/utils/supabase/client';
import { UserProfile } from '@/lib/permissions';

interface UseUserProfileReturn {
  profile: UserProfile | null;
  loading: boolean;
  error: string | null;
}

export function useUserProfile(): UseUserProfileReturn {
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserProfile = async () => {
      try {
        setLoading(true);
        setError(null);

        // 현재 사용자 정보 가져오기
        const supabase = createClient();
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
          setError('사용자 정보를 가져올 수 없습니다.');
          setLoading(false);
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

    fetchUserProfile();
  }, []);

  return { profile, loading, error };
}
