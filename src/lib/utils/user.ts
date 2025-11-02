/**
 * 사용자 관련 유틸리티 함수
 */

import { User as SupabaseUser } from '@supabase/supabase-js';
import { UserProfile } from '@/types';

/**
 * 사용자 이름을 포맷팅
 */
export function formatUserName(user: SupabaseUser | null): string {
  if (!user) return '사용자';

  return (
    user.user_metadata?.full_name ||
    user.user_metadata?.name ||
    user.email?.split('@')[0] ||
    '사용자'
  );
}

/**
 * 사용자 이메일을 포맷팅
 */
export function formatUserEmail(user: SupabaseUser | null): string {
  return user?.email || '';
}

/**
 * 사용자 아바타 URL을 반환
 */
export function getUserAvatarUrl(user: SupabaseUser | null): string | null {
  return user?.user_metadata?.avatar_url || null;
}

/**
 * 사용자 프로필에서 표시명 가져오기
 */
export function getDisplayName(profile: UserProfile | null): string {
  if (!profile) return '사용자';

  return profile.display_name || profile.email?.split('@')[0] || '사용자';
}

/**
 * 사용자 프로필에서 아바타 URL 가져오기
 */
export function getProfileAvatarUrl(
  profile: UserProfile | null
): string | null {
  return profile?.avatar_url || null;
}

/**
 * 사용자 역할 표시명 반환
 */
export function getRoleDisplayName(role: string): string {
  switch (role) {
    case 'admin':
      return '관리자';
    case 'am':
      return 'AM';
    default:
      return '알 수 없음';
  }
}

/**
 * 사용자 역할에 따른 색상 클래스 반환
 */
export function getRoleColorClass(role: string): string {
  switch (role) {
    case 'admin':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'am':
      return 'text-blue-600 bg-blue-50 border-blue-200';
    default:
      return 'text-gray-600 bg-gray-50 border-gray-200';
  }
}
