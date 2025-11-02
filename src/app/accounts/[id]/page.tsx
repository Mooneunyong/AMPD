'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import { PlusIcon, BuildingIcon, MapPinIcon, TargetIcon } from 'lucide-react';
import { AccessControl } from '@/components/access-control';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Toaster } from '@/components/ui/sonner';
import { Skeleton } from '@/components/ui/skeleton';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { toast } from 'sonner';
import { useAccountManagement } from '@/hooks/use-account-management';
import { useGameManagement } from '@/hooks/use-game-management';
import { useCampaignManagement } from '@/hooks/use-campaign-management';
import { useUserManagement } from '@/hooks/use-user-management';
import { useUserContext } from '@/lib/user-context';
import { CreateGameForm } from '@/components/games/create-game-form';
import { AccountGamesTable } from '@/components/games/account-games-table';
import { CampaignsTable } from '@/components/campaigns/campaigns-table';
import { CreateCampaignForm } from '@/components/campaigns/create-campaign-form';
import { EditCampaignForm } from '@/components/campaigns/edit-campaign-form';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

export default function AccountDetailPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const accountId = params.id as string;

  const [selectedCampaigns, setSelectedCampaigns] = useState<string[]>([]);
  const [showCreateGameForm, setShowCreateGameForm] = useState(false);
  const [showCreateCampaignForm, setShowCreateCampaignForm] = useState(false);
  const [showEditCampaignForm, setShowEditCampaignForm] = useState(false);
  const [editingCampaign, setEditingCampaign] = useState<any>(null);
  
  // URL 파라미터에서 탭 정보 가져오기
  const tabFromUrl = searchParams.get('tab');
  const initialTab = tabFromUrl === 'campaigns' ? 'campaigns' : 'games';
  const [activeTab, setActiveTab] = useState(initialTab);
  
  // URL 파라미터가 변경되면 탭도 업데이트
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab === 'campaigns' || tab === 'games') {
      setActiveTab(tab);
    }
  }, [searchParams]);

  const {
    accounts,
    loading: accountsLoading,
    createAccount,
    removeAccount,
  } = useAccountManagement();
  const {
    games,
    loading: gamesLoading,
    addGame,
    removeGame,
  } = useGameManagement();
  const {
    campaigns,
    loading: campaignsLoading,
    addCampaign,
    updateCampaign,
    removeCampaign,
  } = useCampaignManagement(accountId);
  const { users: activeUsers } = useUserManagement();
  const { profile: currentUserProfile } = useUserContext();

  // 현재 계정 정보
  const currentAccount = accounts.find((account) => account.id === accountId);

  // 현재 계정의 게임들
  const accountGames = games.filter((game) => game.account_id === accountId);

  // Active 캠페인 수 (ongoing 상태)
  const activeCampaignsCount = campaigns.filter(
    (campaign) => campaign.status === 'ongoing'
  ).length;

  // 상태별 캠페인 통계
  const campaignStatsByStatus = useMemo(() => {
    return {
      planning: campaigns.filter((c) => c.status === 'planning').length,
      ongoing: campaigns.filter((c) => c.status === 'ongoing').length,
      holding: campaigns.filter((c) => c.status === 'holding').length,
      end: campaigns.filter((c) => c.status === 'end').length,
      total: campaigns.length,
    };
  }, [campaigns]);

  // 나라별 캠페인 통계
  const campaignStatsByRegion = useMemo(() => {
    return {
      KR: campaigns.filter((c) => c.region === 'KR').length,
      JP: campaigns.filter((c) => c.region === 'JP').length,
      TW: campaigns.filter((c) => c.region === 'TW').length,
      US: campaigns.filter((c) => c.region === 'US').length,
    };
  }, [campaigns]);

  // 권한 확인 (로딩 중이 아닐 때만)
  // Admin과 AM 모두 모든 계정 상세 페이지 접근 가능
  const hasAccess =
    !accountsLoading &&
    (currentUserProfile?.role === 'admin' || currentUserProfile?.role === 'am');

  // 로딩 중일 때 스켈레톤 표시
  if (accountsLoading) {
    return (
      <AccessControl>
        <div className='space-y-4'>
          {/* Header Skeleton */}
          <div className='flex items-center justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-8 w-48' />
              <Skeleton className='h-4 w-64' />
            </div>
          </div>

          {/* Account Info Card Skeleton */}
          <Card>
            <CardContent className='p-6'>
              <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
                {[...Array(5)].map((_, i) => (
                  <div key={i} className='space-y-2'>
                    <Skeleton className='h-4 w-20' />
                    <Skeleton className='h-6 w-32' />
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Tabs Skeleton */}
          <div className='space-y-4'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-9 w-48 rounded-xl' />
              <Skeleton className='h-9 w-32 rounded-lg' />
            </div>
            <div className='rounded-xl border'>
              {[...Array(3)].map((_, i) => (
                <div
                  key={i}
                  className='flex items-center gap-4 px-4 py-3 border-b last:border-b-0'
                >
                  <Skeleton className='h-8 w-8 rounded-lg' />
                  <div className='flex-1 space-y-2'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-3 w-32' />
                  </div>
                  <Skeleton className='h-6 w-6 rounded' />
                  <Skeleton className='h-8 w-8 rounded' />
                </div>
              ))}
            </div>
          </div>
        </div>
      </AccessControl>
    );
  }

  // 로딩 완료 후 계정이 없는 경우
  if (!currentAccount) {
    return (
      <AccessControl>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold mb-4'>Account Not Found</h2>
          <p className='text-muted-foreground mb-6'>
            The account you're looking for doesn't exist or you don't have
            access to it.
          </p>
          <Button onClick={() => window.history.back()}>
            Back to Accounts
          </Button>
        </div>
      </AccessControl>
    );
  }

  // 권한이 없는 경우
  if (!hasAccess) {
    return (
      <AccessControl>
        <div className='text-center py-12'>
          <h2 className='text-2xl font-semibold mb-4'>Access Denied</h2>
          <p className='text-muted-foreground mb-6'>
            You don't have permission to view this account.
          </p>
          <Button onClick={() => window.history.back()}>
            Back to Accounts
          </Button>
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
              <BuildingIcon className='h-8 w-8 text-primary' />
              Account Detail
            </h1>
            <p className='text-muted-foreground'>
              {currentAccount.company} - Account details and management
            </p>
          </div>
        </div>

        {/* Account Info Card */}
        <Card>
          <CardContent className='p-6'>
            <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-5'>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Account
                </p>
                <p className='text-lg font-semibold'>
                  {currentAccount.company}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Country
                </p>
                <p className='text-lg font-semibold flex items-center gap-1'>
                  <MapPinIcon className='h-4 w-4' />
                  {currentAccount.country}
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Assigned User
                </p>
                <p className='text-lg font-semibold flex items-center gap-2'>
                  <Avatar className='h-5 w-5'>
                    {(() => {
                      const assignedUser = activeUsers.find(
                        (u) => u.id === currentAccount.assigned_user_id
                      );
                      return assignedUser?.avatar_url ? (
                        <AvatarImage
                          src={assignedUser.avatar_url}
                          alt={currentAccount.assigned_user_name}
                        />
                      ) : null;
                    })()}
                    <AvatarFallback className='text-xs'>
                      {currentAccount.assigned_user_name
                        ? currentAccount.assigned_user_name
                            .charAt(0)
                            .toUpperCase()
                        : 'U'}
                    </AvatarFallback>
                  </Avatar>
                  <span className='truncate'>
                    {currentAccount.assigned_user_name || 'Unassigned'}
                  </span>
                </p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Games
                </p>
                <p className='text-lg font-semibold'>{accountGames.length}</p>
              </div>
              <div>
                <p className='text-sm font-medium text-muted-foreground'>
                  Total Campaigns
                </p>
                <p className='text-lg font-semibold'>
                  {campaignStatsByStatus.total}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Campaign Statistics Cards */}
        <div className='grid gap-4 md:grid-cols-2'>
          {/* Campaign Status Statistics */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Campaigns by Status
              </CardTitle>
              <TargetIcon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center justify-between'>
                  <span className='text-yellow-600 dark:text-yellow-500'>
                    Planning
                  </span>
                  <span className='font-medium'>
                    {campaignStatsByStatus.planning}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-green-600 dark:text-green-500'>
                    Ongoing
                  </span>
                  <span className='font-medium'>
                    {campaignStatsByStatus.ongoing}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-red-600 dark:text-red-500'>Holding</span>
                  <span className='font-medium'>
                    {campaignStatsByStatus.holding}
                  </span>
                </div>
                <div className='flex items-center justify-between'>
                  <span className='text-gray-500 dark:text-gray-400'>End</span>
                  <span className='font-medium'>{campaignStatsByStatus.end}</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Campaign Region Statistics */}
          <Card>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                Campaigns by Region
              </CardTitle>
              <MapPinIcon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='space-y-2 text-sm'>
                <div className='flex items-center justify-between'>
                  <span>🇰🇷 Korea</span>
                  <span className='font-medium'>{campaignStatsByRegion.KR}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>🇯🇵 Japan</span>
                  <span className='font-medium'>{campaignStatsByRegion.JP}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>🇹🇼 Taiwan</span>
                  <span className='font-medium'>{campaignStatsByRegion.TW}</span>
                </div>
                <div className='flex items-center justify-between'>
                  <span>🇺🇸 United States</span>
                  <span className='font-medium'>{campaignStatsByRegion.US}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Create Game Form */}
        <CreateGameForm
          isOpen={showCreateGameForm}
          onClose={() => setShowCreateGameForm(false)}
          onCreateGame={addGame}
          accountId={accountId}
        />

        {/* Create Campaign Form */}
        <CreateCampaignForm
          isOpen={showCreateCampaignForm}
          onClose={() => setShowCreateCampaignForm(false)}
          onCreateCampaign={addCampaign}
          accountId={accountId}
          games={accountGames}
        />

        <EditCampaignForm
          isOpen={showEditCampaignForm}
          onClose={() => {
            setShowEditCampaignForm(false);
            setEditingCampaign(null);
          }}
          onUpdateCampaign={updateCampaign}
          campaign={editingCampaign}
          accountId={accountId}
          games={accountGames}
        />

        {/* Tabs */}
        <Tabs
          value={activeTab}
          defaultValue={initialTab}
          className='space-y-4 w-full overflow-hidden'
          onValueChange={setActiveTab}
        >
          <div className='flex items-center justify-between'>
            <TabsList className='rounded-xl h-9'>
              <TabsTrigger
                value='games'
                className='rounded-lg text-sm px-3 py-1 flex items-center gap-2'
              >
                Games
                <span className='bg-muted text-muted-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                  {accountGames.length}
                </span>
              </TabsTrigger>
              <TabsTrigger
                value='campaigns'
                className='rounded-lg text-sm px-3 py-1 flex items-center gap-2'
              >
                Campaigns
                <span className='bg-muted text-muted-foreground text-xs rounded-full w-5 h-5 flex items-center justify-center'>
                  {campaignStatsByStatus.total}
                </span>
              </TabsTrigger>
            </TabsList>

            {/* Add Button */}
            {activeTab === 'campaigns' && accountGames.length === 0 ? (
              <TooltipProvider delayDuration={0}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <span className='inline-block'>
                      <Button
                        onClick={() => {
                          if (accountGames.length === 0) {
                            toast.error(
                              'Please add a game first before creating a campaign.'
                            );
                            return;
                          }
                          setShowCreateCampaignForm(true);
                        }}
                        size='sm'
                        disabled
                      >
                        <PlusIcon className='h-4 w-4' />
                        Add Campaign
                      </Button>
                    </span>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Please add a game first before creating a campaign.</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ) : (
              <Button
                onClick={() => {
                  if (activeTab === 'games') {
                    setShowCreateGameForm(true);
                  } else if (activeTab === 'campaigns') {
                    if (accountGames.length === 0) {
                      toast.error(
                        'Please add a game first before creating a campaign.'
                      );
                      return;
                    }
                    setShowCreateCampaignForm(true);
                  }
                }}
                size='sm'
              >
                <PlusIcon className='h-4 w-4' />
                {activeTab === 'games' ? 'Add Game' : 'Add Campaign'}
              </Button>
            )}
          </div>

          <TabsContent value='games' className='space-y-4 w-full max-w-full overflow-hidden'>
            {accountGames.length > 0 ? (
              <AccountGamesTable
                games={accountGames}
                onDeleteGame={removeGame}
                currentUserProfile={currentUserProfile}
                accountAssignedUserId={currentAccount?.assigned_user_id}
              />
            ) : (
              <div className='text-center py-12'>
                <div className='mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4'>
                  <PlusIcon className='h-12 w-12 text-muted-foreground' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>No games found</h3>
                <p className='text-muted-foreground mb-4'>
                  This account doesn't have any games yet.
                </p>
                <Button onClick={() => setShowCreateGameForm(true)}>
                  <PlusIcon className='mr-1 h-4 w-4' />
                  Add First Game
                </Button>
              </div>
            )}
          </TabsContent>

          <TabsContent value='campaigns' className='space-y-4 w-full overflow-hidden'>
            {campaigns.length > 0 ? (
              <CampaignsTable
                campaigns={campaigns}
                selectedCampaigns={selectedCampaigns}
                onSelectAll={(checked) => {
                  if (checked) {
                    setSelectedCampaigns(
                      campaigns.map((campaign) => campaign.id)
                    );
                  } else {
                    setSelectedCampaigns([]);
                  }
                }}
                onSelectCampaign={(campaignId, checked) => {
                  if (checked) {
                    setSelectedCampaigns([...selectedCampaigns, campaignId]);
                  } else {
                    setSelectedCampaigns(
                      selectedCampaigns.filter((id) => id !== campaignId)
                    );
                  }
                }}
                onDeleteCampaign={removeCampaign}
                onEditCampaign={(campaign) => {
                  setEditingCampaign(campaign);
                  setShowEditCampaignForm(true);
                }}
                currentUserProfile={currentUserProfile}
                accountAssignedUserId={currentAccount?.assigned_user_id}
                columnVisibility={{
                  campaignTitle: true,
                  gameName: true,
                  assignedUser: false,
                  region: true,
                  mmp: true,
                  type: true,
                  dateRange: true,
                  status: true,
                  jiraUrl: true,
                  dailyReportUrl: true,
                }}
              />
            ) : (
              <div className='text-center py-12'>
                <div className='mx-auto w-24 h-24 bg-muted rounded-full flex items-center justify-center mb-4'>
                  <PlusIcon className='h-12 w-12 text-muted-foreground' />
                </div>
                <h3 className='text-lg font-semibold mb-2'>
                  No campaigns found
                </h3>
                <p className='text-muted-foreground mb-4'>
                  This account doesn't have any campaigns yet.
                </p>
                {accountGames.length === 0 ? (
                  <TooltipProvider delayDuration={0}>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <span className='inline-block'>
                          <Button
                            onClick={() => {
                              toast.error(
                                'Please add a game first before creating a campaign.'
                              );
                            }}
                            disabled
                          >
                            <PlusIcon className='mr-1 h-4 w-4' />
                            Add First Campaign
                          </Button>
                        </span>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p>
                          Please add a game first before creating a campaign.
                        </p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                ) : (
                  <Button
                    onClick={() => {
                      setShowCreateCampaignForm(true);
                    }}
                  >
                    <PlusIcon className='mr-1 h-4 w-4' />
                    Add First Campaign
                  </Button>
                )}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <Toaster position='top-center' />
    </AccessControl>
  );
}
