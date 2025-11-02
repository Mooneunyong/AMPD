'use client';

import { useEffect, useState, useRef } from 'react';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';

interface RouteTransitionProps {
  children: React.ReactNode;
}

export function RouteTransition({ children }: RouteTransitionProps) {
  const pathname = usePathname();
  const [isNavigating, setIsNavigating] = useState(false);
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  // When the pathname changes (route finished), stop navigation state
  useEffect(() => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    setIsNavigating(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  // Start progress bar only after delay (for slow networks)
  useEffect(() => {
    function cancelOverlay() {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsNavigating(false);
    }

    function onPageLoadingStart() {
      // Destination page shows its own skeleton; avoid double-loading effect
      cancelOverlay();
    }
    function onPageLoadingEnd() {
      cancelOverlay();
    }

    function onClick(e: MouseEvent) {
      const target = e.target as HTMLElement | null;
      if (!target) return;
      const anchor = target.closest('a');
      if (!anchor) return;
      const href = anchor.getAttribute('href');
      if (!href) return;
      // Only handle internal navigations
      const isInternal = href.startsWith('/') && !href.startsWith('//');
      if (isInternal) {
        // Check if clicking the same route - don't show loading for same page
        const currentPath = window.location.pathname;
        const targetPath = new URL(href, window.location.origin).pathname;
        if (currentPath === targetPath) {
          // Same route, don't show loading
          return;
        }
        // Only show progress bar if navigation takes longer than 300ms
        if (timeoutRef.current) {
          clearTimeout(timeoutRef.current);
        }
        timeoutRef.current = setTimeout(() => {
          setIsNavigating(true);
        }, 300);
      }
    }

    document.addEventListener('click', onClick, true);
    window.addEventListener('page-loading-start', onPageLoadingStart);
    window.addEventListener('page-loading-end', onPageLoadingEnd);
    
    // Cleanup: Make sure to cancel any pending navigation state
    return () => {
      document.removeEventListener('click', onClick, true);
      window.removeEventListener('page-loading-start', onPageLoadingStart);
      window.removeEventListener('page-loading-end', onPageLoadingEnd);
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsNavigating(false);
    };
  }, []);

  return (
    <div className='relative'>
      {/* Top progress bar - only shows if navigation takes longer than 300ms */}
      <div
        className={cn(
          'pointer-events-none fixed left-0 top-0 z-[60] h-0.5 bg-primary transition-[width,opacity] duration-300 ease-out',
          isNavigating ? 'w-2/3 opacity-100' : 'w-0 opacity-0'
        )}
        aria-hidden
      />
      {/* Subtle overlay for slow networks - shows existing content is transitioning */}
      <div
        className={cn(
          'pointer-events-none absolute inset-0 z-50 bg-background/40 backdrop-blur-[2px] transition-opacity duration-300',
          isNavigating ? 'opacity-100' : 'opacity-0'
        )}
        aria-hidden
      />
      {children}
    </div>
  );
}


