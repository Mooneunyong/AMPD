'use client';

import { useAuth } from '@/hooks/use-auth';
import { useUserContext } from '@/lib/user-context';
import { AppSidebar } from '@/components/app-sidebar';
import { AppBreadcrumb } from '@/components/app-breadcrumb';
import { AccessControl } from '@/components/access-control';
import {
  SidebarProvider,
  SidebarInset,
  SidebarTrigger,
} from '@/components/ui/sidebar';
import { Separator } from '@/components/ui/separator';
import { Button } from '@/components/ui/button';
import { AppLayoutProps } from '@/types';
import { signInWithGoogle } from '@/lib/supabase';
import { useState, useEffect, useCallback } from 'react';
import { RouteTransition } from '@/components/route-transition';
import {
  parseSupabaseError,
  getErrorIcon,
  getErrorColorClass,
  ParsedError,
} from '@/lib/error-handler';

export function AppLayout({ children }: AppLayoutProps) {
  const { user, loading: authLoading, signOut } = useAuth();
  const {
    profile,
    loading: profileLoading,
    error: profileError,
    forceLogout,
  } = useUserContext();
  const [isLoggingIn, setIsLoggingIn] = useState(false);
  const [loginError, setLoginError] = useState<ParsedError | null>(null);

  const globalLoading = authLoading || profileLoading;

  // URL에서 hash fragment 제거 (OAuth 콜백 후 남은 hash 제거)
  // 단, /auth/callback 경로에서는 제거하지 않음 (Supabase가 세션을 추출해야 함)
  useEffect(() => {
    if (typeof window !== 'undefined' && window.location.hash) {
      if (window.location.pathname === '/auth/callback') {
        return;
      }
      
      window.history.replaceState(
        {},
        document.title,
        window.location.pathname + window.location.search
      );
    }
  }, []);

  // 세션 스토리지에서 에러 정보 확인
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const storedError = sessionStorage.getItem('auth_error');
      if (storedError) {
        try {
          const parsedError = JSON.parse(storedError);
          setLoginError(parsedError);
          sessionStorage.removeItem('auth_error');
        } catch (error) {
          console.error('에러 정보 파싱 실패:', error);
        }
      }
    }
  }, []);

  const handleGoogleLogin = useCallback(async () => {
    try {
      setIsLoggingIn(true);
      setLoginError(null);
      await signInWithGoogle();
    } catch (err: any) {
      console.error('로그인 오류:', err);
      const parsedError = parseSupabaseError(err);
      setLoginError(parsedError);
    } finally {
      setIsLoggingIn(false);
    }
  }, []);

  const clearLoginError = useCallback(() => {
    setLoginError(null);
  }, []);

  // 전역 로딩 스피너
  if (globalLoading) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='flex space-x-1'>
          <div className='w-2 h-2 bg-primary rounded-full animate-bounce'></div>
          <div
            className='w-2 h-2 bg-primary rounded-full animate-bounce'
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className='w-2 h-2 bg-primary rounded-full animate-bounce'
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    );
  }

  // 로그인 화면
  if (!user) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='max-w-md w-full space-y-8'>
          <div className='text-center'>
            <h1 className='text-3xl font-bold text-foreground'>AMPD</h1>
            <p className='mt-4 text-sm text-muted-foreground'>
              Welcome! Manage and track your campaign performance here.
            </p>
          </div>

          {loginError && (
            <div
              className={`p-4 text-sm rounded-lg border ${getErrorColorClass(
                loginError.type
              )}`}
            >
              <div className='flex items-start space-x-2'>
                <span className='text-lg'>{getErrorIcon(loginError.type)}</span>
                <div className='flex-1'>
                  <p className='font-medium'>{loginError.title}</p>
                  <p className='mt-1'>{loginError.message}</p>
                  {loginError.details && (
                    <p className='mt-1 text-xs opacity-80'>
                      {loginError.details}
                    </p>
                  )}
                </div>
                <button
                  onClick={clearLoginError}
                  className='text-gray-500 hover:text-gray-700 transition-colors'
                  aria-label='에러 메시지 닫기'
                >
                  <svg
                    className='w-4 h-4'
                    fill='none'
                    stroke='currentColor'
                    viewBox='0 0 24 24'
                  >
                    <path
                      strokeLinecap='round'
                      strokeLinejoin='round'
                      strokeWidth={2}
                      d='M6 18L18 6M6 6l12 12'
                    />
                  </svg>
                </button>
              </div>
            </div>
          )}

          <div className='mt-8 space-y-4'>
            <Button
              onClick={handleGoogleLogin}
              disabled={isLoggingIn}
              className='w-full'
              variant='outline'
            >
              <svg
                xmlns='http://www.w3.org/2000/svg'
                viewBox='0 0 24 24'
                className='w-5 h-5 mr-2'
              >
                <path
                  d='M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z'
                  fill='currentColor'
                />
              </svg>
              {isLoggingIn ? '로그인 중...' : 'Login with Google'}
            </Button>
            <div className='text-center'>
              <p className='text-xs text-muted-foreground'>
                Google 계정으로 로그인하세요
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // 프로필 오류 화면
  if (user && profileError) {
    return (
      <div className='min-h-screen bg-background flex items-center justify-center'>
        <div className='max-w-md w-full space-y-8 p-6'>
          <div className='text-center'>
            <div className='text-6xl mb-4'>⚠️</div>
            <h1 className='text-2xl font-bold text-foreground'>프로필 오류</h1>
            <p className='mt-4 text-sm text-muted-foreground'>
              사용자 프로필을 불러올 수 없습니다.
            </p>
          </div>

          <div className='bg-red-50 border border-red-200 rounded-lg p-4'>
            <div className='flex items-start space-x-2'>
              <svg
                className='w-5 h-5 text-red-600 mt-0.5 flex-shrink-0'
                fill='none'
                stroke='currentColor'
                viewBox='0 0 24 24'
              >
                <path
                  strokeLinecap='round'
                  strokeLinejoin='round'
                  strokeWidth={2}
                  d='M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z'
                />
              </svg>
              <div className='flex-1'>
                <p className='text-sm font-medium text-red-800'>오류 상세</p>
                <p className='mt-1 text-sm text-red-700'>{profileError}</p>
              </div>
            </div>
          </div>

          <div className='space-y-3'>
            <Button
              onClick={forceLogout}
              className='w-full'
              variant='destructive'
            >
              🔄 강제 로그아웃 및 재시작
            </Button>
            <Button
              onClick={() => window.location.reload()}
              variant='outline'
              className='w-full'
            >
              🔄 페이지 새로고침
            </Button>
          </div>

          <div className='text-center'>
            <p className='text-xs text-muted-foreground'>
              이 문제가 계속 발생하면 관리자에게 문의하세요.
            </p>
          </div>
        </div>
      </div>
    );
  }

  // 메인 레이아웃
  return (
    <AccessControl>
      <SidebarProvider>
        <AppSidebar user={user} onSignOut={signOut} />
        <SidebarInset className='overflow-x-hidden'>
          <header className='flex h-16 shrink-0 items-center gap-3 transition-[width,height] ease-linear group-has-[[data-collapsible=icon]]/sidebar-wrapper:h-12 px-4'>
            <SidebarTrigger className='-ml-1' />
            <Separator orientation='vertical' className='h-2' />
            <div className='flex-1'>
              <AppBreadcrumb />
            </div>
          </header>
          <RouteTransition>
            <div className='flex flex-1 flex-col gap-4 px-4 py-4 w-full overflow-x-hidden'>
              {children}
            </div>
          </RouteTransition>
        </SidebarInset>
      </SidebarProvider>
    </AccessControl>
  );
}
