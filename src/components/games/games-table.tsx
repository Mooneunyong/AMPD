'use client';

import { toast } from 'sonner';
import {
  TrashIcon,
  EditIcon,
  MoreHorizontalIcon,
  ExternalLinkIcon,
} from 'lucide-react';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import type { Game } from '@/hooks/use-game-management';
import { getPlatformDisplay } from '@/lib/utils/platform';

interface GamesTableProps {
  games: Game[];
  selectedGames: string[];
  onSelectAll: (checked: boolean) => void;
  onSelectGame: (gameId: string, checked: boolean) => void;
  onGameDeleted?: (gameId: string) => void;
  onDeleteGame: (gameId: string) => Promise<void>;
}

export function GamesTable({
  games,
  selectedGames,
  onSelectAll,
  onSelectGame,
  onGameDeleted,
  onDeleteGame,
}: GamesTableProps) {
  const isAllSelected =
    games.length > 0 && selectedGames.length === games.length;

  const handleDeleteGame = async (gameId: string) => {
    try {
      await onDeleteGame(gameId);
      toast.success('Game deleted successfully');
      onGameDeleted?.(gameId);
    } catch (err) {
      toast.error(
        `Failed to delete game: ${
          err instanceof Error ? err.message : 'Unknown error'
        }`
      );
    }
  };

  const handleEditGame = (gameId: string) => {
    // TODO: 게임 수정 모달 구현
    // TODO: 게임 수정 기능 구현 필요
  };

  const handleOpenStore = (url: string) => {
    if (url) {
      window.open(url, '_blank');
    }
  };

  return (
    <div className='overflow-hidden rounded-xl border'>
      <Table style={{ tableLayout: 'fixed', width: '100%' }}>
        <TableHeader className='sticky top-0 z-20 bg-muted'>
          <TableRow>
            <TableHead style={{ width: '32px' }}>
              <Checkbox
                checked={isAllSelected}
                onCheckedChange={onSelectAll}
                aria-label='Select all'
              />
            </TableHead>
            <TableHead style={{ width: '200px' }}>Game Name</TableHead>
            <TableHead style={{ width: '120px' }}>Account</TableHead>
            <TableHead style={{ width: '100px' }}>Platform</TableHead>
            <TableHead style={{ width: '120px' }}>Store Links</TableHead>
            <TableHead></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {games.map((game) => {
            return (
              <TableRow key={game.id}>
                <TableCell style={{ width: '32px' }}>
                  <Checkbox
                    checked={selectedGames.includes(game.id)}
                    onCheckedChange={(checked) =>
                      onSelectGame(game.id, !!checked)
                    }
                    aria-label='Select row'
                  />
                </TableCell>
                <TableCell style={{ width: '200px' }}>
                  <div className='font-medium truncate text-sm'>
                    {game.game_name}
                  </div>
                </TableCell>
                <TableCell style={{ width: '120px' }}>
                  <div className='text-sm'>
                    <div className='font-medium truncate'>
                      {game.account_company}
                    </div>
                    <div className='text-xs text-muted-foreground'>
                      {game.account_country}
                    </div>
                  </div>
                </TableCell>
                <TableCell style={{ width: '100px' }}>
                  <div className='text-sm'>
                    {getPlatformDisplay(game.platform)}
                  </div>
                </TableCell>
                <TableCell style={{ width: '120px' }}>
                  <div className='flex gap-1'>
                    {game.store_url && (
                      <Button
                        variant='ghost'
                        size='sm'
                        className='h-6 w-6 p-0'
                        onClick={() => handleOpenStore(game.store_url!)}
                      >
                        <ExternalLinkIcon className='h-3 w-3' />
                      </Button>
                    )}
                  </div>
                </TableCell>
                <TableCell
                  style={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                  }}
                >
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant='ghost'
                        className='flex size-8 hover:bg-muted/50'
                        size='icon'
                      >
                        <MoreHorizontalIcon className='h-4 w-4' />
                        <span className='sr-only'>Open menu</span>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align='end'
                      className='w-auto min-w-[120px]'
                    >
                      <DropdownMenuItem
                        onClick={() => handleEditGame(game.id)}
                        className='flex items-center gap-0'
                      >
                        <EditIcon className='mr-1 h-4 w-4' />
                        Edit Game
                      </DropdownMenuItem>
                      <DropdownMenuItem
                        onClick={() => handleDeleteGame(game.id)}
                        className='text-red-600 focus:text-red-600 flex items-center gap-0'
                      >
                        <TrashIcon className='mr-1 h-4 w-4' />
                        Delete Game
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}
