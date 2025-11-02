/**
 * 데이터 모델 타입 정의
 */

export interface DashboardData {
  id: number;
  header: string;
  type: string;
  status: string;
  target: string;
  limit: string;
  reviewer: string;
}

export interface ChartDataPoint {
  date: string;
  desktop: number;
  mobile: number;
}

export interface ChartConfig {
  [key: string]: {
    label: string;
    color: string;
  };
}

export interface Campaign {
  id: string;
  name: string;
  description?: string;
  status: 'active' | 'paused' | 'completed' | 'draft';
  created_at: string;
  updated_at: string;
  created_by: string;
}

export interface AnalyticsData {
  totalViews: number;
  totalClicks: number;
  conversionRate: number;
  revenue: number;
  period: string;
}
