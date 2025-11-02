/**
 * 폼 관련 공통 컴포넌트
 */

import { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

/**
 * 폼 필드 컴포넌트
 */
interface FormFieldProps {
  label: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}

export function FormField({
  label,
  error,
  required,
  children,
  className,
}: FormFieldProps) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label className='text-sm font-medium'>
        {label}
        {required && <span className='text-destructive ml-1'>*</span>}
      </Label>
      {children}
      {error && <p className='text-sm text-destructive'>{error}</p>}
    </div>
  );
}

/**
 * 검색 입력 컴포넌트
 */
interface SearchInputProps {
  placeholder?: string;
  value: string;
  onChange: (value: string) => void;
  onClear?: () => void;
  className?: string;
}

export function SearchInput({
  placeholder = '검색어를 입력하세요...',
  value,
  onChange,
  onClear,
  className,
}: SearchInputProps) {
  return (
    <div className={cn('relative', className)}>
      <Input
        type='text'
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className='pr-10'
      />
      <div className='absolute right-3 top-1/2 -translate-y-1/2 flex items-center space-x-1'>
        {value && onClear && (
          <button
            type='button'
            onClick={onClear}
            className='text-muted-foreground hover:text-foreground transition-colors'
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
        )}
        <svg
          className='w-4 h-4 text-muted-foreground'
          fill='none'
          stroke='currentColor'
          viewBox='0 0 24 24'
        >
          <path
            strokeLinecap='round'
            strokeLinejoin='round'
            strokeWidth={2}
            d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
          />
        </svg>
      </div>
    </div>
  );
}

/**
 * 제출 버튼 컴포넌트
 */
interface SubmitButtonProps {
  isLoading?: boolean;
  loadingText?: string;
  children: React.ReactNode;
  className?: string;
  disabled?: boolean;
}

export const SubmitButton = forwardRef<HTMLButtonElement, SubmitButtonProps>(
  (
    {
      isLoading,
      loadingText = '처리 중...',
      children,
      className,
      disabled,
      ...props
    },
    ref
  ) => {
    return (
      <Button
        ref={ref}
        type='submit'
        disabled={isLoading || disabled}
        className={cn('w-full', className)}
        {...props}
      >
        {isLoading ? (
          <>
            <div className='animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent mr-2' />
            {loadingText}
          </>
        ) : (
          children
        )}
      </Button>
    );
  }
);

SubmitButton.displayName = 'SubmitButton';

/**
 * 폼 그룹 컴포넌트
 */
interface FormGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function FormGroup({ children, className }: FormGroupProps) {
  return <div className={cn('space-y-4', className)}>{children}</div>;
}

/**
 * 폼 섹션 컴포넌트
 */
interface FormSectionProps {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

export function FormSection({
  title,
  description,
  children,
  className,
}: FormSectionProps) {
  return (
    <div className={cn('space-y-4', className)}>
      <div>
        <h3 className='text-lg font-semibold text-foreground'>{title}</h3>
        {description && (
          <p className='text-sm text-muted-foreground mt-1'>{description}</p>
        )}
      </div>
      <div className='space-y-4'>{children}</div>
    </div>
  );
}
