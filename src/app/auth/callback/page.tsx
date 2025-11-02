'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * OAuth 콜백 페이지
 * Supabase가 hash fragment에서 자동으로 세션을 감지하고 localStorage에 저장합니다.
 */
export default function AuthCallback() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        if (process.env.NODE_ENV === 'development') {
          console.log('[Auth Callback] 페이지 로드', {
            hash: window.location.hash,
            search: window.location.search,
          });
        }

        // Supabase가 자동으로 URL에서 세션을 감지하고 localStorage에 저장
        // detectSessionInUrl: true로 설정되어 있으므로 자동 처리됨
        
        // 짧은 딜레이 후 세션 확인 (Supabase가 URL에서 세션을 처리할 시간 확보)
        await new Promise((resolve) => setTimeout(resolve, 100));
        
        // 세션 확인
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();

        if (sessionError) {
          console.error('[Auth Callback] 세션 확인 오류:', sessionError);
          setError('세션 확인 중 오류가 발생했습니다.');
          setLoading(false);
          setTimeout(() => router.push('/'), 3000);
          return;
        }

        if (session && session.user) {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth Callback] 로그인 성공!', {
              userId: session.user.id,
              email: session.user.email,
            });
          }

          // URL 정리 (hash fragment 제거)
          window.history.replaceState({}, document.title, '/auth/callback');
          
          // 즉시 홈으로 리다이렉트 (로딩 화면 표시하지 않음)
          // AppLayout의 전역 로딩이 표시됩니다
          window.location.href = '/';
        } else {
          if (process.env.NODE_ENV === 'development') {
            console.log('[Auth Callback] 세션 없음');
          }
          setError('로그인에 실패했습니다.');
          setLoading(false);
          setTimeout(() => router.push('/'), 3000);
        }
      } catch (err) {
        console.error('[Auth Callback] 오류:', err);
        setError(err instanceof Error ? err.message : '예상치 못한 오류가 발생했습니다.');
        setLoading(false);
        setTimeout(() => router.push('/'), 3000);
      }
    };

    handleAuthCallback();
  }, [router]);

  // 로딩 중이면 즉시 리다이렉트하므로 로딩 화면을 표시하지 않음
  // AppLayout의 전역 로딩이 표시됩니다
  if (loading) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center'>
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
      </div>
    );
  }

  if (error) {
    return (
      <div className='flex items-center justify-center min-h-screen bg-background'>
        <div className='text-center max-w-md mx-auto p-6'>
          <div className='mb-6'>
            <span className='text-6xl'>⚠️</span>
          </div>
          <h2 className='text-xl font-bold text-foreground mb-4'>로그인 실패</h2>
          <div className='bg-red-50 border border-red-200 rounded-lg p-4 mb-4'>
            <p className='text-sm text-red-800'>{error}</p>
          </div>
          <button
            onClick={() => router.push('/')}
            className='mt-4 px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
          >
            로그인 페이지로 이동
          </button>
        </div>
      </div>
    );
  }

  return null;
}
