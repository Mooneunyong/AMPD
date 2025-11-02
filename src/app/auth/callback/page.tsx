'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

/**
 * OAuth 콜백 페이지
 * Supabase가 hash fragment에서 자동으로 세션을 감지하고 localStorage에 저장합니다.
 */
export default function AuthCallback() {
  const router = useRouter();

  useEffect(() => {
    const handleAuthCallback = async () => {
      try {
        // Supabase가 자동으로 URL에서 세션을 감지하고 localStorage에 저장
        // detectSessionInUrl: true로 설정되어 있으므로 자동 처리됨
        
        // 세션 처리 대기
        await new Promise((resolve) => setTimeout(resolve, 500));
        
        // 세션 확인
        const { data: { session }, error } = await supabase.auth.getSession();

        if (error) {
          console.error('[Auth Callback] 세션 확인 오류:', error);
          router.push('/');
          return;
        }

        if (session && session.user) {
          // hash fragment 제거
          window.history.replaceState({}, document.title, '/auth/callback');
          // 홈으로 리다이렉트
          router.push('/');
        } else {
          // 세션이 없으면 홈으로 (에러는 표시하지 않음)
          router.push('/');
        }
      } catch (err) {
        console.error('[Auth Callback] 오류:', err);
        router.push('/');
      }
    };

    handleAuthCallback();
  }, [router]);

  // 로딩 화면 표시
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
