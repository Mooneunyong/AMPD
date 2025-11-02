'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';

/**
 * 테이블 래퍼 컴포넌트 - 공통 스타일링 적용
 */
interface TableWrapperProps {
  children: React.ReactNode;
  className?: string;
  enableHorizontalScroll?: boolean;
}

export function TableWrapper({
  children,
  className,
  enableHorizontalScroll = true,
}: TableWrapperProps) {
  return (
    <div
      className={cn(
        'w-full overflow-hidden rounded-xl border',
        className
      )}
    >
      {enableHorizontalScroll ? (
        <div className='overflow-x-auto'>{children}</div>
      ) : (
        children
      )}
    </div>
  );
}

/**
 * 테이블 스타일 상수
 */
export const TABLE_STYLES = {
  header: 'sticky top-0 z-20 bg-muted [&_th]:py-2 [&_th]:px-2 [&_th]:h-9',
  body: '[&_td]:py-2 [&_td]:px-2',
  table: 'tableLayout: fixed, width: 100%',
} as const;

/**
 * 기본 테이블 레이아웃 컴포넌트
 */
interface BaseTableProps {
  children: React.ReactNode;
  headerContent: React.ReactNode;
  bodyContent: React.ReactNode;
  className?: string;
  enableHorizontalScroll?: boolean;
}

export function BaseTable({
  headerContent,
  bodyContent,
  className,
  enableHorizontalScroll = true,
}: BaseTableProps) {
  return (
    <TableWrapper
      className={className}
      enableHorizontalScroll={enableHorizontalScroll}
    >
      <Table style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHeader className={TABLE_STYLES.header}>
          <TableRow>{headerContent}</TableRow>
        </TableHeader>
        <TableBody className={TABLE_STYLES.body}>{bodyContent}</TableBody>
      </Table>
    </TableWrapper>
  );
}

