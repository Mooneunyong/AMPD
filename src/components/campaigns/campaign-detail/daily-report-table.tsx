'use client';

import * as React from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';
import { Copy, X } from 'lucide-react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { TableWrapper, TABLE_STYLES } from '@/components/common/table-wrapper';
import {
  formatDateWithWeekday,
  isSunday,
  formatSales,
} from '@/lib/utils/sheet-formatters';
import { isRoasColumn, roasBgStyle } from '@/lib/utils/roas';

type SheetRow = Record<string, unknown>;

// 셀에 부착된 메모(hover note) 조회
function getCellMemo(row: SheetRow, header: string): string | null {
  const notes = row._notes as Record<string, string> | undefined;
  if (!notes) return null;
  return notes[header] ?? null;
}

interface DailyReportTableProps {
  loading: boolean;
  error: string | null;
  data: SheetRow[];
  headers: string[];
  onRetry: () => void;
}

const isDateHeader = (h: string) =>
  h === '날짜' || h === 'date' || h.toLowerCase() === 'date';

const isSalesHeader = (h: string) =>
  h === '매출(누적)' ||
  h === '매출' ||
  h.toLowerCase().includes('매출') ||
  h.toLowerCase().includes('sales');

// "$ 1,234.56" / "45.31%" / "1,234" → 숫자. 파싱 불가면 null.
// Number() 사용: 문자열 "전체"가 숫자여야 인정 (parseFloat 는 "2026-05-25"→2026
// 처럼 앞부분만 파싱해 날짜를 숫자로 오인하므로 사용하지 않음).
function parseNum(v: unknown): number | null {
  if (v === null || v === undefined) return null;
  const s = String(v).trim();
  if (!s || s === '-') return null;
  const cleaned = s.replace(/[$,\s%]/g, '');
  if (!cleaned) return null;
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

// 선택 셀들의 원본 문자열로 표시 형식 추정 ($ / % / 일반)
function detectFormat(raws: string[]): 'pct' | 'dollar' | 'plain' {
  const pct = raws.filter((r) => r.includes('%')).length;
  const dol = raws.filter((r) => r.includes('$')).length;
  if (pct > 0 && pct >= dol) return 'pct';
  if (dol > 0) return 'dollar';
  return 'plain';
}

function fmt(n: number, f: 'pct' | 'dollar' | 'plain'): string {
  if (f === 'pct')
    return `${n.toLocaleString(undefined, { maximumFractionDigits: 2 })}%`;
  if (f === 'dollar')
    return `$ ${n.toLocaleString(undefined, {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  return n.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

interface Cell {
  r: number;
  c: number;
}

export function DailyReportTable({
  loading,
  error,
  data,
  headers,
  onRetry,
}: DailyReportTableProps) {
  // ── 셀 선택 상태 ──
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [focusCell, setFocusCell] = useState<Cell | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  const bounds = useMemo(() => {
    if (!anchor || !focusCell) return null;
    return {
      r0: Math.min(anchor.r, focusCell.r),
      r1: Math.max(anchor.r, focusCell.r),
      c0: Math.min(anchor.c, focusCell.c),
      c1: Math.max(anchor.c, focusCell.c),
    };
  }, [anchor, focusCell]);

  const inSel = useCallback(
    (r: number, c: number) =>
      !!bounds &&
      r >= bounds.r0 &&
      r <= bounds.r1 &&
      c >= bounds.c0 &&
      c <= bounds.c1,
    [bounds]
  );

  const clearSel = useCallback(() => {
    setAnchor(null);
    setFocusCell(null);
  }, []);

  // 선택 영역 → 클립보드(TSV)
  const copySelection = useCallback(() => {
    if (!bounds) return;
    const lines: string[] = [];
    for (let r = bounds.r0; r <= bounds.r1; r++) {
      const cols: string[] = [];
      for (let c = bounds.c0; c <= bounds.c1; c++) {
        const raw = data[r]?.[headers[c]];
        cols.push(raw == null ? '' : String(raw).trim());
      }
      lines.push(cols.join('\t'));
    }
    navigator.clipboard
      .writeText(lines.join('\n'))
      .then(() => toast.success('선택 영역을 복사했습니다'))
      .catch(() => toast.error('복사 실패'));
  }, [bounds, data, headers]);

  // 선택 집계
  const stats = useMemo(() => {
    if (!bounds) return null;
    const nums: number[] = [];
    const raws: string[] = [];
    let cellCount = 0;
    for (let r = bounds.r0; r <= bounds.r1; r++) {
      for (let c = bounds.c0; c <= bounds.c1; c++) {
        cellCount++;
        const raw = data[r]?.[headers[c]];
        const n = parseNum(raw);
        if (n !== null) {
          nums.push(n);
          raws.push(String(raw));
        }
      }
    }
    if (nums.length === 0)
      return {
        cellCount,
        count: 0,
        sum: 0,
        avg: 0,
        min: 0,
        max: 0,
        f: 'plain' as const,
      };
    const sum = nums.reduce((a, b) => a + b, 0);
    const f = detectFormat(raws);
    return {
      cellCount,
      count: nums.length,
      sum,
      avg: sum / nums.length,
      min: Math.min(...nums),
      max: Math.max(...nums),
      f,
    };
  }, [bounds, data, headers]);

  // 전역: 드래그 종료 + 단축키(Esc 해제, Cmd/Ctrl+C 복사)
  useEffect(() => {
    const up = () => {
      draggingRef.current = false;
      setDragging(false);
    };
    const key = (e: KeyboardEvent) => {
      if (e.key === 'Escape') clearSel();
      if ((e.metaKey || e.ctrlKey) && (e.key === 'c' || e.key === 'C')) {
        if (bounds) {
          e.preventDefault();
          copySelection();
        }
      }
    };
    window.addEventListener('mouseup', up);
    window.addEventListener('keydown', key);
    return () => {
      window.removeEventListener('mouseup', up);
      window.removeEventListener('keydown', key);
    };
  }, [bounds, clearSel, copySelection]);

  const onCellDown = useCallback(
    (r: number, c: number, e: React.MouseEvent) => {
      e.preventDefault(); // 네이티브 텍스트 선택 방지
      if (e.shiftKey && anchor) {
        setFocusCell({ r, c });
      } else {
        setAnchor({ r, c });
        setFocusCell({ r, c });
      }
      draggingRef.current = true;
      setDragging(true);
    },
    [anchor]
  );

  const onCellEnter = useCallback((r: number, c: number) => {
    if (draggingRef.current) setFocusCell({ r, c });
  }, []);

  if (loading) {
    return (
      <div className='space-y-2'>
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
        <Skeleton className='h-10 w-full' />
      </div>
    );
  }

  if (error) {
    return (
      <div className='text-center py-8'>
        <p className='text-destructive mb-2'>{error}</p>
        <Button variant='outline' onClick={onRetry}>
          Retry
        </Button>
      </div>
    );
  }

  if (!data || data.length === 0) {
    return (
      <div className='text-center py-8 text-muted-foreground'>
        No data available.
      </div>
    );
  }

  const dateHeader = headers.find(isDateHeader);

  // 선택 셀 오버레이 스타일 (배경/아웃라인 — 기존 배경 위에 겹침)
  // 선택 영역 전체를 하나의 테두리로: 가장자리 셀에만 해당 방향 선을 그림
  const selOverlay = (
    r: number,
    c: number
  ): React.CSSProperties | undefined => {
    if (!bounds || !inSel(r, c)) return undefined;
    const line = 'rgba(37, 99, 235, 0.85)';
    const shadows: string[] = [];
    if (r === bounds.r0) shadows.push(`inset 0 2px 0 0 ${line}`); // 상단
    if (r === bounds.r1) shadows.push(`inset 0 -2px 0 0 ${line}`); // 하단
    if (c === bounds.c0) shadows.push(`inset 2px 0 0 0 ${line}`); // 좌측
    if (c === bounds.c1) shadows.push(`inset -2px 0 0 0 ${line}`); // 우측
    shadows.push('inset 0 0 0 9999px rgba(37, 99, 235, 0.10)'); // 내부 채움
    return { boxShadow: shadows.join(', ') };
  };

  return (
    <TooltipProvider delayDuration={150}>
      <div className='relative h-full min-h-0'>
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
                      isDateHeader(header) ? 'sticky left-0 z-30 bg-muted' : ''
                    } ${index >= 1 && index <= 4 ? 'text-center' : ''}`}
                    style={index === 0 ? { minWidth: '128px' } : undefined}
                  >
                    {header}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody className={TABLE_STYLES.body}>
              {data.map((row, rowIndex) => {
                const rowIsSunday = dateHeader
                  ? isSunday(row[dateHeader])
                  : false;
                return (
                  <TableRow
                    key={rowIndex}
                    className={
                      rowIsSunday
                        ? 'bg-gray-50 dark:bg-gray-900/30 border-b-2 border-gray-300 dark:border-gray-700'
                        : ''
                    }
                  >
                    {headers.map((header, cellIndex) => {
                      const cellValue = row[header];
                      const isDateCol = isDateHeader(header);
                      let cellClassName = 'whitespace-nowrap cursor-cell';
                      if (isDateCol) {
                        cellClassName +=
                          ' sticky left-0 z-10 bg-muted font-medium';
                      }
                      if (cellIndex >= 1 && cellIndex <= 4) {
                        cellClassName += ' text-center';
                      }

                      const overlay = selOverlay(rowIndex, cellIndex);
                      const baseStyle =
                        !isDateCol && isRoasColumn(header)
                          ? roasBgStyle(cellValue)
                          : undefined;
                      const cellStyle: React.CSSProperties | undefined =
                        baseStyle || overlay
                          ? { ...baseStyle, ...overlay }
                          : undefined;

                      const handlers = {
                        onMouseDown: (e: React.MouseEvent) =>
                          onCellDown(rowIndex, cellIndex, e),
                        onMouseEnter: () => onCellEnter(rowIndex, cellIndex),
                      };

                      // ── 날짜 셀 ──
                      if (isDateCol) {
                        const formatted = formatDateWithWeekday(cellValue);
                        const m = formatted.match(/^(.+?)\s+\((.+?)\)$/);
                        return (
                          <TableCell
                            key={cellIndex}
                            className={cellClassName}
                            style={cellStyle}
                            {...handlers}
                          >
                            {m ? (
                              <div className='flex items-center gap-2'>
                                <span className='w-24'>{m[1]}</span>
                                <span className='text-muted-foreground'>
                                  ({m[2]})
                                </span>
                              </div>
                            ) : (
                              formatted
                            )}
                          </TableCell>
                        );
                      }

                      // ── 데이터 셀 ──
                      const displayValue = isSalesHeader(header)
                        ? formatSales(cellValue)
                        : cellValue !== null && cellValue !== undefined
                        ? String(cellValue)
                        : '-';
                      const memo = getCellMemo(row, header);

                      return (
                        <TableCell
                          key={header}
                          className={cellClassName}
                          style={cellStyle}
                          {...handlers}
                        >
                          {memo ? (
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <span className='relative inline-flex items-center gap-1'>
                                  <span>
                                    {displayValue === '-' ? '' : displayValue}
                                  </span>
                                  <span
                                    aria-hidden
                                    className='h-1.5 w-1.5 rounded-full bg-amber-500 flex-shrink-0'
                                  />
                                </span>
                              </TooltipTrigger>
                              <TooltipContent
                                side='top'
                                className='max-w-xs whitespace-pre-wrap text-left'
                              >
                                {memo}
                              </TooltipContent>
                            </Tooltip>
                          ) : (
                            displayValue
                          )}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </TableWrapper>

        {/* 선택 요약 바 (스프레드시트처럼) */}
        {/* 선택 요약 — 테이블 위에 떠 있어 레이아웃을 밀지 않음 */}
        {bounds && stats && (
          <div className='pointer-events-none absolute bottom-3 left-1/2 z-40 -translate-x-1/2'>
            <div className='pointer-events-auto flex max-w-[calc(100vw-3rem)] items-center gap-3 overflow-x-auto rounded-xl border bg-background/95 px-3 py-1.5 text-xs shadow-lg backdrop-blur-sm'>
              <span className='whitespace-nowrap text-muted-foreground'>
                {stats.cellCount}칸 선택
              </span>
              {stats.count > 0 ? (
                <>
                  <span className='h-3.5 w-px flex-shrink-0 bg-border' />
                  <span className='whitespace-nowrap text-muted-foreground'>
                    개수{' '}
                    <b className='text-foreground tabular-nums'>
                      {stats.count}
                    </b>
                  </span>
                  <span className='whitespace-nowrap text-muted-foreground'>
                    합계{' '}
                    <b className='text-foreground tabular-nums'>
                      {fmt(stats.sum, stats.f)}
                    </b>
                  </span>
                  <span className='whitespace-nowrap text-muted-foreground'>
                    평균{' '}
                    <b className='text-foreground tabular-nums'>
                      {fmt(stats.avg, stats.f)}
                    </b>
                  </span>
                  <span className='whitespace-nowrap text-muted-foreground'>
                    최소{' '}
                    <b className='text-foreground tabular-nums'>
                      {fmt(stats.min, stats.f)}
                    </b>
                  </span>
                  <span className='whitespace-nowrap text-muted-foreground'>
                    최대{' '}
                    <b className='text-foreground tabular-nums'>
                      {fmt(stats.max, stats.f)}
                    </b>
                  </span>
                </>
              ) : (
                <span className='whitespace-nowrap text-muted-foreground'>
                  · 숫자 셀 없음
                </span>
              )}
              <span className='h-3.5 w-px flex-shrink-0 bg-border' />
              <button
                type='button'
                onClick={copySelection}
                className='inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                title='선택 영역 복사 (⌘C)'
              >
                <Copy className='h-3 w-3' />
                복사
              </button>
              <button
                type='button'
                onClick={clearSel}
                className='inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground'
                title='선택 해제 (Esc)'
              >
                <X className='h-3 w-3' />
                해제
              </button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
