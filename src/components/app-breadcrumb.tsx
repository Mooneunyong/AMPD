'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb';

// 페이지 경로와 표시 이름 매핑
const pathMap: Record<string, string> = {
  '/': 'Home',
  '/dashboard': 'Dashboard',
  '/accounts': 'Accounts',
  '/analytics': 'Analytics',
  '/campaigns': 'Campaigns',
  '/team': 'Team',
  '/settings': 'Settings',
};

export function AppBreadcrumb() {
  const pathname = usePathname();

  // 경로를 분할하여 breadcrumb 항목 생성
  const pathSegments = pathname.split('/').filter(Boolean);

  // 홈 페이지인 경우 breadcrumb 표시하지 않음
  if (pathname === '/') {
    return null;
  }

  return (
    <Breadcrumb>
      <BreadcrumbList>
        <BreadcrumbItem>
          <BreadcrumbLink asChild>
            <Link href='/'>Home</Link>
          </BreadcrumbLink>
        </BreadcrumbItem>

        {pathSegments.map((segment, index) => {
          const href = '/' + pathSegments.slice(0, index + 1).join('/');
          const isLast = index === pathSegments.length - 1;

          // 동적 경로 처리
          let displayName = pathMap[href];
          if (!displayName) {
            // /accounts/[id] 경로인 경우
            if (
              pathSegments[0] === 'accounts' &&
              pathSegments.length === 2 &&
              isLast
            ) {
              displayName = 'Account Detail';
            } else {
              displayName = segment.charAt(0).toUpperCase() + segment.slice(1);
            }
          }

          return (
            <div key={href} className='flex items-center'>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                {isLast ? (
                  <BreadcrumbPage>{displayName}</BreadcrumbPage>
                ) : (
                  <BreadcrumbLink asChild>
                    <Link href={href}>{displayName}</Link>
                  </BreadcrumbLink>
                )}
              </BreadcrumbItem>
            </div>
          );
        })}
      </BreadcrumbList>
    </Breadcrumb>
  );
}
