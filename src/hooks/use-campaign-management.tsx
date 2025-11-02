/**
 * 캠페인 관리 훅
 */

'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

export interface Campaign {
  id: string;
  account_id: string;
  game_id: string | null;
  name: string;
  description: string | null;
  region: string;
  mmp: string;
  campaign_type: string;
  start_date: string;
  end_date: string;
  status: string;
  jira_url: string | null;
  daily_report_url: string | null;
  created_at: string | null;
  updated_at: string | null;
  created_by: string | null;
  // 조인된 데이터
  game_name?: string;
  game_store_url?: string | null;
  game_package_identifier?: string | null;
  account_company?: string;
  assigned_user_id?: string;
  assigned_user_name?: string;
  assigned_user_avatar_url?: string | null;
}

export interface CampaignFormData {
  account_id: string;
  game_id: string | null;
  name: string;
  description?: string | null;
  region: string;
  mmp: string;
  campaign_type: string;
  start_date: string;
  end_date: string;
  status: string;
  jira_url?: string | null;
  daily_report_url?: string | null;
}

// 캠페인 상태 옵션
export const CAMPAIGN_STATUS_OPTIONS = [
  { value: 'planning', label: 'Planning' },
  { value: 'ongoing', label: 'Ongoing' },
  { value: 'holding', label: 'Holding' },
  { value: 'end', label: 'End' },
];

// 캠페인 타입 옵션
export const CAMPAIGN_TYPE_OPTIONS = [
  { value: 'CPI', label: 'CPI' },
  { value: 'CPA', label: 'CPA' },
  { value: 'CPE', label: 'CPE' },
  { value: 'CPI+CPE', label: 'CPI+CPE' },
];

// MMP 옵션
export const MMP_OPTIONS = [
  { value: 'Adjust', label: 'Adjust' },
  { value: 'AppsFlyer', label: 'AppsFlyer' },
];

// 캠페인 지역 옵션
export const REGION_OPTIONS = [
  { value: 'KR', label: 'Korea' },
  { value: 'JP', label: 'Japan' },
  { value: 'TW', label: 'Taiwan' },
  { value: 'US', label: 'United States' },
];

// 특정 게임의 캠페인 조회
export async function getCampaignsByGame(gameId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      games(
        id,
        game_name,
        account_id,
        accounts(
          id,
          company
        )
      )
    `
    )
    .eq('game_id', gameId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('게임별 캠페인 조회 오류:', error);
    throw new Error('캠페인을 불러올 수 없습니다.');
  }

  return data.map((campaign: any) => ({
    ...campaign,
    game_name: campaign.games?.game_name || null,
    account_company: campaign.games?.accounts?.company || null,
  }));
}

// 특정 계정의 모든 캠페인 조회
export async function getCampaignsByAccount(
  accountId: string
): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      games(
        id,
        game_name,
        store_url,
        package_identifier,
        account_id,
        accounts(
          id,
          company
        )
      )
    `
    )
    .eq('account_id', accountId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('계정별 캠페인 조회 오류:', error);
    throw new Error('캠페인을 불러올 수 없습니다.');
  }

  return data.map((campaign: any) => ({
    ...campaign,
    game_name: campaign.games?.game_name || null,
    game_store_url: campaign.games?.store_url || null,
    game_package_identifier: campaign.games?.package_identifier || null,
    account_company: campaign.games?.accounts?.company || null,
  }));
}

// 모든 캠페인 조회
export async function getAllCampaigns(): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      games(
        id,
        game_name,
        store_url,
        package_identifier,
        account_id,
        accounts(
          id,
          company,
          assigned_user_id,
          user_profiles!assigned_user_id(
            display_name,
            avatar_url
          )
        )
      )
    `
    )
    .order('created_at', { ascending: false });

  if (error) {
    console.error('모든 캠페인 조회 오류:', error);
    throw new Error('캠페인을 불러올 수 없습니다.');
  }

  return data.map((campaign: any) => ({
    ...campaign,
    account_id: campaign.games?.account_id || null,
    game_name: campaign.games?.game_name || null,
    game_store_url: campaign.games?.store_url || null,
    game_package_identifier: campaign.games?.package_identifier || null,
    account_company: campaign.games?.accounts?.company || null,
    assigned_user_id: campaign.games?.accounts?.assigned_user_id || null,
    assigned_user_name:
      campaign.games?.accounts?.user_profiles?.display_name || null,
    assigned_user_avatar_url:
      campaign.games?.accounts?.user_profiles?.avatar_url || null,
  }));
}

// 내가 만든 캠페인 조회
export async function getMyCampaigns(userId: string): Promise<Campaign[]> {
  const { data, error } = await supabase
    .from('campaigns')
    .select(
      `
      *,
      games(
        id,
        game_name,
        store_url,
        package_identifier,
        account_id,
        accounts(
          id,
          company,
          assigned_user_id,
          user_profiles!assigned_user_id(
            display_name,
            avatar_url
          )
        )
      )
    `
    )
    .eq('created_by', userId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('내 캠페인 조회 오류:', error);
    throw new Error('캠페인을 불러올 수 없습니다.');
  }

  return data.map((campaign: any) => ({
    ...campaign,
    account_id: campaign.games?.account_id || null,
    game_name: campaign.games?.game_name || null,
    game_store_url: campaign.games?.store_url || null,
    game_package_identifier: campaign.games?.package_identifier || null,
    account_company: campaign.games?.accounts?.company || null,
    assigned_user_id: campaign.games?.accounts?.assigned_user_id || null,
    assigned_user_name:
      campaign.games?.accounts?.user_profiles?.display_name || null,
    assigned_user_avatar_url:
      campaign.games?.accounts?.user_profiles?.avatar_url || null,
  }));
}

// 캠페인 생성
export async function createCampaign(
  campaignData: CampaignFormData
): Promise<Campaign> {
  // 현재 사용자 정보 가져오기
  const {
    data: { session },
  } = await supabase.auth.getSession();

  if (!session) {
    throw new Error('로그인이 필요합니다.');
  }

  const { data, error } = await supabase
    .from('campaigns')
    .insert([
      {
        ...campaignData,
        created_by: session.user.id,
      },
    ])
    .select(
      `
      *,
      games(
        id,
        game_name,
        store_url,
        account_id,
        accounts(
          id,
          company
        )
      )
    `
    )
    .single();

  if (error) {
    console.error('캠페인 생성 오류:', error);
    
    // 더 자세한 에러 메시지 추출
    let errorMessage = '캠페인을 생성할 수 없습니다.';
    if (error.message) {
      errorMessage = error.message;
    } else if (error.details) {
      errorMessage = error.details;
    } else if (typeof error === 'object' && error !== null) {
      errorMessage = JSON.stringify(error);
    }
    
    throw new Error(errorMessage);
  }

  return {
    ...data,
    game_name: data.games?.game_name || null,
    game_store_url: data.games?.store_url || null,
    account_company: data.games?.accounts?.company || null,
  };
}

// 캠페인 수정
export async function updateCampaign(
  campaignId: string,
  campaignData: Partial<CampaignFormData>
): Promise<Campaign> {
  const { data, error } = await supabase
    .from('campaigns')
    .update(campaignData)
    .eq('id', campaignId)
    .select(
      `
      *,
      games(
        id,
        game_name,
        store_url,
        package_identifier,
        account_id,
        accounts(
          id,
          company,
          assigned_user_id,
          user_profiles!assigned_user_id(
            display_name,
            avatar_url
          )
        )
      )
    `
    )
    .single();

  if (error) {
    console.error('캠페인 수정 오류:', error);
    throw new Error('캠페인을 수정할 수 없습니다.');
  }

  return {
    ...data,
    game_name: data.games?.game_name || null,
    game_store_url: data.games?.store_url || null,
    game_package_identifier: data.games?.package_identifier || null,
    account_company: data.games?.accounts?.company || null,
    assigned_user_id: data.games?.accounts?.assigned_user_id || null,
    assigned_user_name:
      data.games?.accounts?.user_profiles?.display_name || null,
    assigned_user_avatar_url:
      data.games?.accounts?.user_profiles?.avatar_url || null,
  };
}

// 캠페인 삭제
export async function deleteCampaign(campaignId: string): Promise<void> {
  const { error } = await supabase
    .from('campaigns')
    .delete()
    .eq('id', campaignId);

  if (error) {
    console.error('캠페인 삭제 오류:', error);
    throw new Error('캠페인을 삭제할 수 없습니다.');
  }
}

export function useCampaignManagement(accountId?: string) {
  const [campaigns, setCampaigns] = useState<Campaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 캠페인 목록 로드
  const loadCampaigns = async () => {
    if (!accountId) return;

    try {
      setLoading(true);
      setError(null);
      const campaignData = await getCampaignsByAccount(accountId);
      setCampaigns(campaignData);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '캠페인을 불러올 수 없습니다.'
      );
    } finally {
      setLoading(false);
    }
  };

  // 새 캠페인 추가
  const addCampaign = async (campaignData: CampaignFormData) => {
    try {
      const newCampaign = await createCampaign(campaignData);
      setCampaigns((prevCampaigns) => [newCampaign, ...prevCampaigns]);
      return newCampaign;
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '캠페인을 생성할 수 없습니다.'
      );
      throw err;
    }
  };

  // 캠페인 수정
  const updateCampaignData = async (
    campaignId: string,
    campaignData: Partial<CampaignFormData>
  ) => {
    try {
      const updatedCampaign = await updateCampaign(campaignId, campaignData);
      setCampaigns((prevCampaigns) =>
        prevCampaigns.map((campaign) =>
          campaign.id === campaignId ? updatedCampaign : campaign
        )
      );
      toast.success('Campaign updated successfully.');
      return updatedCampaign;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : '캠페인을 수정할 수 없습니다.';
      setError(errorMessage);
      toast.error(`Failed to update campaign: ${errorMessage}`);
      throw err;
    }
  };

  // 캠페인 삭제
  const removeCampaign = async (campaignId: string) => {
    try {
      await deleteCampaign(campaignId);
      setCampaigns((prevCampaigns) =>
        prevCampaigns.filter((campaign) => campaign.id !== campaignId)
      );
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '캠페인을 삭제할 수 없습니다.'
      );
      throw err;
    }
  };

  // 계정 ID가 변경될 때마다 캠페인 로드
  useEffect(() => {
    loadCampaigns();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [accountId]);

  return {
    campaigns,
    loading,
    error,
    loadCampaigns,
    addCampaign,
    updateCampaign: updateCampaignData,
    removeCampaign,
  };
}
