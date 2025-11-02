/**
 * API 에러 처리 유틸리티
 * Supabase API 호출 시 에러 처리를 표준화
 */

import { PostgrestError } from '@supabase/supabase-js';
import { extractErrorMessage, handleError } from './error-handler';

/**
 * Supabase PostgREST 에러를 사용자 친화적인 메시지로 변환
 */
export function parsePostgrestError(error: PostgrestError | null): string {
  if (!error) {
    return 'An unknown error occurred.';
  }

  // 우선순위에 따라 메시지 추출
  if (error.message) {
    return error.message;
  }

  if (error.details) {
    return error.details;
  }

  if (error.hint) {
    return error.hint;
  }

  if (error.code) {
    return `Error code: ${error.code}`;
  }

  return 'Database operation failed. Please try again.';
}

/**
 * Supabase API 호출을 래핑하여 에러 처리 자동화
 */
export async function handleSupabaseCall<T>(
  operation: () => Promise<{ data: T | null; error: PostgrestError | null }>,
  errorContext?: string
): Promise<T> {
  const { data, error } = await operation();

  if (error) {
    const errorMessage = parsePostgrestError(error);
    const contextMessage = errorContext 
      ? `${errorContext}: ${errorMessage}`
      : errorMessage;
    
    throw new Error(contextMessage);
  }

  if (!data) {
    throw new Error(errorContext || 'No data returned from operation.');
  }

  return data;
}

/**
 * API 호출 시 에러를 처리하고 toast 표시
 */
export async function handleApiCall<T>(
  operation: () => Promise<T>,
  options?: {
    successMessage?: string;
    errorMessage?: string;
    onSuccess?: (result: T) => void;
    onError?: (error: unknown) => void;
  }
): Promise<T | null> {
  try {
    const result = await operation();
    
    if (options?.successMessage) {
      // handleSuccess는 별도 파일에서 import
      const { showSuccess } = await import('./error-handler');
      showSuccess(options.successMessage);
    }
    
    options?.onSuccess?.(result);
    return result;
  } catch (error) {
    if (options?.onError) {
      options.onError(error);
    } else {
      handleError(error, options?.errorMessage);
    }
    return null;
  }
}

