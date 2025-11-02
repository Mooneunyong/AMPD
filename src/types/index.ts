/**
 * 메인 타입 정의 파일
 * 모든 타입을 중앙에서 관리하고 재export
 */

// 인증 관련 타입
export type {
  AuthState,
  AuthContextType,
  UserProfile,
  UserRole,
  LoginFormData,
  SignupFormData,
} from './auth';

// 네비게이션 관련 타입
export type {
  NavItem,
  NavSubItem,
  NavDocument,
  NavUser,
  NavMainProps,
  NavDocumentsProps,
  NavSecondaryProps,
  NavUserProps,
} from './navigation';

// 컴포넌트 Props 타입
export type {
  AppSidebarProps,
  AppLayoutProps,
  AccessControlProps,
  AdminAccessControlProps,
  LoadingSpinnerProps,
  ErrorBoundaryProps,
} from './components';

// 데이터 모델 타입
export type {
  DashboardData,
  ChartDataPoint,
  ChartConfig,
  Campaign,
  AnalyticsData,
} from './data';

// 설정 및 상수
export {
  NAVIGATION_CONFIG,
  ROUTES,
  APP_CONFIG,
  API_ENDPOINTS,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
} from './constants';
