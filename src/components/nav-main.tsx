'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { memo, useCallback } from 'react';

import {
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
} from '@/components/ui/sidebar';
import { NavMainProps } from '@/types';

interface ExtendedNavMainProps extends NavMainProps {
  pendingUrl?: string | null;
  onItemClick?: (itemUrl: string) => void;
}

export const NavMain = memo(function NavMain({ items, pendingUrl, onItemClick }: ExtendedNavMainProps) {
  const pathname = usePathname();

  // 액티브 상태: 경로 기반 (라우트 완료 시 동기화)
  const isActive = useCallback(
    (itemUrl: string) => {
      // Optimistic highlight while navigating
      if (pendingUrl) return pendingUrl === itemUrl;
      if (itemUrl === pathname) return true;
      if (pathname.startsWith(itemUrl + '/')) return true;
      if (itemUrl === '/dashboard' && pathname === '/') return true;
      return false;
    },
    [pathname, pendingUrl]
  );

  return (
    <SidebarGroup>
      <SidebarGroupContent className='flex flex-col gap-2'>
        <SidebarMenu>
          {items.map((item) => (
            <SidebarMenuItem key={item.title}>
              <SidebarMenuButton
                asChild
                tooltip={item.title}
                isActive={isActive(item.url)}
              >
                <Link
                  href={item.url}
                  className='flex items-center gap-2'
                  onClick={() => onItemClick?.(item.url)}
                >
                  {item.icon && <item.icon />}
                  <span>{item.title}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  );
});
