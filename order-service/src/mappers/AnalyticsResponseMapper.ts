import { AnalyticsQueryDTO, AnalyticsResponseDTO } from '../dtos/analytics';

/**
 * Mapper para transformar datos crudos de MongoDB a DTOs
 * Cumple con Single Responsibility Principle: Solo transformación de datos
 */
export class AnalyticsResponseMapper {
  mapToDTO(
    series: any[],
    productsSold: any[],
    query: AnalyticsQueryDTO
  ): AnalyticsResponseDTO {
    const summary = this.calculateSummary(series);
    
    return {
      range: { from: query.from, to: query.to, groupBy: query.groupBy },
      summary: {
        totalOrders: summary.totalOrders,
        totalRevenue: Number(summary.totalRevenue.toFixed(2)),
        avgPrepTime: null
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
}
