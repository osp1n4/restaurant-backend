import { Model } from 'mongoose';
import { IOrder } from '../models/Order';
import { IAnalyticsRepository } from '../interfaces/IAnalyticsRepository';
import { AnalyticsQueryDTO, AnalyticsResponseDTO, CSVExportRequestDTO } from '../dtos/analytics';
import { IGroupingStrategy } from '../interfaces/IGroupingStrategy';
import { GroupingStrategyFactory } from '../strategies/GroupingStrategies';
import { Readable } from 'stream';
import { AnalyticsResponseMapper } from '../mappers/AnalyticsResponseMapper';
import { CSVExporter } from '../exporters/CSVExporter';

/**
 * Repositorio de analíticas
 * Cumple con Single Responsibility Principle: Solo acceso a datos
 * Cumple con Dependency Inversion Principle: Depende de abstracciones (IGroupingStrategy)
 */
export class AnalyticsRepository implements IAnalyticsRepository {
  private mapper: AnalyticsResponseMapper;
  private csvExporter: CSVExporter;

  constructor(private orderModel: Model<IOrder>) {
    this.mapper = new AnalyticsResponseMapper();
    this.csvExporter = new CSVExporter();
  }

  async getAnalytics(query: AnalyticsQueryDTO): Promise<AnalyticsResponseDTO | null> {
    const { from, to, groupBy, top = 10 } = query;
    const fromDate = new Date(`${from}T00:00:00.000Z`);
    const toDate = new Date(`${to}T23:59:59.999Z`);

    // Validar rango máximo
    const monthsDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
    if (monthsDiff > 12) {
      throw Object.assign(new Error('El rango de fechas excede el máximo permitido'), { code: 'RANGE_EXCEEDED' });
    }

    // Usar estrategia de agrupación
    const strategy: IGroupingStrategy = GroupingStrategyFactory.create(groupBy);
    const periodExpr = strategy.getPeriodExpression();

    // Pipeline para series temporales
    const seriesPipeline: any[] = [
      { $match: { createdAt: { $gte: fromDate, $lte: toDate }, status: 'ready' } },
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
          totalOrders: { $addToSet: '$_id' },
          totalRevenue: { $sum: '$itemRevenue' }
        }
      },
      {
        $project: {
          _id: 1,
          totalOrders: { $size: '$totalOrders' },
          totalRevenue: 1
        }
      },
      { $sort: { _id: 1 } }
    ];

    const series = await this.orderModel.aggregate(seriesPipeline).exec();

    if (!series || series.length === 0) {
      return null;
    }

    // Pipeline para productos vendidos
    const productsPipeline: any[] = [
      { $match: { createdAt: { $gte: fromDate, $lte: toDate }, status: 'ready' } },
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

    // Usar mapper para transformar datos
    return this.mapper.mapToDTO(series, productsSold, query);
  }

  streamCsv(query: CSVExportRequestDTO): Readable {
    const readable = new Readable({ read() {} });

    this.getAnalytics(query)
      .then(analytics => {
        const csvStream = this.csvExporter.export(analytics, query);
        csvStream.on('data', chunk => readable.push(chunk));
        csvStream.on('end', () => readable.push(null));
        csvStream.on('error', err => {
          console.error('Error en CSV stream:', err);
          readable.push(null);
        });
      })
      .catch(err => {
        console.error('Error obteniendo analíticas:', err);
        readable.push('period;totalOrders;totalRevenue;productId;productName;quantity;avgPrepTime\n');
        readable.push('Error;0;0;;Error al generar reporte;0;\n');
        readable.push(null);
      });

    return readable;
  }
}
