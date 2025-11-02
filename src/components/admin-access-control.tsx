/**
 * 관리자 전용 접근 권한 제어 컴포넌트
 */

'use client';

import { useUserContext } from '@/lib/user-context';
import { hasAdminAccess } from '@/lib/permissions';
import { ShieldXIcon } from 'lucide-react';

interface AdminAccessControlProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

export function AdminAccessControl({
  children,
  fallback,
}: AdminAccessControlProps) {
  const { profile, loading, error } = useUserContext();

  // 프로필 로딩 중일 때는 투명하게 처리 (깜빡임 방지)
  if (loading) {
    return null;
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mb-6 flex justify-center'>
            <ShieldXIcon className='h-16 w-16 text-destructive' />
          </div>
          <h2 className='text-xl font-semibold mb-4'>Error Occurred</h2>
          <p className='text-muted-foreground mb-6'>{error}</p>
        </div>
      </div>
    );
  }

  if (!hasAdminAccess(profile?.role, profile?.is_active)) {
    if (fallback) {
      return <>{fallback}</>;
    }

    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mb-6 flex justify-center'>
            <ShieldXIcon className='h-16 w-16 text-destructive' />
          </div>
          <h2 className='text-xl font-semibold mb-4'>Admin Access Required</h2>
          <p className='text-muted-foreground mb-2'>
            {profile?.is_active === false
              ? 'Your account has been deactivated. Please contact your administrator to reactivate your account.'
              : 'This page is restricted to administrators only.'}
          </p>
          <p className='text-sm text-muted-foreground'>
            Please contact your system administrator for access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
