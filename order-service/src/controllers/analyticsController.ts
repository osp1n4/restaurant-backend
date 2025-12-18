import { Request, Response } from 'express';
import { Order, IOrder } from '../models/Order';
import ExcelJS from 'exceljs';

// Obtener analytics de órdenes
// eslint-disable-next-line complexity
export const getAnalytics = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, groupBy, top } = req.query as any;

    if (!from || !to || !groupBy) {
      res.status(400).json({
        success: false,
        message: 'Parámetros requeridos: from, to, groupBy',
      });
      return;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999); // Incluir todo el día final

    // Validar que las fechas sean válidas
    if (isNaN(fromDate.getTime()) || isNaN(toDate.getTime())) {
      res.status(400).json({
        success: false,
        message: 'Fechas inválidas. Use formato YYYY-MM-DD',
      });
      return;
    }

    // Validar que fromDate no sea posterior a toDate
    if (fromDate > toDate) {
      res.status(400).json({
        success: false,
        message: 'La fecha "desde" no puede ser posterior a la fecha "hasta"',
      });
      return;
    }

    // Validar que no sean fechas futuras
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    if (fromDate > today || toDate > today) {
      res.status(400).json({
        success: false,
        message: 'No se pueden consultar fechas futuras',
      });
      return;
    }

    // Validar rango máximo (2 años)
    const diffTime = Math.abs(toDate.getTime() - fromDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    if (diffDays > 730) {
      res.status(400).json({
        success: false,
        message: 'El rango de fechas no puede exceder los 2 años',
      });
      return;
    }

    // Obtener todas las órdenes en el rango de fechas
    const orders = await Order.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).sort({ createdAt: 1 });

    if (orders.length === 0) {
      res.status(204).send();
      return;
    }

    // Calcular resumen
    const totalOrders = orders.length;
    
    // Calcular totalRevenue: Σ(PrecioUnitario × Cantidad) sin impuestos/envío
    // El campo 'total' ya representa la suma de (price * quantity) para todos los items
    // según el middleware pre('save') en Order.ts que calcula:
    // this.total = this.items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
    const totalRevenue = orders.reduce((sum: number, order: IOrder) => sum + (order.total || 0), 0);
    
    // Calcular tiempo promedio de preparación (US-031)
    // Solo considerar órdenes que tienen ambos timestamps
    const ordersWithPrepTime = orders.filter(order => 
      order.preparingStartedAt && order.readyAt
    );
    
    let avgPrepTime = null;
    if (ordersWithPrepTime.length > 0) {
      const totalPrepTime = ordersWithPrepTime.reduce((sum: number, order: any) => {
        const prepStart = new Date(order.preparingStartedAt).getTime();
        const readyTime = new Date(order.readyAt).getTime();
        const prepTimeMinutes = (readyTime - prepStart) / (1000 * 60); // Convertir a minutos
        return sum + prepTimeMinutes;
      }, 0);
      avgPrepTime = Math.round(totalPrepTime / ordersWithPrepTime.length);
    }

    // Agrupar órdenes por período
    const groupedData = groupOrdersByPeriod(orders, groupBy);

    // Calcular productos más vendidos
    const productsSold = calculateProductsSold(orders);
    const topProducts = top ? productsSold.slice(0, parseInt(top as string)) : productsSold.slice(0, 10);

    res.status(200).json({
      success: true,
      range: {
        from: from,
        to: to,
        groupBy: groupBy,
      },
      summary: {
        totalOrders,
        totalRevenue,
        avgPrepTime,
      },
      series: groupedData,
      productsSold: productsSold,
      topNProducts: topProducts,
    });
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener analíticas',
    });
  }
};

// Exportar analytics a CSV
export const exportAnalyticsCSV = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, groupBy, top, columns } = req.body;

    if (!from || !to || !groupBy) {
      res.status(400).json({
        success: false,
        message: 'Parámetros requeridos: from, to, groupBy',
      });
      return;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).sort({ createdAt: 1 });

    // Generar CSV
    let csv = 'Date,Orders,Revenue,Avg Prep Time\n';

    const groupedData = groupOrdersByPeriod(orders, groupBy);
    
    groupedData.forEach((item: any) => {
      csv += `${item.period},${item.orders},${item.revenue},${item.avgPrepTime || 'N/A'}\n`;
    });

    // Agregar productos si se solicita
    if (!columns || columns.includes('products')) {
      csv += '\n\nTop Products\n';
      csv += 'Product,Quantity,Revenue\n';
      
      const productsSold = calculateProductsSold(orders);
      const topProducts = top ? productsSold.slice(0, parseInt(top)) : productsSold;
      
      topProducts.forEach((product: any) => {
        csv += `${product.name},${product.quantity},${product.revenue}\n`;
      });
    }

    const filename = `analytics-${from}-${to}.csv`;

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.status(200).send(csv);
  } catch (error) {
    console.error('Error exporting analytics:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar analíticas',
    });
  }
};

// Función auxiliar para agrupar órdenes por período
function groupOrdersByPeriod(orders: any[], groupBy: string): any[] {
  const grouped: any = {};

  orders.forEach((order) => {
    const date = new Date(order.createdAt);
    let period: string;

    switch (groupBy) {
      case 'day':
        period = date.toISOString().split('T')[0]; // YYYY-MM-DD
        break;
      case 'week': {
        const weekStart = getWeekStart(date);
        period = weekStart.toISOString().split('T')[0];
        break;
      }
      case 'month':
        period = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
        break;
      case 'year':
        period = String(date.getFullYear());
        break;
      default:
        period = date.toISOString().split('T')[0];
    }

    if (!grouped[period]) {
      grouped[period] = {
        period,
        orders: 0,
        revenue: 0,
        prepTimes: [],
      };
    }

    grouped[period].orders += 1;
    grouped[period].revenue += order.total || 0;
    
    // Calcular tiempo de preparación si existen los timestamps (US-031)
    if (order.preparingStartedAt && order.readyAt) {
      const prepStart = new Date(order.preparingStartedAt).getTime();
      const readyTime = new Date(order.readyAt).getTime();
      const prepTimeMinutes = (readyTime - prepStart) / (1000 * 60);
      grouped[period].prepTimes.push(prepTimeMinutes);
    }
  });

  // Convertir a array y calcular promedios
  return Object.values(grouped).map((item: any) => ({
    period: item.period,
    orders: item.orders,
    revenue: item.revenue,
    avgPrepTime: item.prepTimes.length > 0
      ? item.prepTimes.reduce((a: number, b: number) => a + b, 0) / item.prepTimes.length
      : null,
  }));
}

// Función auxiliar para obtener el inicio de la semana
function getWeekStart(date: Date): Date {
  const d = new Date(date);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Lunes como inicio
  return new Date(d.setDate(diff));
}

// Función auxiliar para calcular productos vendidos
function calculateProductsSold(orders: any[]): any[] {
  const products: any = {};

  orders.forEach((order) => {
    if (order.items && Array.isArray(order.items)) {
      order.items.forEach((item: any) => {
        const productName = item.name || item.productName || 'Unknown';
        const quantity = item.quantity || 1;
        const price = item.price || 0;

        if (!products[productName]) {
          products[productName] = {
            name: productName,
            quantity: 0,
            revenue: 0,
          };
        }

        products[productName].quantity += quantity;
        products[productName].revenue += price * quantity;
      });
    }
  });

  // Convertir a array y ordenar por cantidad
  return Object.values(products).sort((a: any, b: any) => b.quantity - a.quantity);
}

// Exportar analíticas a XLSX
export const exportAnalyticsXLSX = async (req: Request, res: Response): Promise<void> => {
  try {
    const { from, to, groupBy, top } = req.body;

    if (!from || !to || !groupBy) {
      res.status(400).json({
        success: false,
        message: 'Parámetros requeridos: from, to, groupBy',
      });
      return;
    }

    const fromDate = new Date(from);
    const toDate = new Date(to);
    toDate.setHours(23, 59, 59, 999);

    const orders = await Order.find({
      createdAt: {
        $gte: fromDate,
        $lte: toDate,
      },
    }).sort({ createdAt: 1 });

    // Crear workbook y worksheet
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'Delicious Kitchen';
    workbook.created = new Date();

    // Hoja 1: Resumen de Ventas
    const summarySheet = workbook.addWorksheet('Resumen de Ventas');
    
    // Estilos para encabezados
    const headerStyle = {
      font: { bold: true, color: { argb: 'FFFFFFFF' }, size: 12 },
      fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } },
      alignment: { vertical: 'middle', horizontal: 'center' },
      border: {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      }
    } as Partial<ExcelJS.Style>;

    // Título del reporte
    summarySheet.mergeCells('A1:D1');
    const titleCell = summarySheet.getCell('A1');
    titleCell.value = 'Reporte de Ventas - Delicious Kitchen';
    titleCell.font = { bold: true, size: 16 };
    titleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Información del período
    summarySheet.mergeCells('A2:D2');
    const periodCell = summarySheet.getCell('A2');
    periodCell.value = `Período: ${from} al ${to}`;
    periodCell.alignment = { horizontal: 'center' };
    
    // Espacio
    summarySheet.addRow([]);

    // Encabezados
    const headerRow = summarySheet.addRow(['Período', 'Total Órdenes', 'Ingresos Totales ($)', 'Tiempo Prep. Promedio (min)']);
    headerRow.eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    // Agrupar datos
    const groupedData = groupOrdersByPeriod(orders, groupBy);
    
    // Agregar datos
    groupedData.forEach((item: any) => {
      const row = summarySheet.addRow([
        item.period,
        item.orders,
        item.revenue,
        item.avgPrepTime ? Math.round(item.avgPrepTime) : 'N/A'
      ]);
      
      // Formato moneda para ingresos
      row.getCell(3).numFmt = '$#,##0.00';
    });

    // Totales
    const totalOrders = groupedData.reduce((sum: number, item: any) => sum + item.orders, 0);
    const totalRevenue = groupedData.reduce((sum: number, item: any) => sum + item.revenue, 0);
    
    summarySheet.addRow([]);
    const totalRow = summarySheet.addRow(['TOTAL', totalOrders, totalRevenue, '']);
    totalRow.font = { bold: true };
    totalRow.getCell(3).numFmt = '$#,##0.00';

    // Ajustar anchos de columna
    summarySheet.columns = [
      { width: 20 },
      { width: 18 },
      { width: 22 },
      { width: 28 }
    ];

    // Hoja 2: Productos Vendidos
    const productsSheet = workbook.addWorksheet('Productos Vendidos');
    
    // Título
    productsSheet.mergeCells('A1:C1');
    const productTitleCell = productsSheet.getCell('A1');
    productTitleCell.value = 'Top Productos Vendidos';
    productTitleCell.font = { bold: true, size: 14 };
    productTitleCell.alignment = { horizontal: 'center', vertical: 'middle' };
    
    productsSheet.addRow([]);

    // Encabezados
    const productHeaderRow = productsSheet.addRow(['Producto', 'Cantidad Vendida', 'Ingresos ($)']);
    productHeaderRow.eachCell((cell) => {
      Object.assign(cell, headerStyle);
    });

    // Calcular productos vendidos
    const productsSold = calculateProductsSold(orders);
    const topProducts = top ? productsSold.slice(0, parseInt(top.toString())) : productsSold;
    
    // Agregar datos de productos
    topProducts.forEach((product: any) => {
      const row = productsSheet.addRow([
        product.name,
        product.quantity,
        product.revenue
      ]);
      row.getCell(3).numFmt = '$#,##0.00';
    });

    // Totales de productos
    const totalQuantity = topProducts.reduce((sum: number, p: any) => sum + p.quantity, 0);
    const totalProductRevenue = topProducts.reduce((sum: number, p: any) => sum + p.revenue, 0);
    
    productsSheet.addRow([]);
    const productTotalRow = productsSheet.addRow(['TOTAL', totalQuantity, totalProductRevenue]);
    productTotalRow.font = { bold: true };
    productTotalRow.getCell(3).numFmt = '$#,##0.00';

    // Ajustar anchos de columna
    productsSheet.columns = [
      { width: 40 },
      { width: 20 },
      { width: 20 }
    ];

    // Generar nombre de archivo según US-030
    const today = new Date().toISOString().split('T')[0];
    const filename = `reporte_ventas_${today}.xlsx`;

    // Configurar headers de respuesta
    res.setHeader(
      'Content-Type',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    );
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);

    // Escribir a buffer y enviar
    const buffer = await workbook.xlsx.writeBuffer();
    res.status(200).send(buffer);

  } catch (error) {
    console.error('Error exporting analytics to XLSX:', error);
    res.status(500).json({
      success: false,
      message: 'Error al exportar analíticas a XLSX',
    });
  }
};
