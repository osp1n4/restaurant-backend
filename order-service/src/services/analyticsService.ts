import { Model } from 'mongoose';
import { IOrder } from '../models/Order';
import { AnalyticsQueryDTO, AnalyticsResponseDTO, CSVExportRequestDTO, GroupBy } from '../dtos/analytics';
import { Readable } from 'stream';
import { stringify } from 'csv-stringify';

export class AnalyticsService {
  constructor(private orderModel: Model<IOrder>) {}

  async getAnalytics(query: AnalyticsQueryDTO): Promise<AnalyticsResponseDTO | null> {
    const { from, to, groupBy, top = 10 } = query;
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);

    // Limit range to 12 months (configurable)
    const monthsDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff > 12) {
      throw Object.assign(new Error('El rango de fechas excede el máximo permitido'), { code: 'RANGE_EXCEEDED' });
    }

    const periodExpr = this.getPeriodExpression(groupBy);

    const pipeline: any[] = [
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      { $unwind: '$items' },
      {
        $addFields: {
          period: periodExpr,
          itemRevenue: { $multiply: ['$items.quantity', { $ifNull: ['$items.unitPrice', '$items.price'] }] }
        }
      },
      {
        $group: {
          _id: '$period',
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$itemRevenue' },
          // avgPrepTime: compute if timestamps available; else null later
        }
      },
      { $sort: { _id: 1 } },
    ];

    const series = await this.orderModel.aggregate(pipeline).exec();

    if (!series || series.length === 0) {
      return null;
    }

    const summary = series.reduce(
      (acc, s) => ({ totalOrders: acc.totalOrders + s.totalOrders, totalRevenue: acc.totalRevenue + s.totalRevenue }),
      { totalOrders: 0, totalRevenue: 0 }
    );

    // Products sold aggregation
    const productsPipeline: any[] = [
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { productId: { $ifNull: ['$items.productId', '$items.name'] }, name: '$items.name' },
          quantity: { $sum: '$items.quantity' },
          revenue: { $sum: { $multiply: ['$items.quantity', { $ifNull: ['$items.unitPrice', '$items.price'] }] } }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: top }
    ];
    const productsSold = await this.orderModel.aggregate(productsPipeline).exec();

    const response: AnalyticsResponseDTO = {
      range: { from, to, groupBy },
      summary: { totalOrders: summary.totalOrders, totalRevenue: Number(summary.totalRevenue.toFixed(2)), avgPrepTime: null },
      series: series.map((s: any) => ({
        period: s._id,
        totalOrders: s.totalOrders,
        totalRevenue: Number(s.totalRevenue.toFixed(2)),
        avgPrepTime: null
      })),
      productsSold: productsSold.map((p: any) => ({
        productId: p._id.productId,
        name: p._id.name,
        quantity: p.quantity,
        revenue: Number(p.revenue.toFixed(2))
      })),
      topNProducts: productsSold.map((p: any) => ({
        productId: p._id.productId,
        name: p._id.name,
        quantity: p.quantity,
        revenue: Number(p.revenue.toFixed(2))
      })),
      message: null
    };

    return response;
  }

  streamCsv(query: CSVExportRequestDTO): Readable {
    const readable = new Readable({ read() {} });
    
    // Obtener datos reales de analíticas y escribirlos en el CSV
    this.getAnalytics(query)
      .then(analytics => {
        // Definir columnas por defecto
        const columns = query.columns?.length 
          ? query.columns 
          : ['period', 'totalOrders', 'totalRevenue', 'productId', 'productName', 'quantity', 'avgPrepTime'];
        
        // Preparar datos en formato de array de objetos
        const records: any[] = [];
        
        if (!analytics || !analytics.series || !analytics.productsSold) {
          // Si no hay datos, agregar una fila vacía
          records.push({
            period: `${query.from} to ${query.to}`,
            totalOrders: 0,
            totalRevenue: 0,
            productId: '',
            productName: 'No data available',
            quantity: 0,
            avgPrepTime: ''
          });
        } else {
          // Combinar datos de series temporales con productos vendidos
          analytics.series.forEach(seriesItem => {
            analytics.productsSold.forEach(product => {
              records.push({
                period: seriesItem.period || '',
                totalOrders: seriesItem.totalOrders || 0,
                totalRevenue: seriesItem.totalRevenue || 0,
                productId: product.productId || '',
                productName: product.name || '',
                quantity: product.quantity || 0,
                avgPrepTime: seriesItem.avgPrepTime || ''
              });
            });
          });
        }
        
        // Generar CSV usando stringify con callback
        // Usar punto y coma como delimitador para compatibilidad con Excel en español
        stringify(records, {
          header: true,
          columns: columns,
          delimiter: ';',  // Punto y coma para Excel en español
          quote: '"',
          quoted: true,
          quoted_empty: true
        }, (err, output) => {
          if (err) {
            console.error('Error generando CSV:', err);
            readable.push('Error generating CSV report\n');
            readable.push(null);
            return;
          }
          // Agregar BOM UTF-8 para mejor compatibilidad con Excel
          readable.push('\uFEFF' + output);
          readable.push(null);
        });
      })
      .catch(err => {
        console.error('Error obteniendo analíticas:', err);
        readable.push('period,totalOrders,totalRevenue,productId,productName,quantity,avgPrepTime\n');
        readable.push('Error,0,0,,Error al generar reporte,0,\n');
        readable.push(null);
      });
    
    return readable;
  }

  private getPeriodExpression(groupBy: GroupBy) {
    switch (groupBy) {
      case 'day':
        return { $dateToString: { format: '%Y-%m-%d', date: '$createdAt' } };
      case 'week':
        // Approximate: first day of week Monday not guaranteed; adjust if $dateTrunc available
        return { $dateToString: { format: '%G-%V', date: '$createdAt' } }; // ISO week-year-week
      case 'month':
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
      case 'year':
        return { $dateToString: { format: '%Y', date: '$createdAt' } };
      default:
        return { $dateToString: { format: '%Y-%m', date: '$createdAt' } };
    }
  }
}