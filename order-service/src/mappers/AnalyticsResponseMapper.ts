import { AnalyticsQueryDTO, AnalyticsResponseDTO } from '../dtos/analytics';

/**
 * Mapper para transformar datos crudos de MongoDB a DTOs
 * Cumple con Single Responsibility Principle: Solo transformación de datos
 */
export class AnalyticsResponseMapper {
  mapToDTO(
    series: any[],
    productsSold: any[],
    query: AnalyticsQueryDTO,
    previousPeriodSummary?: { totalOrders: number; totalRevenue: number; totalProductsSold: number } | null
  ): AnalyticsResponseDTO {
    const summary = this.calculateSummary(series);
    const totalProductsSold = productsSold.reduce((sum, p) => sum + p.quantity, 0);
    
    // Calcular cambios porcentuales
    const changes = this.calculatePercentageChanges(
      summary.totalOrders,
      summary.totalRevenue,
      totalProductsSold,
      previousPeriodSummary
    );
    
    return {
      range: { from: query.from, to: query.to, groupBy: query.groupBy },
      summary: {
        totalOrders: summary.totalOrders,
        totalRevenue: Number(summary.totalRevenue.toFixed(2)),
        avgPrepTime: null,
        totalOrdersChange: changes.ordersChange,
        totalRevenueChange: changes.revenueChange,
        totalProductsSoldChange: changes.productsSoldChange
      },
      series: series.map((s: any) => ({
        period: s._id,
        totalOrders: s.totalOrders,
        totalRevenue: Number(s.totalRevenue.toFixed(2)),
        avgPrepTime: null
      })),
      productsSold: this.mapProducts(productsSold),
      topNProducts: this.mapProducts(productsSold),
      message: null
    };
  }

  private calculateSummary(series: any[]): { totalOrders: number; totalRevenue: number } {
    return series.reduce(
      (acc, s) => ({
        totalOrders: acc.totalOrders + s.totalOrders,
        totalRevenue: acc.totalRevenue + s.totalRevenue
      }),
      { totalOrders: 0, totalRevenue: 0 }
    );
  }

  private mapProducts(products: any[]): Array<{ productId: string; name: string; quantity: number; revenue: number }> {
    return products.map((p: any) => ({
      productId: p._id.productId,
      name: p._id.name,
      quantity: p.quantity,
      revenue: Number(p.revenue.toFixed(2))
    }));
  }

  /**
   * Calcula cambios porcentuales comparando período actual con anterior
   */
  private calculatePercentageChanges(
    currentOrders: number,
    currentRevenue: number,
    currentProductsSold: number,
    previousPeriod?: { totalOrders: number; totalRevenue: number; totalProductsSold: number } | null
  ): { ordersChange: number | null; revenueChange: number | null; productsSoldChange: number | null } {
    if (!previousPeriod) {
      return {
        ordersChange: null,
        revenueChange: null,
        productsSoldChange: null
      };
    }

    const calculateChange = (current: number, previous: number): number | null => {
      if (previous === 0) return null;
      const change = ((current - previous) / previous) * 100;
      return Number(change.toFixed(1));
    };

    return {
      ordersChange: calculateChange(currentOrders, previousPeriod.totalOrders),
      revenueChange: calculateChange(currentRevenue, previousPeriod.totalRevenue),
      productsSoldChange: calculateChange(currentProductsSold, previousPeriod.totalProductsSold)
    };
  }
}
