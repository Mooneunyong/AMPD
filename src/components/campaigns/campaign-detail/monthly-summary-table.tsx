'use client';

import * as React from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { TableWrapper, TABLE_STYLES } from '@/components/common/table-wrapper';
import { isRoasColumn, roasBgStyle } from '@/lib/utils/roas';
import { useCellSelection } from './use-cell-selection';

type MonthlyRow = Record<string, unknown>;

interface MonthlySummaryTableProps {
  rows: MonthlyRow[];
}

export function MonthlySummaryTable({ rows }: MonthlySummaryTableProps) {
  // 'Month' 를 첫 열로 두고 나머지를 이어붙인 통합 헤더 (셀 선택용)
  const headers = React.useMemo(() => {
    if (!rows || rows.length === 0) return [];
    return ['Month', ...Object.keys(rows[0]).filter((k) => k !== 'Month')];
  }, [rows]);

  const { containerRef, dragging, cellProps, selectionStyle, chip } =
    useCellSelection(rows ?? [], headers);

  if (!rows || rows.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No monthly data available.
      </div>
    );
  }

  return (
    <div ref={containerRef} className='relative h-full min-h-0'>
      <TableWrapper fillHeight className='max-h-full h-full'>
        <Table
          style={{ width: 'max-content', minWidth: '100%' }}
          className={dragging ? 'select-none' : ''}
        >
          <TableHeader className={TABLE_STYLES.header}>
            <TableRow>
              {headers.map((header, index) => (
                <TableHead
                  key={header}
                  className={`whitespace-nowrap ${
                    index === 0 ? 'sticky left-0 z-30 bg-muted' : ''
                  } ${index >= 1 && index <= 4 ? 'text-center' : ''}`}
                  style={index === 0 ? { width: '1px' } : undefined}
                >
                  {header}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody className={TABLE_STYLES.body}>
            {rows.map((row, rowIndex) => (
              <TableRow key={(row.Month as string | undefined) ?? rowIndex}>
                {headers.map((header, cellIndex) => {
                  const isLabelCol = cellIndex === 0;
                  let cellClassName = 'whitespace-nowrap';
                  if (isLabelCol) {
                    cellClassName +=
                      ' sticky left-0 z-10 bg-muted font-medium';
                  }
                  if (cellIndex >= 1 && cellIndex <= 4) {
                    cellClassName += ' text-center';
                  }

                  const overlay = selectionStyle(rowIndex, cellIndex);
                  const baseStyle =
                    !isLabelCol && isRoasColumn(header)
                      ? roasBgStyle(row[header])
                      : undefined;
                  const widthStyle = isLabelCol
                    ? { width: '1px' as const }
                    : undefined;
                  const cellStyle: React.CSSProperties | undefined =
                    baseStyle || overlay || widthStyle
                      ? { ...baseStyle, ...overlay, ...widthStyle }
                      : undefined;

                  return (
                    <TableCell
                      key={header}
                      className={cellClassName}
                      style={cellStyle}
                      {...cellProps(rowIndex, cellIndex)}
                    >
                      {row[header] as React.ReactNode}
                    </TableCell>
                  );
                })}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </TableWrapper>

      {chip}
    </div>
  );
}
