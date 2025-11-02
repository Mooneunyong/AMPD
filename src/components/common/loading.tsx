/**
 * 로딩 스피너 컴포넌트
 */

import { cn } from '@/lib/utils';
import { LoadingSpinnerProps } from '@/types';

const sizeClasses = {
  sm: 'h-4 w-4',
  md: 'h-6 w-6',
  lg: 'h-8 w-8',
} as const;

export function LoadingSpinner({
  size = 'md',
  className,
}: LoadingSpinnerProps) {
  return (
    <div
      className={cn(
        'animate-spin rounded-full border-2 border-current border-t-transparent',
        sizeClasses[size],
        className
      )}
      role='status'
      aria-label='Loading'
    >
      <span className='sr-only'>Loading...</span>
    </div>
  );
}

/**
 * 통일된 페이지 로딩 컴포넌트
 */
interface PageLoadingProps {
  className?: string;
}

export function PageLoading({ className = '' }: PageLoadingProps) {
  return (
    <div className={`flex items-center justify-center py-20 ${className}`}>
      <div className='text-center space-y-4'>
        <div className='flex justify-center'>
          <div className='relative'>
            <div className='animate-spin rounded-full h-12 w-12 border-3 border-primary/10'></div>
            <div
              className='animate-spin rounded-full h-12 w-12 border-3 border-transparent border-t-primary absolute top-0 left-0'
              style={{
                animationDirection: 'reverse',
                animationDuration: '0.8s',
              }}
            ></div>
          </div>
        </div>
        <div className='flex justify-center space-x-1'>
          <div className='w-1 h-1 bg-primary rounded-full animate-bounce'></div>
          <div
            className='w-1 h-1 bg-primary rounded-full animate-bounce'
            style={{ animationDelay: '0.1s' }}
          ></div>
          <div
            className='w-1 h-1 bg-primary rounded-full animate-bounce'
            style={{ animationDelay: '0.2s' }}
          ></div>
        </div>
      </div>
    </div>
  );
}

/**
 * 로딩 오버레이 컴포넌트
 */
interface LoadingOverlayProps {
  isLoading: boolean;
  children: React.ReactNode;
  message?: string;
}

export function LoadingOverlay({
  isLoading,
  children,
  message = 'Loading...',
}: LoadingOverlayProps) {
  if (!isLoading) return <>{children}</>;

  return (
    <div className='relative'>
      {children}
      <div className='absolute inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50'>
        <div className='text-center'>
          <LoadingSpinner size='lg' className='mx-auto mb-2' />
          <p className='text-sm text-muted-foreground'>{message}</p>
        </div>
      </div>
    </div>
  );
}

/**
 * 에러 상태 컴포넌트
 */
interface ErrorStateProps {
  error: string;
  onRetry?: () => void;
  className?: string;
}

export function ErrorState({ error, onRetry, className }: ErrorStateProps) {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className='mb-4'>
        <div className='mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center mb-2'>
          <svg
            className='w-6 h-6 text-destructive'
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
        </div>
        <h3 className='text-lg font-semibold text-foreground mb-1'>
          오류 발생
        </h3>
        <p className='text-sm text-muted-foreground mb-4'>{error}</p>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className='px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors'
        >
          다시 시도
        </button>
      )}
    </div>
  );
}

/**
 * 빈 상태 컴포넌트
 */
interface EmptyStateProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  title,
  description,
  icon,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div className={cn('text-center py-8', className)}>
      <div className='mb-4'>
        {icon && (
          <div className='mx-auto w-12 h-12 bg-muted rounded-full flex items-center justify-center mb-2'>
            {icon}
          </div>
        )}
        <h3 className='text-lg font-semibold text-foreground mb-1'>{title}</h3>
        {description && (
          <p className='text-sm text-muted-foreground mb-4'>{description}</p>
        )}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}
