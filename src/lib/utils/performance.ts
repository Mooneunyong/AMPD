/**
 * 성능 최적화 관련 유틸리티 함수
 */

/**
 * 디바운스 함수
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * 스로틀 함수
 */
export function throttle<T extends (...args: any[]) => any>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * 메모이제이션 함수
 */
export function memoize<T extends (...args: any[]) => any>(func: T): T {
  const cache = new Map();

  return ((...args: Parameters<T>) => {
    const key = JSON.stringify(args);

    if (cache.has(key)) {
      return cache.get(key);
    }

    const result = func(...args);
    cache.set(key, result);
    return result;
  }) as T;
}

/**
 * 지연 실행 함수
 */
export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 애니메이션 프레임 기반 지연
 */
export function requestAnimationFrameDelay(): Promise<void> {
  return new Promise((resolve) => requestAnimationFrame(() => resolve()));
}

/**
 * 함수 실행 시간 측정
 */
export function measureExecutionTime<T>(func: () => T, label?: string): T {
  const start = performance.now();
  const result = func();
  const end = performance.now();

  if (label) {
    console.log(`${label}: ${end - start}ms`);
  }

  return result;
}

/**
 * 비동기 함수 실행 시간 측정
 */
export async function measureAsyncExecutionTime<T>(
  func: () => Promise<T>,
  label?: string
): Promise<T> {
  const start = performance.now();
  const result = await func();
  const end = performance.now();

  if (label) {
    console.log(`${label}: ${end - start}ms`);
  }

  return result;
}
