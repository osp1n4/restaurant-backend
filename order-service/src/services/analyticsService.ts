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
    // Write header
    const columns = query.columns?.length ? query.columns : ['period','totalOrders','totalRevenue','productId','productName','quantity','avgPrepTime'];
    const stringifier = stringify({ header: true, columns });
    // Pipe stringifier into readable by forwarding data
    stringifier.on('readable', () => {
      let row;
      while ((row = stringifier.read()) !== null) {
        readable.push(row);
      }
    });
    stringifier.on('end', () => readable.push(null));
    // Minimal CSV content placeholder; real implementation should stream aggregate cursor rows.
    stringifier.write({ period: `${query.from}-${query.to}`, totalOrders: 0, totalRevenue: 0, productId: '', productName: '', quantity: 0, avgPrepTime: '' });
    stringifier.end();
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