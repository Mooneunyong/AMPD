'use client';

import { useEffect, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabase, safeGetSession } from '@/lib/supabase';
import {
  parseSupabaseError,
  getErrorIcon,
  getErrorColorClass,
  ParsedError,
} from '@/lib/error-handler';

export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<ParsedError | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // URL fragment에서 토큰 정보 추출 (hash 기반 인증)
        if (typeof window !== 'undefined' && window.location.hash) {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');
          const refreshToken = hashParams.get('refresh_token');
          const errorParam = hashParams.get('error');
          const errorDescription = hashParams.get('error_description');

          // 에러가 있으면 처리
          if (errorParam) {
            const parsedError = parseSupabaseError({
              message: '로그인 과정에서 오류가 발생했습니다.',
              code: errorParam,
              details: errorDescription || '다시 시도해주세요.',
            });
            setError(parsedError);
            setLoading(false);

            // URL 정리
            window.history.replaceState({}, document.title, '/auth/callback');

            setTimeout(() => {
              router.push('/');
            }, 3000);
            return;
          }

          // 토큰이 있으면 세션 설정
          if (accessToken && refreshToken) {
            const { data: sessionData, error: sessionError } =
              await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: refreshToken,
              });

            if (sessionError) {
              const parsedError = parseSupabaseError({
                message: '세션 설정 중 오류가 발생했습니다.',
                details: '다시 시도해주세요.',
              });
              setError(parsedError);
              setLoading(false);
              return;
            }

            if (sessionData.session?.user) {
              // URL 정리 (토큰 정보 제거)
              window.history.replaceState({}, document.title, '/auth/callback');
              router.push('/');
              return;
            }
          }
        }

        // URL 파라미터에서 에러 정보 확인 (query string)
        const errorParam = searchParams.get('error');
        const errorCode = searchParams.get('error_code');
        const errorDescription = searchParams.get('error_description');

        if (errorParam) {
          const parsedError = parseSupabaseError({
            message: '로그인 과정에서 오류가 발생했습니다.',
            code: errorCode || errorParam,
            details: errorDescription || '다시 시도해주세요.',
          });
          setError(parsedError);
          setLoading(false);

          setTimeout(() => {
            router.push('/');
          }, 3000);
          return;
        }

        // 코드 파라미터가 있으면 세션 교환 시도 (PKCE flow)
        const code = searchParams.get('code');
        if (code) {
          const { data: exchangeData, error: exchangeError } =
            await supabase.auth.exchangeCodeForSession(code);

          if (exchangeError) {
            const parsedError = parseSupabaseError({
              message: '로그인 처리 중 오류가 발생했습니다.',
              details: '다시 시도해주세요.',
            });
            setError(parsedError);
            setLoading(false);
            return;
          }

          if (exchangeData.session?.user) {
            router.push('/');
            return;
          }
        }

        // 코드가 없거나 세션 교환이 실패한 경우, 현재 세션 확인
        const { data: sessionData, error: sessionError } =
          await supabase.auth.getSession();

        if (sessionError) {
          const parsedError = parseSupabaseError({
            message: '세션 확인 중 오류가 발생했습니다.',
            details: '다시 로그인해주세요.',
          });
          setError(parsedError);
          setLoading(false);
          return;
        }

        if (sessionData.session?.user) {
          router.push('/');
        } else {
          const fallbackError: ParsedError = {
            type: 'auth',
            title: '로그인 실패',
            message: '로그인 과정에서 문제가 발생했습니다.',
            details: '다시 시도해주세요.',
          };
          setError(fallbackError);
          setLoading(false);

          setTimeout(() => {
            router.push('/');
          }, 5000);
        }
      } catch (err) {
        const parsedError = parseSupabaseError({
          message: '예상치 못한 오류가 발생했습니다.',
          details: '다시 시도해주세요.',
        });
        setError(parsedError);
        setLoading(false);
      }
    };

    handleAuthCallback();
  }, [router, searchParams]);

  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen'>
        <div className='text-center'>
          <div className='animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto'></div>
          <p className='mt-2 text-sm text-gray-600'>인증 처리 중...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mb-6'>
            <span className='text-6xl'>{getErrorIcon(error.type)}</span>
          </div>
          <h2 className='text-xl font-bold text-foreground mb-4'>
            {error.title}
          </h2>
          <div
            className={`p-4 text-sm rounded-lg border mb-4 ${getErrorColorClass(
              error.type
            )}`}
          >
            <div className='flex items-start space-x-2'>
              <div className='flex-1'>
                <p className='font-medium'>{error.message}</p>
                {error.details && (
                  <p className='mt-1 text-xs opacity-80'>{error.details}</p>
                )}
              </div>
            </div>
          </div>
          <div className='space-y-2'>
            <p className='text-sm text-muted-foreground font-medium'>
              ⏰ 3초 후 로그인 페이지로 자동 이동합니다
            </p>
            <button
              onClick={() => router.push('/')}
              className='mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
            >
              지금 로그인 페이지로 이동
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
