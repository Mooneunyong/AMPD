/**
 * 컴포넌트 Props 타입 정의
 */

import { ReactNode } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';

export interface AppSidebarProps {
  user?: SupabaseUser | null;
  onSignOut?: () => void;
  variant?: 'sidebar' | 'floating' | 'inset';
  collapsible?: 'offcanvas' | 'icon' | 'none';
}

export interface AppLayoutProps {
  children: ReactNode;
}

export interface AccessControlProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface AdminAccessControlProps {
  children: ReactNode;
  fallback?: ReactNode;
}

export interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
}
