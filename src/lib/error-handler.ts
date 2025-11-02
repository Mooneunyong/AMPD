/**
 * Supabase 에러 처리 유틸리티
 */

export interface SupabaseError {
  code?: string;
  message?: string;
  details?: string;
  hint?: string;
}

export interface ParsedError {
  type: 'network' | 'auth' | 'unknown';
  title: string;
  message: string;
  details?: string;
}

/**
 * Supabase 에러를 파싱하여 사용자 친화적인 메시지로 변환
 */
export function parseSupabaseError(error: any): ParsedError {
  console.log('Raw error:', error);

  // 네트워크 에러
  if (
    error?.message?.includes('network') ||
    error?.message?.includes('fetch') ||
    error?.code === 'NETWORK_ERROR'
  ) {
    return {
      type: 'network',
      title: '네트워크 오류',
      message: '인터넷 연결을 확인하고 다시 시도해주세요.',
      details: '네트워크 연결이 불안정할 수 있습니다.',
    };
  }

  // 인증 관련 에러
  if (
    error?.message?.includes('auth') ||
    error?.message?.includes('unauthorized') ||
    error?.code?.startsWith('auth_')
  ) {
    return {
      type: 'auth',
      title: '인증 오류',
      message: '로그인 중 문제가 발생했습니다.',
      details: '다시 로그인을 시도해주세요.',
    };
  }

  // 알 수 없는 에러
  return {
    type: 'unknown',
    title: '오류 발생',
    message: '예상치 못한 오류가 발생했습니다.',
    details: error?.message || '다시 시도해주세요.',
  };
}

/**
 * 에러 타입에 따른 아이콘 반환
 */
export function getErrorIcon(type: ParsedError['type']): string {
  switch (type) {
    case 'network':
      return '🌐';
    case 'auth':
      return '🔑';
    default:
      return '⚠️';
  }
}

/**
 * 에러 타입에 따른 색상 클래스 반환
 */
export function getErrorColorClass(type: ParsedError['type']): string {
  switch (type) {
    case 'network':
      return 'text-blue-800 bg-blue-50 border-blue-200';
    case 'auth':
      return 'text-red-800 bg-red-50 border-red-200';
    default:
      return 'text-gray-800 bg-gray-50 border-gray-200';
  }
}
