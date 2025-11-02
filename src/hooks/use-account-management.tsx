/**
 * 계정 관리 훅
 */

'use client';

import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  AccountProfile,
  getActiveUserProfiles,
  addAccount,
  getAllAccountProfiles,
  updateAccount,
  deleteAccount,
} from '@/lib/account-management';
import { UserProfile } from '@/lib/permissions';

export function useAccountManagement() {
  const [accounts, setAccounts] = useState<AccountProfile[]>([]);
  const [activeUsers, setActiveUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 계정 목록 로드
  const loadAccounts = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const accountProfiles = await getAllAccountProfiles();
      setAccounts(accountProfiles);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : '계정을 불러올 수 없습니다.'
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // 활성 사용자 목록 로드
  const loadActiveUsers = useCallback(async () => {
    try {
      const userProfiles = await getActiveUserProfiles();
      setActiveUsers(userProfiles);
    } catch (err) {
      console.error('활성 사용자 로드 오류:', err);
    }
  }, []);

  // 새 계정 추가
  const createAccount = useCallback(
    async (accountData: {
      company: string;
      country: string;
      assigned_user_id: string;
    }) => {
      try {
        const newAccount = await addAccount(accountData);
        setAccounts((prevAccounts) => [newAccount, ...prevAccounts]);
        return newAccount;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '계정을 생성할 수 없습니다.'
        );
        throw err;
      }
    },
    []
  );

  // 계정 업데이트
  const updateAccountData = useCallback(
    async (
      accountId: string,
      accountData: {
        company: string;
        country: string;
        assigned_user_id: string;
      }
    ) => {
      try {
        const updatedAccount = await updateAccount(accountId, accountData);
        setAccounts((prevAccounts) =>
          prevAccounts.map((account) =>
            account.id === accountId ? updatedAccount : account
          )
        );
        return updatedAccount;
      } catch (err) {
        setError(
          err instanceof Error ? err.message : '계정을 업데이트할 수 없습니다.'
        );
        throw err;
      }
    },
    []
  );

  // 계정 삭제
  const removeAccount = useCallback(async (accountId: string) => {
    try {
      await deleteAccount(accountId);
      setAccounts((prevAccounts) =>
        prevAccounts.filter((account) => account.id !== accountId)
      );
    } catch (err) {
      console.error('Delete account error:', err);
      setError(
        err instanceof Error ? err.message : '계정을 삭제할 수 없습니다.'
      );
      throw err;
    }
  }, []);

  // 초기 로드
  useEffect(() => {
    const loadData = async () => {
      await Promise.all([loadAccounts(), loadActiveUsers()]);
    };

    loadData();
  }, [loadAccounts, loadActiveUsers]);

  // 반환값 메모이제이션
  return useMemo(
    () => ({
      accounts,
      activeUsers,
      loading,
      error,
      loadAccounts,
      createAccount,
      updateAccount: updateAccountData,
      removeAccount,
    }),
    [
      accounts,
      activeUsers,
      loading,
      error,
      loadAccounts,
      createAccount,
      updateAccountData,
      removeAccount,
    ]
  );
}
