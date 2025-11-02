/**
 * 권한 관리 관련 유틸리티 함수
 */

import type { UserProfile } from '@/lib/permissions';

/**
 * 계정 관리 권한 확인 (편집/삭제 공통)
 * Admin은 모든 계정 관리 가능
 * AM은 자신이 담당하는 계정만 관리 가능
 */
export function canManageResource(
  currentUserProfile: UserProfile | null | undefined,
  resourceAssignedUserId: string
): boolean {
  if (!currentUserProfile) return false;
  
  // Admin은 모든 리소스 관리 가능
  if (currentUserProfile.role === 'admin') return true;
  
  // AM은 자신이 담당하는 리소스만 관리 가능
  if (currentUserProfile.role === 'am') {
    return currentUserProfile.id === resourceAssignedUserId;
  }
  
  return false;
}

/**
 * 계정 관리 권한 확인 (별칭)
 */
export const canManageAccount = canManageResource;

/**
 * 게임 관리 권한 확인 (별칭)
 */
export const canManageGame = canManageResource;

/**
 * 캠페인 관리 권한 확인 (별칭)
 */
export const canManageCampaign = canManageResource;

