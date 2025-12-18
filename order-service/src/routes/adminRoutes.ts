import { Router, Request, Response } from 'express';
import { Order } from '../models/Order';

const router = Router();

// Endpoint real de analíticas en order-service
router.get('/analytics', async (req: Request, res: Response) => {
  try {
    const { from, to, groupBy } = req.query;
    // Validar fechas
    const fromDate = from ? new Date(from as string) : new Date('2000-01-01');
    const toDate = to ? new Date(to as string) : new Date();
    // Agrupación: día, mes, año
    let groupFormat = '%Y-%m-%d';
    if (groupBy === 'Mes') groupFormat = '%Y-%m';
    if (groupBy === 'Año') groupFormat = '%Y';

    // Agregación en MongoDB
    const data = await Order.aggregate([
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      {
        $group: {
          _id: { $dateToString: { format: groupFormat, date: '$createdAt' } },
          totalOrders: { $sum: 1 },
          totalSales: { $sum: '$total' }
        }
      },
      { $sort: { _id: 1 } }
    ]);

    res.json({
      success: true,
      from,
      to,
      groupBy,
      data: data.map((d: any) => ({ label: d._id, totalOrders: d.totalOrders, totalSales: d.totalSales }))
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: 'Error obteniendo analíticas',
      details: error.message
    });
  }
});

export default router;
