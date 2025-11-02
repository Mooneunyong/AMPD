'use client';

import { useState, useEffect } from 'react';
import * as React from 'react';
import { toast } from 'sonner';
import { Loader2, CalendarIcon } from 'lucide-react';
import Image from 'next/image';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { useQueries } from '@tanstack/react-query';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type {
  Campaign,
  CampaignFormData,
} from '@/hooks/use-campaign-management';
import {
  CAMPAIGN_STATUS_OPTIONS,
  CAMPAIGN_TYPE_OPTIONS,
  MMP_OPTIONS,
  REGION_OPTIONS,
} from '@/hooks/use-campaign-management';
import type { Game } from '@/hooks/use-game-management';
import { PLATFORM_OPTIONS } from '@/hooks/use-game-management';

interface EditCampaignFormProps {
  isOpen: boolean;
  onClose: () => void;
  onUpdateCampaign: (
    campaignId: string,
    campaignData: Partial<CampaignFormData>
  ) => Promise<any>;
  campaign: Campaign | null;
  accountId: string;
  games: Game[];
}

export function EditCampaignForm({
  isOpen,
  onClose,
  onUpdateCampaign,
  campaign,
  accountId,
  games,
}: EditCampaignFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [editedCampaign, setEditedCampaign] = useState<CampaignFormData>({
    account_id: accountId,
    game_id: null,
    name: '',
    description: null,
    region: 'KR',
    mmp: 'Adjust',
    campaign_type: 'CPI',
    start_date: '',
    end_date: '',
    status: 'planning',
    jira_url: null,
    daily_report_url: null,
  });

  // TanStack Query로 모든 게임 이미지 가져오기
  const gameImageQueries = useQueries({
    queries: games.map((game) => ({
      queryKey: ['game-info', game.store_url],
      queryFn: async () => {
        if (!game.store_url) return { logo_url: null };
        const response = await fetch('/api/fetch-game-info', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: game.store_url }),
        });
        if (!response.ok) return { logo_url: null };
        const result = await response.json();
        return result.data || { logo_url: null };
      },
      enabled: !!game.store_url,
      staleTime: 1000 * 60 * 5,
      gcTime: 1000 * 60 * 10,
      retry: 1,
    })),
  });

  // 게임 이미지 맵 생성
  const gameImages = React.useMemo(() => {
    const imageMap: Record<string, string | null> = {};
    games.forEach((game, index) => {
      const query = gameImageQueries[index];
      if (query?.data?.logo_url) {
        imageMap[game.id] = query.data.logo_url;
      } else {
        imageMap[game.id] = null;
      }
    });
    return imageMap;
  }, [games, gameImageQueries]);

  // 선택된 게임 이미지
  const selectedGameImage = React.useMemo(() => {
    if (editedCampaign.game_id && gameImages[editedCampaign.game_id]) {
      return gameImages[editedCampaign.game_id];
    }
    return null;
  }, [editedCampaign.game_id, gameImages]);

  // Dialog가 열릴 때 캠페인 데이터로 폼 초기화
  useEffect(() => {
    if (isOpen && campaign) {
      setEditedCampaign({
        account_id: campaign.account_id,
        game_id: campaign.game_id || null,
        name: campaign.name,
        description: campaign.description || null,
        region: campaign.region,
        mmp: campaign.mmp,
        campaign_type: campaign.campaign_type,
        start_date: campaign.start_date,
        end_date: campaign.end_date,
        status: campaign.status,
        jira_url: campaign.jira_url || null,
        daily_report_url: campaign.daily_report_url || null,
      });
    }
  }, [isOpen, campaign]);

  const validateForm = (): boolean => {
    if (!editedCampaign.name.trim()) {
      toast.error('Please enter campaign name.');
      return false;
    }

    if (!editedCampaign.game_id) {
      toast.error('Please select a game.');
      return false;
    }

    if (!editedCampaign.start_date) {
      toast.error('Please select start date.');
      return false;
    }

    if (!editedCampaign.end_date) {
      toast.error('Please select end date.');
      return false;
    }

    if (
      new Date(editedCampaign.start_date) >
      new Date(editedCampaign.end_date)
    ) {
      toast.error('End date must be after start date.');
      return false;
    }

    return true;
  };

  const handleUpdateCampaign = async () => {
    if (!campaign) return;
    if (!validateForm()) return;

    try {
      setIsSubmitting(true);

      const campaignData: Partial<CampaignFormData> = {
        game_id: editedCampaign.game_id,
        name: editedCampaign.name.trim(),
        description: editedCampaign.description?.trim() || null,
        region: editedCampaign.region,
        mmp: editedCampaign.mmp,
        campaign_type: editedCampaign.campaign_type,
        start_date: editedCampaign.start_date,
        end_date: editedCampaign.end_date,
        status: editedCampaign.status,
        jira_url: editedCampaign.jira_url?.trim() || null,
        daily_report_url: editedCampaign.daily_report_url?.trim() || null,
      };

      await onUpdateCampaign(campaign.id, campaignData);
      // 토스트는 onUpdateCampaign에서 표시하므로 여기서는 중복 표시하지 않음
      onClose();
    } catch (error) {
      // 에러는 이미 onUpdateCampaign에서 처리되었을 수 있으므로
      // 여기서 추가 에러 처리는 하지 않음
      throw error;
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!campaign) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className='max-w-2xl max-h-[90vh] overflow-y-auto'>
        <DialogHeader>
          <DialogTitle>Edit Campaign</DialogTitle>
          <DialogDescription>
            Update the campaign information. Please fill in all required fields.
          </DialogDescription>
        </DialogHeader>

        <div className='space-y-4 py-4'>
          {/* Campaign Name */}
          <div className='space-y-2'>
            <Label htmlFor='edit-campaign-name'>
              Campaign Name <span className='text-red-500'>*</span>
            </Label>
            <Input
              id='edit-campaign-name'
              placeholder='Enter campaign name'
              value={editedCampaign.name}
              onChange={(e) =>
                setEditedCampaign({ ...editedCampaign, name: e.target.value })
              }
              autoComplete='off'
            />
          </div>

          {/* Game Selection */}
          <div className='space-y-2'>
            <Label htmlFor='edit-game'>
              Game <span className='text-red-500'>*</span>
            </Label>
            <Select
              value={editedCampaign.game_id || ''}
              onValueChange={(value) =>
                setEditedCampaign({
                  ...editedCampaign,
                  game_id: value,
                })
              }
            >
              <SelectTrigger id='edit-game' className='w-full'>
                <div className='flex items-center gap-2 flex-1 w-full'>
                  {selectedGameImage && (
                    <Image
                      src={selectedGameImage}
                      alt={
                        games.find((g) => g.id === editedCampaign.game_id)
                          ?.game_name || 'Game'
                      }
                      width={20}
                      height={20}
                      className='rounded-lg object-contain'
                      unoptimized
                    />
                  )}
                  {editedCampaign.game_id ? (
                    (() => {
                      const selectedGame = games.find(
                        (g) => g.id === editedCampaign.game_id
                      );
                      const platformLabel =
                        PLATFORM_OPTIONS.find(
                          (opt) => opt.value === selectedGame?.platform
                        )?.label || selectedGame?.platform || '';
                      return (
                        <>
                          <span className='flex-1 text-left truncate'>
                            {selectedGame?.game_name || 'Select a game'}
                          </span>
                          {platformLabel && (
                            <span className='text-xs text-muted-foreground flex-shrink-0'>
                              {platformLabel}
                            </span>
                          )}
                        </>
                      );
                    })()
                  ) : (
                    <span className='flex-1 text-left'>Select a game</span>
                  )}
                </div>
              </SelectTrigger>
              <SelectContent>
                {games.map((game) => (
                  <SelectItem key={game.id} value={game.id} className='w-full'>
                    <div className='flex items-center gap-2 w-full pr-0'>
                      {gameImages[game.id] ? (
                        <Image
                          src={gameImages[game.id]!}
                          alt={game.game_name}
                          width={20}
                          height={20}
                          className='rounded-lg object-contain flex-shrink-0'
                          unoptimized
                        />
                      ) : (
                        <div className='w-5 h-5 rounded-lg bg-muted flex items-center justify-center flex-shrink-0'>
                          <span className='text-xs text-muted-foreground'>
                            ?
                          </span>
                        </div>
                      )}
                      <span className='truncate flex-1'>{game.game_name}</span>
                      {(() => {
                        const platformLabel =
                          PLATFORM_OPTIONS.find(
                            (opt) => opt.value === game.platform
                          )?.label || game.platform || '';
                        return (
                          <span className='text-xs text-muted-foreground flex-shrink-0 ml-auto'>
                            {platformLabel}
                          </span>
                        );
                      })()}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Region and MMP */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-region'>
                Region <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={editedCampaign.region}
                onValueChange={(value) =>
                  setEditedCampaign({ ...editedCampaign, region: value })
                }
              >
                <SelectTrigger id='edit-region'>
                  <SelectValue>
                    {(() => {
                      const regionOption = REGION_OPTIONS.find(
                        (opt) => opt.value === editedCampaign.region
                      );
                      const regionEmojiMap: Record<string, string> = {
                        KR: '🇰🇷',
                        JP: '🇯🇵',
                        TW: '🇹🇼',
                        US: '🇺🇸',
                      };
                      const emoji = regionEmojiMap[editedCampaign.region] || '';
                      return regionOption
                        ? `${emoji} ${regionOption.label}`
                        : '';
                    })()}
                  </SelectValue>
                </SelectTrigger>
                <SelectContent>
                  {REGION_OPTIONS.map((option) => {
                    const regionEmojiMap: Record<string, string> = {
                      KR: '🇰🇷',
                      JP: '🇯🇵',
                      TW: '🇹🇼',
                      US: '🇺🇸',
                    };
                    const emoji = regionEmojiMap[option.value] || '';
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        {emoji} {option.label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-mmp'>
                MMP <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={editedCampaign.mmp}
                onValueChange={(value) =>
                  setEditedCampaign({ ...editedCampaign, mmp: value })
                }
              >
                <SelectTrigger id='edit-mmp' className='w-full'>
                  <div className='flex items-center gap-2 flex-1'>
                    {editedCampaign.mmp === 'Adjust' && (
                      <div className='flex items-center justify-center w-5 h-5'>
                        <Image
                          src='/Adjust Logo.svg'
                          alt='Adjust'
                          width={20}
                          height={20}
                          className='object-contain'
                          unoptimized
                        />
                      </div>
                    )}
                    {editedCampaign.mmp === 'AppsFlyer' && (
                      <div className='flex items-center justify-center w-5 h-5'>
                        <Image
                          src='/AppsFlyer Logo.svg'
                          alt='AppsFlyer'
                          width={20}
                          height={20}
                          className='object-contain'
                          style={{ width: 'auto', height: 'auto' }}
                          unoptimized
                        />
                      </div>
                    )}
                    <span className='flex-1 text-left'>
                      {MMP_OPTIONS.find((opt) => opt.value === editedCampaign.mmp)
                        ?.label || 'Select MMP'}
                    </span>
                  </div>
                </SelectTrigger>
                <SelectContent>
                  {MMP_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className='flex items-center gap-2'>
                        {option.value === 'Adjust' && (
                          <div className='flex items-center justify-center w-5 h-5'>
                            <Image
                              src='/Adjust Logo.svg'
                              alt='Adjust'
                              width={20}
                              height={20}
                              className='object-contain'
                              unoptimized
                            />
                          </div>
                        )}
                        {option.value === 'AppsFlyer' && (
                          <div className='flex items-center justify-center w-5 h-5'>
                            <Image
                              src='/AppsFlyer Logo.svg'
                              alt='AppsFlyer'
                              width={20}
                              height={20}
                              className='object-contain'
                              style={{ width: 'auto', height: 'auto' }}
                              unoptimized
                            />
                          </div>
                        )}
                        <span>{option.label}</span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Campaign Type and Status */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-campaign-type'>
                Campaign Type <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={editedCampaign.campaign_type}
                onValueChange={(value) =>
                  setEditedCampaign({ ...editedCampaign, campaign_type: value })
                }
              >
                <SelectTrigger id='edit-campaign-type'>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_TYPE_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-status'>
                Status <span className='text-red-500'>*</span>
              </Label>
              <Select
                value={editedCampaign.status}
                onValueChange={(value) =>
                  setEditedCampaign({ ...editedCampaign, status: value })
                }
              >
                <SelectTrigger id='edit-status'>
                  <span
                    className={
                      editedCampaign.status === 'planning'
                        ? 'text-yellow-600 dark:text-yellow-500'
                        : editedCampaign.status === 'ongoing'
                          ? 'text-green-600 dark:text-green-500'
                          : editedCampaign.status === 'holding'
                            ? 'text-red-600 dark:text-red-500'
                            : editedCampaign.status === 'end'
                              ? 'text-gray-500 dark:text-gray-400'
                              : ''
                    }
                  >
                    {CAMPAIGN_STATUS_OPTIONS.find(
                      (opt) => opt.value === editedCampaign.status
                    )?.label || 'Select status'}
                  </span>
                </SelectTrigger>
                <SelectContent>
                  {CAMPAIGN_STATUS_OPTIONS.map((option) => {
                    const getStatusColor = (status: string) => {
                      switch (status) {
                        case 'planning':
                          return 'text-yellow-600 dark:text-yellow-500';
                        case 'ongoing':
                          return 'text-green-600 dark:text-green-500';
                        case 'holding':
                          return 'text-red-600 dark:text-red-500';
                        case 'end':
                          return 'text-gray-500 dark:text-gray-400';
                        default:
                          return '';
                      }
                    };
                    return (
                      <SelectItem key={option.value} value={option.value}>
                        <span className={getStatusColor(option.value)}>
                          {option.label}
                        </span>
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Start Date and End Date */}
          <div className='grid grid-cols-2 gap-4'>
            <div className='space-y-2'>
              <Label htmlFor='edit-start-date'>
                Start Date <span className='text-red-500'>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id='edit-start-date'
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                  >
                    <span className='flex-1 text-left'>
                      {editedCampaign.start_date
                        ? (() => {
                            const date = new Date(editedCampaign.start_date);
                            const year = date.getFullYear();
                            const month = String(
                              date.getMonth() + 1
                            ).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}/${month}/${day}`;
                          })()
                        : 'Select start date'}
                    </span>
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    captionLayout='dropdown'
                    selected={
                      editedCampaign.start_date
                        ? new Date(editedCampaign.start_date)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          '0'
                        );
                        const day = String(date.getDate()).padStart(2, '0');
                        setEditedCampaign({
                          ...editedCampaign,
                          start_date: `${year}-${month}-${day}`,
                        });
                      }
                    }}
                    fromYear={1900}
                    toYear={2100}
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString('en-US', { month: 'short' }),
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>

            <div className='space-y-2'>
              <Label htmlFor='edit-end-date'>
                End Date <span className='text-red-500'>*</span>
              </Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    id='edit-end-date'
                    variant='outline'
                    className='w-full justify-start text-left font-normal'
                  >
                    <span className='flex-1 text-left'>
                      {editedCampaign.end_date
                        ? (() => {
                            const date = new Date(editedCampaign.end_date);
                            const year = date.getFullYear();
                            const month = String(
                              date.getMonth() + 1
                            ).padStart(2, '0');
                            const day = String(date.getDate()).padStart(2, '0');
                            return `${year}/${month}/${day}`;
                          })()
                        : 'Select end date'}
                    </span>
                    <CalendarIcon className='ml-auto h-4 w-4 opacity-50' />
                  </Button>
                </PopoverTrigger>
                <PopoverContent className='w-auto p-0' align='start'>
                  <Calendar
                    mode='single'
                    captionLayout='dropdown'
                    selected={
                      editedCampaign.end_date
                        ? new Date(editedCampaign.end_date)
                        : undefined
                    }
                    onSelect={(date) => {
                      if (date) {
                        const year = date.getFullYear();
                        const month = String(date.getMonth() + 1).padStart(
                          2,
                          '0'
                        );
                        const day = String(date.getDate()).padStart(2, '0');
                        setEditedCampaign({
                          ...editedCampaign,
                          end_date: `${year}-${month}-${day}`,
                        });
                      }
                    }}
                    fromYear={1900}
                    toYear={2100}
                    formatters={{
                      formatMonthDropdown: (date) =>
                        date.toLocaleString('en-US', { month: 'short' }),
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>

          {/* Jira URL */}
          <div className='space-y-2'>
            <Label htmlFor='edit-jira-url'>Jira URL</Label>
            <Input
              id='edit-jira-url'
              placeholder='https://jira.example.com/issue/XXX'
              value={editedCampaign.jira_url || ''}
              onChange={(e) =>
                setEditedCampaign({
                  ...editedCampaign,
                  jira_url: e.target.value || null,
                })
              }
              autoComplete='off'
            />
          </div>

          {/* Daily Report URL */}
          <div className='space-y-2'>
            <Label htmlFor='edit-daily-report-url'>Daily Report URL</Label>
            <Input
              id='edit-daily-report-url'
              placeholder='https://example.com/daily-report'
              value={editedCampaign.daily_report_url || ''}
              onChange={(e) =>
                setEditedCampaign({
                  ...editedCampaign,
                  daily_report_url: e.target.value || null,
                })
              }
              autoComplete='off'
            />
          </div>

          {/* Description */}
          <div className='space-y-2'>
            <Label htmlFor='edit-description'>Description</Label>
            <Input
              id='edit-description'
              placeholder='Enter campaign description (optional)'
              value={editedCampaign.description || ''}
              onChange={(e) =>
                setEditedCampaign({
                  ...editedCampaign,
                  description: e.target.value || null,
                })
              }
              autoComplete='off'
            />
          </div>
        </div>

        <DialogFooter>
          <Button
            type='button'
            variant='outline'
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            type='button'
            onClick={handleUpdateCampaign}
            disabled={isSubmitting}
          >
            {isSubmitting && <Loader2 className='mr-2 h-4 w-4 animate-spin' />}
            Update Campaign
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

