export type GroupBy = 'day' | 'week' | 'month' | 'year';

export interface AnalyticsQueryDTO {
  from: string; // YYYY-MM-DD
  to: string;   // YYYY-MM-DD
  groupBy: GroupBy;
  top?: number; // default 10
}

export interface AnalyticsResponseDTO {
  range: { from: string; to: string; groupBy: GroupBy };
  summary: { totalOrders: number; totalRevenue: number; avgPrepTime: number | null };
  series: Array<{ period: string; totalOrders: number; totalRevenue: number; avgPrepTime: number | null }>;
  productsSold: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  topNProducts: Array<{ productId: string; name: string; quantity: number; revenue: number }>;
  message: string | null;
}

export interface CSVExportRequestDTO extends AnalyticsQueryDTO {
  columns: string[];
}