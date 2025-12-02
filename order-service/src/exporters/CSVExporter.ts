import { ICSVExporter } from '../interfaces/ICSVExporter';
import { AnalyticsResponseDTO, CSVExportRequestDTO } from '../dtos/analytics';
import { Readable } from 'stream';
const { stringify } = require('csv-stringify/sync');

/**
 * Exportador de CSV
 * Cumple con Single Responsibility Principle: Solo generación de CSV
 */
export class CSVExporter implements ICSVExporter {
  export(analytics: AnalyticsResponseDTO | null, query: CSVExportRequestDTO): Readable {
    const readable = new Readable({ read() {} });

    // Definir columnas
    const columns = query.columns?.length
      ? query.columns
      : ['period', 'totalOrders', 'totalRevenue', 'productId', 'productName', 'quantity', 'avgPrepTime'];

    // Preparar datos
    const records: any[] = [];

    if (!analytics || !analytics.series || !analytics.productsSold) {
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

    // Generar CSV con punto y coma para Excel español
    try {
      const output = stringify(records, {
        header: true,
        columns: columns,
        delimiter: ';',
        quote: '"',
        quoted: true,
        quoted_empty: true
      });
      // BOM UTF-8 para Excel
      readable.push('\uFEFF' + output);
      readable.push(null);
    } catch (err) {
      console.error('Error generando CSV:', err);
      readable.push('Error generating CSV report\n');
      readable.push(null);
    }

    return readable;
  }
}
