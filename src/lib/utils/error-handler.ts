/**
 * 공통 에러 처리 유틸리티
 * 모든 에러 처리를 표준화하고 중앙에서 관리
 */

import { toast } from 'sonner';

/**
 * Supabase 에러 객체에서 메시지 추출
 */
export function extractErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }

  if (error && typeof error === 'object') {
    const err = error as any;
    
    // Supabase PostgREST 에러 구조 확인
    if (err.message && typeof err.message === 'string') {
      return err.message;
    }
    
    if (err.details && typeof err.details === 'string') {
      return err.details;
    }
    
    if (err.hint && typeof err.hint === 'string') {
      return err.hint;
    }
    
    if (err.code && typeof err.code === 'string') {
      return `Error code: ${err.code}`;
    }
  }

  if (typeof error === 'string') {
    return error;
  }

  return 'An unexpected error occurred. Please try again.';
}

/**
 * 에러를 안전하게 처리하고 사용자에게 알림
 */
export function handleError(error: unknown, defaultMessage?: string): void {
  const message = extractErrorMessage(error);
  const errorMessage = defaultMessage || message;
  
  toast.error(errorMessage);
  
  // 개발 환경에서만 상세 로그 출력
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', error);
  }
}

/**
 * 성공 메시지 표시
 */
export function showSuccess(message: string): void {
  toast.success(message);
}

/**
 * 타입 안전한 에러 체크
 */
export function isError(error: unknown): error is Error {
  return error instanceof Error;
}

/**
 * Supabase 에러인지 확인
 */
export function isSupabaseError(error: unknown): boolean {
  if (!error || typeof error !== 'object') return false;
  
  const err = error as any;
  return !!(
    err.code ||
    err.message ||
    err.details ||
    err.hint ||
    err.status
  );
}

