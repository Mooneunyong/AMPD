'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  GamepadIcon,
  TrophyIcon,
  TrendingUpIcon,
  UsersIcon,
} from 'lucide-react';
import type { Game } from '@/hooks/use-game-management';

interface GameStatsProps {
  totalGames: number;
  activeGames: number;
  totalAccounts: number;
  totalCategories: number;
}

export function GameStats({
  totalGames,
  activeGames,
  totalAccounts,
  totalCategories,
}: GameStatsProps) {
  const stats = [
    {
      title: 'Total Games',
      value: totalGames,
      icon: GamepadIcon,
      description: 'All games in the system',
    },
    {
      title: 'Active Games',
      value: activeGames,
      icon: TrendingUpIcon,
      description: 'Currently active games',
    },
    {
      title: 'Accounts',
      value: totalAccounts,
      icon: UsersIcon,
      description: 'Accounts with games',
    },
    {
      title: 'Categories',
      value: totalCategories,
      icon: TrophyIcon,
      description: 'Game categories',
    },
  ];

  return (
    <div className='grid gap-4 md:grid-cols-2 lg:grid-cols-4'>
      {stats.map((stat) => {
        const Icon = stat.icon;
        return (
          <Card key={stat.title}>
            <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
              <CardTitle className='text-sm font-medium'>
                {stat.title}
              </CardTitle>
              <Icon className='h-4 w-4 text-muted-foreground' />
            </CardHeader>
            <CardContent>
              <div className='text-2xl font-bold'>{stat.value}</div>
              <p className='text-xs text-muted-foreground'>
                {stat.description}
              </p>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
