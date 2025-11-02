'use client';

import { PlusIcon, BuildingIcon } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  accountsLength: number;
  onCreateAccount: () => void;
  hasFilter?: boolean;
}

export function EmptyState({
  accountsLength,
  onCreateAccount,
  hasFilter = false,
}: EmptyStateProps) {
  return (
    <div className='flex flex-col items-center justify-center py-12 px-4'>
      <div className='rounded-full bg-muted p-3 mb-4'>
        <BuildingIcon className='h-8 w-8 text-muted-foreground' />
      </div>
      <h3 className='text-lg font-semibold mb-2'>No accounts found</h3>
      <p className='text-muted-foreground text-center mb-6 max-w-sm'>
        {accountsLength === 0
          ? "You haven't created any accounts yet. Create your first account to get started."
          : hasFilter
          ? 'No accounts match your current search or filter criteria. Try adjusting your filters.'
          : 'No accounts are available.'}
      </p>
      {accountsLength === 0 && (
        <Button onClick={onCreateAccount} className='flex items-center gap-2'>
          <PlusIcon className='h-4 w-4' />
          Create First Account
        </Button>
      )}
    </div>
  );
}
