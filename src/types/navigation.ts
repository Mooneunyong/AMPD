/**
 * 네비게이션 관련 타입 정의
 */

import { LucideIcon } from 'lucide-react';
import { UserRole } from './auth';

export interface NavItem {
  title: string;
  url: string;
  icon?: LucideIcon;
  isActive?: boolean;
  items?: NavSubItem[];
  adminOnly?: boolean;
}

export interface NavSubItem {
  title: string;
  url: string;
  isActive?: boolean;
}

export interface NavDocument {
  name: string;
  url: string;
  icon: LucideIcon;
}

export interface NavUser {
  name: string;
  email: string;
  avatar: string;
  role?: UserRole;
}

export interface NavMainProps {
  items: NavItem[];
}

export interface NavDocumentsProps {
  items: NavDocument[];
}

export interface NavSecondaryProps {
  items: NavItem[];
  className?: string;
}

export interface NavUserProps {
  user: NavUser;
  onSignOut?: () => void;
}
