'use client';

import { useState, useEffect } from 'react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Field,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldSeparator,
} from '@/components/ui/field';
import {
  signInWithGoogle,
  clearAllSessions,
  testLoginFlow,
} from '@/lib/supabase';
import { createClient } from '@/utils/supabase/client';
import { testConnection } from '@/lib/test-supabase';

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<'form'>) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    try {
      setIsLoading(true);
      setError(null);

      // 먼저 기존 세션 정리
      await clearAllSessions();

      // Google 로그인 시도
      await signInWithGoogle();
    } catch (err) {
      setError('로그인 중 오류가 발생했습니다. 다시 시도해주세요.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearSession = async () => {
    try {
      setIsLoading(true);
      setError(null);
      await clearAllSessions();
      setError('세션이 정리되었습니다.');
    } catch (err) {
      setError('세션 정리 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCheckSession = async () => {
    try {
      setIsLoading(true);
      setError(null);

      const supabase = createClient();
      const { data: sessionData, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError) {
        if (sessionError.message?.includes('Auth session missing')) {
          setError('로그인하지 않은 상태입니다.');
        } else {
          setError('세션 확인에 실패했습니다.');
        }
      } else if (sessionData.session?.user) {
        setError('로그인된 상태입니다.');
      } else {
        setError('로그인하지 않은 상태입니다.');
      }
    } catch (err) {
      setError('세션 확인 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDebugInfo = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await testLoginFlow();
      setError('디버그 정보가 수집되었습니다.');
    } catch (err) {
      setError('디버그 정보를 가져오는 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleTestSupabase = async () => {
    try {
      setIsLoading(true);
      setError(null);

      await testConnection();
      setError('Supabase 연결 테스트가 완료되었습니다.');
    } catch (err) {
      setError('Supabase 연결 테스트 중 오류가 발생했습니다.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form className={cn('flex flex-col gap-6', className)} {...props}>
      <FieldGroup>
        <div className='flex flex-col items-center gap-1'>
          <h1 className='text-2xl font-bold text-foreground'>AMPD에 로그인</h1>
          <p className='text-xs text-muted-foreground'>
            Google 계정으로 로그인하세요
          </p>
        </div>

        {error && (
          <div className='p-4 text-sm text-destructive bg-destructive/10 border border-destructive/20 rounded-lg'>
            <div className='flex items-start space-x-2'>
              <svg
                className='w-5 h-5 text-destructive mt-0.5 flex-shrink-0'
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
              <div>
                <p className='font-medium'>알림</p>
                <p className='mt-1'>{error}</p>
              </div>
            </div>
          </div>
        )}

        <Field>
          <Button
            variant='outline'
            type='button'
            onClick={handleGoogleLogin}
            disabled={isLoading}
            className='w-full'
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
            {isLoading ? '로그인 중...' : 'Google로 로그인'}
          </Button>
        </Field>

        <FieldSeparator />

        <Field>
          <Button
            variant='ghost'
            type='button'
            onClick={handleCheckSession}
            disabled={isLoading}
            className='w-full text-sm'
          >
            🔍 세션 상태 확인
          </Button>
        </Field>

        <Field>
          <Button
            variant='ghost'
            type='button'
            onClick={handleClearSession}
            disabled={isLoading}
            className='w-full text-sm'
          >
            🔄 세션 초기화
          </Button>
        </Field>

        <Field>
          <Button
            variant='ghost'
            type='button'
            onClick={handleDebugInfo}
            disabled={isLoading}
            className='w-full text-sm'
          >
            🔍 디버그 정보 출력
          </Button>
        </Field>

        <Field>
          <Button
            variant='ghost'
            type='button'
            onClick={handleTestSupabase}
            disabled={isLoading}
            className='w-full text-sm'
          >
            🔧 Supabase 연결 테스트
          </Button>
        </Field>
      </FieldGroup>
    </form>
  );
}
