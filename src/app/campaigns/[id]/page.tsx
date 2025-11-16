'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { toast } from 'sonner';
import {
  TargetIcon,
  RefreshCw,
  ExternalLink,
  CalendarIcon,
} from 'lucide-react';
import { AccessControl } from '@/components/access-control';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import Image from 'next/image';
import Link from 'next/link';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Skeleton } from '@/components/ui/skeleton';
import { Badge } from '@/components/ui/badge';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { TableWrapper, TABLE_STYLES } from '@/components/common/table-wrapper';
import {
  getCampaignById,
  type Campaign,
  CAMPAIGN_STATUS_OPTIONS,
  REGION_OPTIONS,
} from '@/hooks/use-campaign-management';
import {
  formatDateWithWeekday,
  isSunday,
  formatSales,
  parseSheetDate,
} from '@/lib/utils/sheet-formatters';
import { useGameInfo } from '@/hooks/use-game-info';
import { useUserManagement } from '@/hooks/use-user-management';
import { GameThumbnailTooltip } from '@/components/common/game-thumbnail-tooltip';

interface SheetData {
  [key: string]: any;
}

// Google Sheets URL에서 sheetId와 gid 추출
function extractSheetParams(
  url: string
): { sheetId: string; gid: string } | null {
  try {
    // Google Sheets URL 형식: https://docs.google.com/spreadsheets/d/{sheetId}/edit?gid={gid}#gid={gid}
    const sheetIdMatch = url.match(/\/spreadsheets\/d\/([a-zA-Z0-9-_]+)/);
    const gidMatch = url.match(/[#&]gid=(\d+)/);

    if (sheetIdMatch && gidMatch) {
      return {
        sheetId: sheetIdMatch[1],
        gid: gidMatch[1],
      };
    }

    return null;
  } catch (error) {
    console.error('URL 파싱 오류:', error);
    return null;
  }
}

export default function CampaignDetailPage() {
  const params = useParams();
  const router = useRouter();
  const campaignId = params.id as string;

  const [campaign, setCampaign] = useState<Campaign | null>(null);
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState<SheetData[] | null>(null);
  const [dataLoading, setDataLoading] = useState(false);
  const [dataError, setDataError] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<
    | {
        from: Date | undefined;
        to: Date | undefined;
      }
    | undefined
  >(undefined);
  const [tempDateRange, setTempDateRange] = useState<
    | {
        from: Date | undefined;
        to: Date | undefined;
      }
    | undefined
  >(undefined); // 임시 날짜 범위 (OK 버튼 클릭 전)
  const [isDatePickerOpen, setIsDatePickerOpen] = useState(false);
  const [lastDate, setLastDate] = useState<Date | null>(null); // 마지막 날짜 저장

  const { users: activeUsers } = useUserManagement();

  // 게임 이미지 가져오기 (캠페인 로드 후 즉시 시작)
  const { data: gameInfo, isLoading: imageLoading } = useGameInfo(
    campaign?.game_store_url || null,
    {
      enabled: !!campaign?.game_store_url,
      staleTime: 1000 * 60 * 10, // 10분 캐시
      gcTime: 1000 * 60 * 30, // 30분 가비지 컬렉션 방지
    }
  );

  const imageUrl = gameInfo?.logo_url || null;

  // 이미지 프리로드 (성능 개선)
  useEffect(() => {
    if (imageUrl) {
      const link = document.createElement('link');
      link.rel = 'preload';
      link.as = 'image';
      link.href = imageUrl;
      document.head.appendChild(link);

      return () => {
        document.head.removeChild(link);
      };
    }
  }, [imageUrl]);

  // 스토어 favicon URL 생성
  const storeFaviconUrl = useMemo(() => {
    const url = campaign?.game_store_url;
    if (!url) return null;

    if (/apps\.apple\.com|itunes\.apple\.com/i.test(url)) {
      return 'https://www.google.com/s2/favicons?domain=apps.apple.com&sz=32';
    }
    if (/play\.google\.com/i.test(url)) {
      return 'https://www.google.com/s2/favicons?domain=play.google.com&sz=32';
    }
    return null;
  }, [campaign?.game_store_url]);

  // 담당자 정보 찾기
  const assignedUser = useMemo(() => {
    if (!campaign?.assigned_user_id || !activeUsers.length) return null;
    return activeUsers.find((u) => u.id === campaign.assigned_user_id);
  }, [campaign?.assigned_user_id, activeUsers]);

  // 캠페인 정보 로드
  useEffect(() => {
    const loadCampaign = async () => {
      try {
        setLoading(true);
        const campaignData = await getCampaignById(campaignId);
        if (campaignData) {
          setCampaign(campaignData);
          // Report URL이 있으면 자동으로 데이터 가져오기 (초기 로드: 마지막 날짜 기준 30일)
          if (campaignData.daily_report_url) {
            fetchSheetData(campaignData.daily_report_url, undefined);
          }
        } else {
          toast.error('캠페인을 찾을 수 없습니다.');
          router.push('/campaigns/all');
        }
      } catch (err) {
        console.error('캠페인 로드 오류:', err);
        toast.error('캠페인을 불러올 수 없습니다.');
        router.push('/campaigns/all');
      } finally {
        setLoading(false);
      }
    };

    if (campaignId) {
      loadCampaign();
    }
  }, [campaignId, router]);

  // 날짜를 YYYY-MM-DD 형식으로 변환
  const formatDateForAPI = (date: Date): string => {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // 마지막 날짜 가져오기 (전체 데이터에서)
  const fetchLastDate = async (reportUrl: string): Promise<Date | null> => {
    try {
      const params = extractSheetParams(reportUrl);
      if (!params) {
        return null;
      }

      // 날짜 필터 없이 전체 데이터 가져오기 (마지막 날짜 확인용)
      const url = `/api/google-sheets?gid=${encodeURIComponent(
        params.gid
      )}&sheetId=${encodeURIComponent(params.sheetId)}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success || !Array.isArray(result.data)) {
        return null;
      }

      // 날짜 컬럼 찾기
      const dateHeader = Object.keys(result.data[0] || {}).find(
        (h) => h === '날짜' || h === 'date' || h.toLowerCase() === 'date'
      );

      if (!dateHeader) return null;

      // 모든 날짜 파싱 및 정렬
      const dates = result.data
        .map((row: SheetData) => parseSheetDate(row[dateHeader]))
        .filter((date: Date | null) => date !== null)
        .sort((a: Date, b: Date) => b.getTime() - a.getTime());

      return dates.length > 0 ? dates[0] : null;
    } catch (err) {
      console.error('마지막 날짜 가져오기 오류:', err);
      return null;
    }
  };

  // Google Sheets 데이터 가져오기
  const fetchSheetData = async (
    reportUrl: string,
    customDateRange?: { from: Date | undefined; to: Date | undefined }
  ) => {
    setDataLoading(true);
    setDataError(null);

    try {
      const params = extractSheetParams(reportUrl);
      if (!params) {
        throw new Error('유효하지 않은 Google Sheets URL입니다.');
      }

      // 날짜 범위 결정
      let fromDate: string | undefined;
      let toDate: string | undefined;

      if (customDateRange && (customDateRange.from || customDateRange.to)) {
        // 사용자가 선택한 날짜 범위
        if (customDateRange.from) {
          fromDate = formatDateForAPI(customDateRange.from);
        }
        if (customDateRange.to) {
          toDate = formatDateForAPI(customDateRange.to);
        }
      } else {
        // 초기 로드: 마지막 날짜 기준 30일 전
        if (!lastDate) {
          // 마지막 날짜가 없으면 먼저 가져오기
          const fetchedLastDate = await fetchLastDate(reportUrl);
          if (fetchedLastDate) {
            setLastDate(fetchedLastDate);
            const thirtyDaysAgo = new Date(fetchedLastDate);
            thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
            fromDate = formatDateForAPI(thirtyDaysAgo);
            toDate = formatDateForAPI(fetchedLastDate);
          }
        } else {
          // 마지막 날짜가 있으면 바로 계산
          const thirtyDaysAgo = new Date(lastDate);
          thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
          fromDate = formatDateForAPI(thirtyDaysAgo);
          toDate = formatDateForAPI(lastDate);
        }
      }

      // API URL 구성
      const urlParams = new URLSearchParams({
        gid: params.gid,
        sheetId: params.sheetId,
      });
      if (fromDate) {
        urlParams.append('fromDate', fromDate);
      }
      if (toDate) {
        urlParams.append('toDate', toDate);
      }

      const url = `/api/google-sheets?${urlParams.toString()}`;
      const response = await fetch(url, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        const errorMessage =
          result.error || `API 호출 실패: ${response.status}`;
        throw new Error(errorMessage);
      }

      let fetchedData: SheetData[] = [];
      if (Array.isArray(result.data)) {
        fetchedData = result.data;
      } else if (result.data && typeof result.data === 'object') {
        fetchedData = [result.data];
      }

      // 날짜 순서대로 정렬 (오래된 날짜부터)
      const dateHeader = Object.keys(fetchedData[0] || {}).find(
        (h) => h === '날짜' || h === 'date' || h.toLowerCase() === 'date'
      );
      if (dateHeader) {
        fetchedData = fetchedData.sort((a, b) => {
          const dateA = parseSheetDate(a[dateHeader]);
          const dateB = parseSheetDate(b[dateHeader]);
          if (!dateA || !dateB) return 0;
          return dateA.getTime() - dateB.getTime();
        });
      }

      setData(fetchedData);

      // 마지막 날짜 업데이트 (없는 경우)
      if (!lastDate && fetchedData.length > 0 && dateHeader) {
        const dates = fetchedData
          .map((row) => parseSheetDate(row[dateHeader]))
          .filter((date) => date !== null)
          .sort((a, b) => b!.getTime() - a!.getTime());
        if (dates.length > 0) {
          setLastDate(dates[0]!);
        }
      }

      toast.success('데이터를 성공적으로 가져왔습니다.');
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '알 수 없는 오류가 발생했습니다.';
      setDataError(errorMessage);
      toast.error(`데이터 가져오기 실패: ${errorMessage}`);
      console.error('Google Sheets 데이터 가져오기 오류:', err);
    } finally {
      setDataLoading(false);
    }
  };

  // 날짜 필터 변경 시 데이터 다시 가져오기 (초기 로드 제외)
  useEffect(() => {
    if (campaign?.daily_report_url && dateRange !== undefined) {
      // dateRange가 명시적으로 설정된 경우에만 다시 가져오기
      fetchSheetData(campaign.daily_report_url, dateRange);
    }
  }, [dateRange]);

  // 테이블 헤더 생성
  const headers = useMemo(() => {
    if (!data || data.length === 0) return [];
    return Object.keys(data[0]);
  }, [data]);

  // 상태 표시용 함수 (다른 페이지와 동일한 스타일)
  const getStatusDisplay = (status: string | null) => {
    const statusOption = CAMPAIGN_STATUS_OPTIONS.find(
      (option) => option.value === status
    );
    if (!statusOption) {
      return { label: 'Unknown', variant: 'outline' as const, color: '' };
    }

    const colorMap: Record<string, string> = {
      planning: 'text-yellow-600 dark:text-yellow-500',
      ongoing: 'text-green-600 dark:text-green-500',
      holding: 'text-red-600 dark:text-red-500',
      end: 'text-gray-500 dark:text-gray-400',
    };

    return {
      label: statusOption.label,
      variant: 'outline' as const,
      color: colorMap[status || ''] || '',
    };
  };

  // 지역 표시용 함수
  const getRegionDisplay = (region: string | null): string => {
    if (!region) return 'Unknown';

    const regionEmojiMap: Record<string, string> = {
      KR: '🇰🇷',
      JP: '🇯🇵',
      TW: '🇹🇼',
      US: '🇺🇸',
      CN: '🇨🇳',
    };

    const emoji = regionEmojiMap[region] || '';
    return emoji ? `${emoji} ${region}` : region;
  };

  if (loading) {
    return (
      <AccessControl>
        <div className='space-y-4'>
          {/* Header Skeleton */}
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-64' />
              <Skeleton className='h-4 w-96' />
            </div>
          </div>

          {/* Campaign Info Card Skeleton */}
          <Card>
            <CardContent className='p-6'>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
                {[...Array(4)].map((_, i) => (
                  <div key={i} className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-6 w-32' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Data Table Skeleton */}
          <Card>
            <CardContent className='p-6'>
              <Skeleton className='h-96 w-full' />
            </CardContent>
          </Card>
        </div>
      </AccessControl>
    );
  }

  if (!campaign) {
    return (
      <AccessControl>
        <div className='space-y-4'>
          <Card>
            <CardContent className='pt-6'>
              <p className='text-center text-muted-foreground'>
                캠페인을 찾을 수 없습니다.
              </p>
            </CardContent>
          </Card>
        </div>
      </AccessControl>
    );
  }

  return (
    <AccessControl>
      <div className='space-y-4 w-full overflow-x-hidden'>
        {/* Header */}
        <div className='flex items-center justify-between'>
          <div>
            <h1 className='text-3xl font-bold tracking-tight flex items-center gap-3'>
              <TargetIcon className='h-8 w-8 text-primary' />
              Campaign Detail
            </h1>
            <p className='text-muted-foreground'>
              View and manage campaign details
            </p>
          </div>
        </div>

        {/* Campaign Overview Card */}
        <Card>
          <CardHeader className='pb-4'>
            <div className='flex items-center justify-between'>
              <div>
                <CardTitle className='text-xl font-bold'>
                  {campaign.name}
                </CardTitle>
                <div className='flex items-center gap-3 mt-0.5'>
                  <p className='text-sm text-muted-foreground'>
                    {campaign.start_date} - {campaign.end_date || '-'}
                  </p>
                  <span className='text-sm text-muted-foreground'>•</span>
                  <p className='text-sm text-muted-foreground'>
                    {getRegionDisplay(campaign.region)}
                  </p>
                  {assignedUser && (
                    <>
                      <span className='text-sm text-muted-foreground'>•</span>
                      <div className='flex items-center gap-2'>
                        <Avatar className='h-4 w-4'>
                          {assignedUser.avatar_url ? (
                            <AvatarImage
                              src={assignedUser.avatar_url}
                              alt={
                                assignedUser.display_name ||
                                assignedUser.email ||
                                'User'
                              }
                            />
                          ) : null}
                          <AvatarFallback className='text-xs'>
                            {assignedUser.display_name
                              ? assignedUser.display_name
                                  .charAt(0)
                                  .toUpperCase()
                              : assignedUser.email
                              ? assignedUser.email.charAt(0).toUpperCase()
                              : 'U'}
                          </AvatarFallback>
                        </Avatar>
                        <span className='text-sm text-muted-foreground'>
                          {assignedUser.display_name ||
                            assignedUser.email ||
                            'Unassigned'}
                        </span>
                      </div>
                    </>
                  )}
                </div>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className='grid gap-4 md:grid-cols-3'>
              <div>
                <p className='text-sm text-muted-foreground mb-1'>Account</p>
                {campaign.account_id && campaign.account_company ? (
                  <Link
                    href={`/accounts/${campaign.account_id}`}
                    className='font-medium text-primary hover:underline inline'
                  >
                    {campaign.account_company}
                  </Link>
                ) : (
                  <p className='font-medium'>
                    {campaign.account_company || '-'}
                  </p>
                )}
              </div>
              <div>
                <p className='text-sm text-muted-foreground mb-1'>Game</p>
                {campaign.game_store_url ? (
                  <div className='flex items-center gap-2'>
                    {imageLoading ? (
                      <div className='w-6 h-6 rounded-lg border border-border bg-muted flex items-center justify-center animate-pulse flex-shrink-0'>
                        <span className='text-[8px] text-muted-foreground'>
                          ...
                        </span>
                      </div>
                    ) : imageUrl ? (
                      <div className='w-6 h-6 rounded-lg border border-border overflow-hidden flex items-center justify-center bg-muted flex-shrink-0'>
                        <Image
                          src={imageUrl}
                          alt={campaign.game_name || 'Game'}
                          width={24}
                          height={24}
                          className='max-w-full max-h-full w-auto h-auto object-contain'
                          unoptimized
                          loading='lazy'
                        />
                      </div>
                    ) : (
                      <div className='w-6 h-6 rounded-lg border border-border bg-muted flex items-center justify-center flex-shrink-0'>
                        <span className='text-[8px] text-muted-foreground'>
                          -
                        </span>
                      </div>
                    )}
                    <GameThumbnailTooltip
                      imageUrl={imageUrl}
                      gameName={campaign.game_name || null}
                      packageIdentifier={
                        campaign.game_package_identifier || null
                      }
                      storeUrl={campaign.game_store_url || null}
                      storeFaviconUrl={storeFaviconUrl || null}
                      enableCopy={true}
                    >
                      <span className='font-medium hover:text-primary cursor-pointer'>
                        {campaign.game_name || '-'}
                      </span>
                    </GameThumbnailTooltip>
                  </div>
                ) : (
                  <p className='font-medium'>{campaign.game_name || '-'}</p>
                )}
              </div>
              <div>
                <p className='text-sm text-muted-foreground mb-1'>Status</p>
                <Badge
                  variant={getStatusDisplay(campaign.status).variant}
                  className={`inline-flex items-center justify-center min-w-[70px] font-medium ${
                    getStatusDisplay(campaign.status).color
                  }`}
                >
                  {getStatusDisplay(campaign.status).label}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Report Data */}
        {campaign.daily_report_url ? (
          <div>
            <div className='mb-4'>
              <div className='flex items-center justify-between'>
                <div>
                  <h3 className='text-lg font-semibold'>Report Data</h3>
                  <p className='text-sm text-muted-foreground'>
                    Data fetched from Google Sheets
                  </p>
                </div>
                <div className='flex items-center gap-2'>
                  {/* 날짜 필터 */}
                  <Popover
                    open={isDatePickerOpen}
                    onOpenChange={(open) => {
                      setIsDatePickerOpen(open);
                      // Popover가 열릴 때 현재 dateRange를 tempDateRange로 복사
                      if (open) {
                        setTempDateRange(dateRange);
                      }
                    }}
                  >
                    <PopoverTrigger asChild>
                      <Button
                        variant='outline'
                        size='sm'
                        className='w-auto justify-start text-left font-normal flex-shrink-0 max-[1100px]:justify-center'
                      >
                        <CalendarIcon className='h-4 w-4 max-[1100px]:mr-0 mr-2' />
                        <span className='max-[1100px]:hidden'>
                          {dateRange?.from !== undefined &&
                          dateRange?.to !== undefined
                            ? `${dateRange.from.toLocaleDateString(
                                'ko-KR'
                              )} - ${dateRange.to.toLocaleDateString('ko-KR')}`
                            : dateRange?.from !== undefined
                            ? `${dateRange.from.toLocaleDateString(
                                'ko-KR'
                              )} - ...`
                            : 'Select Date Range'}
                        </span>
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className='w-auto p-0' align='start'>
                      <Calendar
                        mode='range'
                        selected={tempDateRange}
                        onSelect={(range) => {
                          setTempDateRange(
                            range as
                              | {
                                  from: Date | undefined;
                                  to: Date | undefined;
                                }
                              | undefined
                          );
                        }}
                        numberOfMonths={2}
                        initialFocus
                        showOutsideDays={false}
                      />
                      <div className='p-3 border-t flex items-center justify-between gap-2'>
                        <Button
                          variant='ghost'
                          size='sm'
                          className='flex-1'
                          onClick={() => {
                            setTempDateRange(undefined);
                            setDateRange(undefined);
                            setIsDatePickerOpen(false);
                          }}
                        >
                          Reset
                        </Button>
                        <Button
                          variant='default'
                          size='sm'
                          className='flex-1'
                          onClick={() => {
                            // 시작 날짜와 끝 날짜가 모두 선택되었을 때만 적용
                            if (
                              tempDateRange?.from !== undefined &&
                              tempDateRange?.to !== undefined
                            ) {
                              setDateRange(tempDateRange);
                              setIsDatePickerOpen(false);
                            }
                          }}
                          disabled={!tempDateRange?.from || !tempDateRange?.to}
                        >
                          Apply
                        </Button>
                      </div>
                    </PopoverContent>
                  </Popover>
                  <Button
                    variant='outline'
                    size='sm'
                    className='flex-shrink-0'
                    onClick={() => {
                      const url = campaign.daily_report_url!;
                      window.open(url, '_blank');
                    }}
                  >
                    <ExternalLink className='h-4 w-4 max-[1100px]:mr-0 mr-2' />
                    <span className='max-[1100px]:hidden'>View Sheet</span>
                  </Button>
                  <Button
                    variant='default'
                    size='sm'
                    className='bg-black text-white hover:bg-black/90 flex-shrink-0'
                    onClick={() =>
                      fetchSheetData(campaign.daily_report_url!, dateRange)
                    }
                    disabled={dataLoading}
                  >
                    <RefreshCw
                      className={`h-4 w-4 max-[1100px]:mr-0 mr-2 ${
                        dataLoading ? 'animate-spin' : ''
                      }`}
                    />
                    <span className='max-[1100px]:hidden'>Refresh</span>
                  </Button>
                </div>
              </div>
            </div>
            <div>
              {dataLoading ? (
                <div className='space-y-2'>
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                  <Skeleton className='h-10 w-full' />
                </div>
              ) : dataError ? (
                <div className='text-center py-8'>
                  <p className='text-destructive mb-2'>{dataError}</p>
                  <Button
                    variant='outline'
                    onClick={() =>
                      fetchSheetData(campaign.daily_report_url!, dateRange)
                    }
                  >
                    다시 시도
                  </Button>
                </div>
              ) : !data || data.length === 0 ? (
                <div className='text-center py-8 text-muted-foreground'>
                  데이터가 없습니다.
                </div>
              ) : (
                <TableWrapper>
                  <Table style={{ tableLayout: 'fixed', width: '100%' }}>
                    <TableHeader className={TABLE_STYLES.header}>
                      <TableRow>
                        {headers.map((header, index) => (
                          <TableHead
                            key={header}
                            className={`whitespace-nowrap ${
                              index >= 1 && index <= 4 ? 'text-center' : ''
                            }`}
                            style={index === 0 ? { width: '128px' } : undefined}
                          >
                            {header}
                          </TableHead>
                        ))}
                      </TableRow>
                    </TableHeader>
                    <TableBody className={TABLE_STYLES.body}>
                      {data.map((row, rowIndex) => {
                        // 날짜 컬럼 찾기
                        const dateHeader = headers.find(
                          (h) =>
                            h === '날짜' ||
                            h === 'date' ||
                            h.toLowerCase() === 'date'
                        );
                        const isRowSunday = dateHeader
                          ? isSunday(row[dateHeader])
                          : false;

                        return (
                          <TableRow
                            key={rowIndex}
                            className={
                              isRowSunday
                                ? 'bg-gray-50 dark:bg-gray-900/30'
                                : ''
                            }
                          >
                            {headers.map((header, cellIndex) => {
                              const cellValue = row[header];
                              let displayValue: string;
                              let cellClassName = 'whitespace-nowrap';

                              // 날짜 컬럼 처리
                              if (
                                header === '날짜' ||
                                header === 'date' ||
                                header.toLowerCase() === 'date'
                              ) {
                                // 날짜와 요일을 분리하여 표시
                                const formatted =
                                  formatDateWithWeekday(cellValue);
                                const dateMatch =
                                  formatted.match(/^(.+?)\s+\((.+?)\)$/);
                                if (dateMatch) {
                                  const [, datePart, weekdayPart] = dateMatch;
                                  return (
                                    <TableCell
                                      key={cellIndex}
                                      className={cellClassName}
                                    >
                                      <div className='flex items-center gap-2'>
                                        <span className='w-24'>{datePart}</span>
                                        <span className='text-muted-foreground'>
                                          ({weekdayPart})
                                        </span>
                                      </div>
                                    </TableCell>
                                  );
                                }
                                displayValue = formatted;
                              }
                              // 매출(누적) 컬럼 처리
                              else if (
                                header === '매출(누적)' ||
                                header === '매출' ||
                                header.toLowerCase().includes('매출') ||
                                header.toLowerCase().includes('sales')
                              ) {
                                displayValue = formatSales(cellValue);
                              }
                              // 기본 처리
                              else {
                                displayValue =
                                  cellValue !== null && cellValue !== undefined
                                    ? String(cellValue)
                                    : '-';
                              }

                              // 중앙 정렬 설정
                              if (cellIndex >= 1 && cellIndex <= 4) {
                                cellClassName += ' text-center';
                              }

                              return (
                                <TableCell
                                  key={header}
                                  className={cellClassName}
                                >
                                  {displayValue}
                                </TableCell>
                              );
                            })}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </TableWrapper>
              )}
            </div>
          </div>
        ) : (
          <Card>
            <CardContent className='pt-6'>
              <p className='text-center text-muted-foreground'>
                Report URL이 설정되지 않았습니다.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </AccessControl>
  );
}
