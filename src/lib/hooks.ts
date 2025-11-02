import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';

// 가상의 API 함수들
const fetchUsers = async (): Promise<
  Array<{ id: number; name: string; email: string }>
> => {
  // 실제 API 호출을 시뮬레이션
  await new Promise((resolve) => setTimeout(resolve, 1000));
  return [
    { id: 1, name: '홍길동', email: 'hong@example.com' },
    { id: 2, name: '김철수', email: 'kim@example.com' },
    { id: 3, name: '이영희', email: 'lee@example.com' },
  ];
};

const createUser = async (user: { name: string; email: string }) => {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return { id: Date.now(), ...user };
};

// 사용자 목록을 가져오는 훅
export const useUsers = () => {
  return useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });
};

// 사용자를 생성하는 훅
export const useCreateUser = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: createUser,
    onSuccess: () => {
      // 사용자 목록 캐시 무효화하여 자동 리페치
      queryClient.invalidateQueries({ queryKey: ['users'] });
    },
  });
};

// 포스트 데이터를 가져오는 훅 (예제)
export const usePosts = () => {
  return useQuery({
    queryKey: ['posts'],
    queryFn: async () => {
      await new Promise((resolve) => setTimeout(resolve, 800));
      return [
        {
          id: 1,
          title: '첫 번째 포스트',
          content: '이것은 첫 번째 포스트입니다.',
        },
        {
          id: 2,
          title: '두 번째 포스트',
          content: '이것은 두 번째 포스트입니다.',
        },
        {
          id: 3,
          title: '세 번째 포스트',
          content: '이것은 세 번째 포스트입니다.',
        },
      ];
    },
  });
};
