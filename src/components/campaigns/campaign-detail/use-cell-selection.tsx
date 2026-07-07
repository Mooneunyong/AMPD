'use client';

import * as React from 'react';
import {
  useCallback,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { toast } from 'sonner';
import { Check, Copy, X } from 'lucide-react';

interface Cell {
  r: number;
  c: number;
}

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

export interface CellSelectionApi {
  /** 스크롤 컨테이너(relative)에 부착할 ref */
  containerRef: React.RefObject<HTMLDivElement>;
  /** 드래그 중 여부 (테이블에 select-none 적용용) */
  dragging: boolean;
  /** 각 셀에 스프레드할 props (data-cell + 마우스 핸들러) */
  cellProps: (r: number, c: number) => {
    'data-cell': string;
    onMouseDown: (e: React.MouseEvent) => void;
    onMouseEnter: () => void;
  };
  /** 선택 오버레이 스타일 (기존 셀 스타일 위에 merge) */
  selectionStyle: (r: number, c: number) => React.CSSProperties | undefined;
  /** 컨테이너 안에 렌더할 플로팅 요약 칩 (선택 없으면 null) */
  chip: React.ReactNode;
}

/**
 * 스프레드시트식 셀 선택 + 집계(합계/평균/최소/최대) + 복사.
 * data[r][headers[c]] 로 셀 값에 접근한다. 여러 테이블에서 공용으로 사용.
 */
export function useCellSelection(
  data: Record<string, unknown>[],
  headers: string[]
): CellSelectionApi {
  const [anchor, setAnchor] = useState<Cell | null>(null);
  const [focusCell, setFocusCell] = useState<Cell | null>(null);
  const [dragging, setDragging] = useState(false);
  const draggingRef = useRef(false);

  // 플로팅 요약 칩 위치 (선택 영역을 따라감)
  const containerRef = useRef<HTMLDivElement>(null);
  const chipRef = useRef<HTMLDivElement>(null);
  const [chipPos, setChipPos] = useState<{ top: number; left: number } | null>(
    null
  );

  // 복사 피드백: 방금 복사한 버튼 키 (label 또는 '__range__')
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const copiedTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flashCopied = useCallback((key: string) => {
    setCopiedKey(key);
    if (copiedTimer.current) clearTimeout(copiedTimer.current);
    copiedTimer.current = setTimeout(() => setCopiedKey(null), 1100);
  }, []);
  useEffect(
    () => () => {
      if (copiedTimer.current) clearTimeout(copiedTimer.current);
    },
    []
  );

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
      .then(() => flashCopied('__range__'))
      .catch(() => toast.error('복사 실패'));
  }, [bounds, data, headers, flashCopied]);

  // 단일 집계값 복사 (개수/합계/평균/최소/최대 클릭 시)
  const copyValue = useCallback(
    (label: string, text: string) => {
      navigator.clipboard
        .writeText(text)
        .then(() => flashCopied(label))
        .catch(() => toast.error('복사 실패'));
    },
    [flashCopied]
  );

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

  // 선택 영역을 따라 요약 칩 위치 계산
  // - 세로: 선택 하단 바로 아래 (공간 부족 시 선택 위로 뒤집기)
  // - 가로: 선택 영역 왼쪽 끝에서 시작 (왼쪽 정렬)
  // - 컨테이너 밖으로 나가지 않도록 클램프
  const recomputeChip = useCallback(() => {
    const container = containerRef.current;
    if (!container || !bounds) {
      setChipPos(null);
      return;
    }
    const blEl = container.querySelector<HTMLElement>(
      `[data-cell="${bounds.r1}-${bounds.c0}"]`
    );
    const tlEl = container.querySelector<HTMLElement>(
      `[data-cell="${bounds.r0}-${bounds.c0}"]`
    );
    if (!blEl || !tlEl) {
      setChipPos(null);
      return;
    }
    const cRect = container.getBoundingClientRect();
    const blRect = blEl.getBoundingClientRect();
    const tlRect = tlEl.getBoundingClientRect();
    const chipW = chipRef.current?.offsetWidth ?? 340;
    const chipH = chipRef.current?.offsetHeight ?? 34;
    const pad = 8;
    const gap = 6;

    const below = blRect.bottom - cRect.top + gap;
    const above = tlRect.top - cRect.top - chipH - gap;
    let top: number;
    if (below + chipH + pad <= cRect.height) top = below;
    else if (above >= pad) top = above;
    else top = cRect.height - chipH - pad;
    top = Math.min(Math.max(pad, top), cRect.height - chipH - pad);

    let left = blRect.left - cRect.left;
    left = Math.min(Math.max(pad, left), cRect.width - chipW - pad);
    if (!Number.isFinite(left)) left = pad;

    setChipPos({ top, left });
  }, [bounds]);

  useLayoutEffect(() => {
    recomputeChip();
  }, [recomputeChip, data]);

  // 스크롤/리사이즈 시 칩이 선택을 따라오도록 재계산
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;
    const handler = () => recomputeChip();
    container.addEventListener('scroll', handler, true);
    window.addEventListener('resize', handler);
    return () => {
      container.removeEventListener('scroll', handler, true);
      window.removeEventListener('resize', handler);
    };
  }, [recomputeChip]);

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
      e.preventDefault();
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

  const cellProps = useCallback(
    (r: number, c: number) => ({
      'data-cell': `${r}-${c}`,
      onMouseDown: (e: React.MouseEvent) => onCellDown(r, c, e),
      onMouseEnter: () => onCellEnter(r, c),
    }),
    [onCellDown, onCellEnter]
  );

  // 선택 오버레이: 가장자리 셀에만 방향 선 + 내부 채움
  const selectionStyle = useCallback(
    (r: number, c: number): React.CSSProperties | undefined => {
      if (!bounds || !inSel(r, c)) return undefined;
      const line = 'rgba(37, 99, 235, 0.85)';
      const shadows: string[] = [];
      if (r === bounds.r0) shadows.push(`inset 0 2px 0 0 ${line}`);
      if (r === bounds.r1) shadows.push(`inset 0 -2px 0 0 ${line}`);
      if (c === bounds.c0) shadows.push(`inset 2px 0 0 0 ${line}`);
      if (c === bounds.c1) shadows.push(`inset -2px 0 0 0 ${line}`);
      shadows.push('inset 0 0 0 9999px rgba(37, 99, 235, 0.10)');
      return { boxShadow: shadows.join(', ') };
    },
    [bounds, inSel]
  );

  const chip =
    bounds && stats && chipPos ? (
      <div
        className='pointer-events-none absolute z-40'
        style={{ top: chipPos.top, left: chipPos.left }}
      >
        <div
          ref={chipRef}
          className={`flex max-w-[calc(100vw-3rem)] items-center gap-3 overflow-x-auto rounded-xl bg-foreground px-3 py-1.5 text-xs text-background shadow-lg ${
            dragging ? 'pointer-events-none' : 'pointer-events-auto'
          }`}
        >
          <span className='whitespace-nowrap text-background/60'>
            {stats.cellCount}칸 선택
          </span>
          {stats.count > 0 ? (
            <>
              <span className='h-3.5 w-px flex-shrink-0 bg-background/25' />
              {(
                [
                  ['개수', String(stats.count)],
                  ['합계', fmt(stats.sum, stats.f)],
                  ['평균', fmt(stats.avg, stats.f)],
                  ['최소', fmt(stats.min, stats.f)],
                  ['최대', fmt(stats.max, stats.f)],
                ] as const
              ).map(([label, value]) => {
                const copied = copiedKey === label;
                return (
                  <button
                    key={label}
                    type='button'
                    onClick={() => copyValue(label, value)}
                    className='group inline-grid flex-shrink-0 place-items-center rounded-md px-1.5 py-0.5 transition-colors hover:bg-background/15'
                    title={`클릭하여 ${label} 복사 · ${value}`}
                  >
                    <span
                      style={{ gridArea: '1 / 1' }}
                      className={`inline-flex items-center gap-1 whitespace-nowrap text-background/60 transition-all duration-200 group-hover:text-background ${
                        copied ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
                      }`}
                    >
                      {label}{' '}
                      <b className='text-background tabular-nums'>{value}</b>
                    </span>
                    <span
                      style={{ gridArea: '1 / 1' }}
                      aria-hidden={!copied}
                      className={`inline-flex items-center gap-1 whitespace-nowrap text-emerald-400 transition-all duration-200 ${
                        copied ? 'scale-100 opacity-100' : 'scale-95 opacity-0'
                      }`}
                    >
                      <Check className='h-3 w-3' />
                      복사됨
                    </span>
                  </button>
                );
              })}
            </>
          ) : (
            <span className='whitespace-nowrap text-background/60'>
              · 숫자 셀 없음
            </span>
          )}
          <span className='h-3.5 w-px flex-shrink-0 bg-background/25' />
          <button
            type='button'
            onClick={copySelection}
            className='inline-grid flex-shrink-0 place-items-center rounded-md px-1.5 py-0.5 text-background/70 transition-colors hover:bg-background/15 hover:text-background'
            title='선택 영역 복사 (⌘C)'
          >
            <span
              style={{ gridArea: '1 / 1' }}
              className={`inline-flex items-center gap-1 whitespace-nowrap transition-all duration-200 ${
                copiedKey === '__range__'
                  ? 'scale-95 opacity-0'
                  : 'scale-100 opacity-100'
              }`}
            >
              <Copy className='h-3 w-3' />
              복사
            </span>
            <span
              style={{ gridArea: '1 / 1' }}
              aria-hidden={copiedKey !== '__range__'}
              className={`inline-flex items-center gap-1 whitespace-nowrap text-emerald-400 transition-all duration-200 ${
                copiedKey === '__range__'
                  ? 'scale-100 opacity-100'
                  : 'scale-95 opacity-0'
              }`}
            >
              <Check className='h-3 w-3' />
              복사됨
            </span>
          </button>
          <button
            type='button'
            onClick={clearSel}
            className='inline-flex flex-shrink-0 items-center gap-1 rounded-md px-1.5 py-0.5 text-background/70 transition-colors hover:bg-background/15 hover:text-background'
            title='선택 해제 (Esc)'
          >
            <X className='h-3 w-3' />
            해제
          </button>
        </div>
      </div>
    ) : null;

  return { containerRef, dragging, cellProps, selectionStyle, chip };
}
