/**
 * 공통 컴포넌트 메인 파일
 * 모든 공통 컴포넌트를 중앙에서 관리하고 재export
 */

// 로딩 관련 컴포넌트
export {
  LoadingSpinner,
  LoadingOverlay,
  PageLoading,
  ErrorState,
  EmptyState,
} from './loading';

// 폼 관련 컴포넌트
export {
  FormField,
  SearchInput,
  SubmitButton,
  FormGroup,
  FormSection,
} from './forms';

// 레이아웃 관련 컴포넌트
export {
  PageHeader,
  Section,
  CardContainer,
  Grid,
  Stack,
  Container,
} from './layout';

// 테이블 관련 컴포넌트
export {
  TableWrapper,
  BaseTable,
  TABLE_STYLES,
} from './table-wrapper';

// 다이얼로그 관련 컴포넌트
export { DeleteConfirmationDialog } from './delete-confirmation-dialog';

// 기존 컴포넌트들 (호환성을 위해 유지)
import { ReactNode } from 'react';

interface StatCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: 'up' | 'down';
  icon: ReactNode;
}

export function StatCard({
  title,
  value,
  change,
  trend = 'up',
  icon,
}: StatCardProps) {
  const trendColor = trend === 'up' ? 'text-green-600' : 'text-red-600';
  const trendIcon = trend === 'up' ? '↗' : '↘';

  return (
    <div className='rounded-lg border bg-card p-6'>
      <div className='flex items-center justify-between'>
        <div>
          <p className='text-sm font-medium text-muted-foreground'>{title}</p>
          <p className='text-2xl font-bold'>{value}</p>
          {change && (
            <p className={`text-xs ${trendColor} flex items-center gap-1 mt-1`}>
              <span>{trendIcon}</span>
              {change}
            </p>
          )}
        </div>
        <div className='text-muted-foreground'>{icon}</div>
      </div>
    </div>
  );
}
