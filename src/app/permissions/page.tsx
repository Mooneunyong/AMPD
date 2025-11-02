/**
 * 권한 관리 페이지 - 관리자 전용
 */

'use client';

import { useState, useMemo, useCallback, useEffect } from 'react';
import { AdminAccessControl } from '@/components/admin-access-control';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { UsersTable } from '@/components/users/users-table';
import { UsersIcon, ShieldIcon, UserIcon } from 'lucide-react';
import { useUserManagement } from '@/hooks/use-user-management';
import { useUserContext } from '@/lib/user-context';
import { PageLoading } from '@/components/common';
import { Skeleton } from '@/components/ui/skeleton';
import { toast, Toaster } from '@/components/ui/sonner';
import { UserRole } from '@/lib/permissions';

export default function PermissionsPage() {
  const { users, loading, error, changeUserRole, toggleActive } =
    useUserManagement();
  const { profile } = useUserContext();

  // Notify global transition manager to avoid double loading
  useEffect(() => {
    if (typeof window === 'undefined') return;
    const evt = new Event(loading ? 'page-loading-start' : 'page-loading-end');
    window.dispatchEvent(evt);
  }, [loading]);

  // 필터링된 사용자들
  const filteredUsers = useMemo(() => users, [users]);

  // 통계 계산
  const stats = useMemo(() => {
    const activeUsers = users.filter((u) => u.is_active);
    const adminUsers = users.filter((u) => u.role === 'admin');
    const amUsers = users.filter((u) => u.role === 'am');

    return {
      total: users.length,
      active: activeUsers.length,
      admin: adminUsers.length,
      am: amUsers.length,
    };
  }, [users]);

  // 역할 업데이트 핸들러
  const handleRoleUpdate = useCallback(
    async (userId: string, newRole: UserRole) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      // 현재 사용자가 자신의 역할을 변경하려고 하는 경우 방지
      if (profile && profile.id === userId) {
        toast.error('You cannot change your own role.');
        return;
      }

      // 역할이 변경되지 않은 경우 스킵
      if (user.role === newRole) {
        return;
      }

      try {
        await changeUserRole(userId, newRole);
        toast.success(
          `Role changed to ${newRole.toUpperCase()} for "${
            user.display_name || user.email
          }".`
        );
      } catch (error) {
        console.error('Role change error:', error);
        const errorMessage =
          error instanceof Error ? error.message : 'Failed to change role.';
        toast.error(`Failed to change role: ${errorMessage}`);
        throw error; // 상위 컴포넌트에서 에러 처리할 수 있도록 throw
      }
    },
    [users, profile, changeUserRole]
  );

  // 사용자 활성화/비활성화 핸들러
  const handleToggleActive = useCallback(
    async (userId: string, checked: boolean) => {
      const user = users.find((u) => u.id === userId);
      if (!user) return;

      // 현재 사용자가 자신을 비활성화하려고 하는 경우 방지
      if (profile && profile.id === userId && !checked) {
        toast.error('You cannot deactivate your own account.');
        return;
      }

      // 관리자가 아닌 경우 비활성화 방지
      if (profile && profile.role !== 'admin' && !checked) {
        toast.error('Only administrators can deactivate users.');
        return;
      }

      // 상태가 변경되지 않은 경우 스킵
      if (user.is_active === checked) {
        return;
      }

      try {
        await toggleActive(userId);
        const action = checked ? 'activated' : 'deactivated';
        toast.success(
          `User "${user.display_name || user.email}" has been ${action}.`
        );
      } catch (error) {
        console.error('User status change error:', error);
        const action = checked ? 'activate' : 'deactivate';
        const errorMessage =
          error instanceof Error ? error.message : `Failed to ${action} user.`;
        toast.error(`Failed to change status: ${errorMessage}`);
        throw error; // 상위 컴포넌트에서 에러 처리할 수 있도록 throw
      }
    },
    [users, profile, toggleActive]
  );

  // selection removed

  return (
    <AdminAccessControl>
      <div className='@container/main flex flex-1 flex-col gap-4'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <ShieldIcon className='h-8 w-8 text-primary' />
              Permissions Management
            </h1>
            <p className='text-muted-foreground'>
              Manage user roles and permissions across the platform
            </p>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className='p-4 text-sm rounded-xl border text-destructive bg-destructive/10 border-destructive/20'>
            <p className='font-medium'>오류 발생</p>
            <p className='mt-1'>{error}</p>
          </div>
        )}

        {/* Loading State - Skeletons */}
        {loading && (
          <div className='space-y-4'>
            <div className='grid grid-cols-1 gap-4 xl:grid-cols-3'>
              <div className='rounded-xl border p-4 space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-16' />
              </div>
              <div className='rounded-xl border p-4 space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-16' />
              </div>
              <div className='rounded-xl border p-4 space-y-3'>
                <Skeleton className='h-4 w-24' />
                <Skeleton className='h-8 w-16' />
              </div>
            </div>
            <div className='flex flex-col gap-3'>
              <div className='flex items-center gap-2 text-lg font-medium'>
                <Skeleton className='h-5 w-5 rounded' />
                <Skeleton className='h-5 w-40' />
              </div>
              <div className='rounded-lg border'>
                {[...Array(6)].map((_, i) => (
                  <div
                    key={i}
                    className='flex items-center gap-4 px-4 py-3 border-b last:border-b-0'
                  >
                    <div className='flex-1 space-y-2'>
                      <Skeleton className='h-4 w-40' />
                      <Skeleton className='h-3 w-64' />
                    </div>
                    <Skeleton className='h-8 w-28' />
                    <Skeleton className='h-6 w-16' />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Stats Cards */}
        {!loading && (
          <div className='*:data-[slot=card]:shadow-xs flex flex-col xl:flex-row gap-4 *:data-[slot=card]:bg-gradient-to-t *:data-[slot=card]:from-primary/5 *:data-[slot=card]:to-card dark:*:data-[slot=card]:bg-card'>
            <Card className='@container/card flex-1 rounded-xl'>
              <CardHeader className='relative'>
                <CardDescription>Total Users</CardDescription>
                <CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
                  {stats.total}
                </CardTitle>
                <div className='absolute right-4 top-4'>
                  <Badge
                    variant='outline'
                    className='flex gap-1 rounded-lg text-xs'
                  >
                    <UsersIcon className='size-3' />
                    {stats.active} active
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className='@container/card flex-1 rounded-xl'>
              <CardHeader className='relative'>
                <CardDescription>Administrators</CardDescription>
                <CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
                  {stats.admin}
                </CardTitle>
                <div className='absolute right-4 top-4'>
                  <Badge
                    variant='outline'
                    className='flex gap-1 rounded-lg text-xs'
                  >
                    <ShieldIcon className='size-3' />
                    Admin
                  </Badge>
                </div>
              </CardHeader>
            </Card>

            <Card className='@container/card flex-1 rounded-xl'>
              <CardHeader className='relative'>
                <CardDescription>Account Managers</CardDescription>
                <CardTitle className='@[250px]/card:text-3xl text-2xl font-semibold tabular-nums'>
                  {stats.am}
                </CardTitle>
                <div className='absolute right-4 top-4'>
                  <Badge
                    variant='outline'
                    className='flex gap-1 rounded-lg text-xs'
                  >
                    <UserIcon className='size-3' />
                    AM
                  </Badge>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}

        {/* Filters removed per request */}

        {/* Users Data Table */}
        {!loading && (
          <div className='flex flex-col gap-3'>
            <div className='flex items-center gap-2 text-lg font-medium'>
              <UsersIcon className='h-5 w-5' />
              <span>Users ({filteredUsers.length})</span>
            </div>
            <UsersTable
              data={filteredUsers as any}
              currentUserId={profile?.id}
              onChangeRole={(id, newRole) =>
                handleRoleUpdate(id, newRole as UserRole)
              }
              onToggleActive={(id, checked) => handleToggleActive(id, checked)}
            />
          </div>
        )}
      </div>
      <Toaster position='top-center' />
    </AdminAccessControl>
  );
}
