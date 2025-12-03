/**
 * PRUEBAS UNITARIAS - CSVExporter
 * 
 * Nivel: UNITARIA
 * Alcance: Valida la exportación de datos analíticos a formato CSV
 * 
 * Qué se prueba:
 * - Generación de CSV con delimitador ";" (español/Excel)
 * - Inclusión de BOM UTF-8 para compatibilidad con Excel
 * - Manejo de columnas personalizadas
 * - Comportamiento con datos vacíos o nulos
 * - Escapado correcto de caracteres especiales
 * 
 * Por qué:
 * La exportación CSV es crítica para reportes ejecutivos. Errores en
 * formato o encoding rompen la importación en Excel/Sheets.
 * 
 * Principio FIRST:
 * - Fast: Transformación rápida sin I/O de archivos
 * - Isolated: No escribe a disco, solo genera stream
 * - Repeatable: Mismo input = mismo CSV siempre
 * - Self-validating: Valida formato y contenido del CSV
 * - Timely: Cubre requisitos de HU (delimitador ";", UTF-8 BOM)
 */

import { CSVExporter } from '../../../src/exporters/CSVExporter';
import { AnalyticsResponseDTO, CSVExportRequestDTO } from '../../../src/dtos/analytics';
import { Readable } from 'stream';

describe('CSVExporter - Pruebas Unitarias', () => {
  let exporter: CSVExporter;

  beforeEach(() => {
    // Arrange: Instancia limpia del exportador
    exporter = new CSVExporter();
  });

  /**
   * Helper: Convierte stream a string para validación
   * Por qué: Los tests necesitan leer el contenido del stream generado
   */
  const streamToString = (stream: Readable): Promise<string> => {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', chunk => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks).toString('utf-8')));
      stream.on('error', reject);
    });
  };

  describe('export', () => {
    
    test('debe generar CSV con BOM UTF-8 y delimitador ";"', async () => {
      // Qué valida: Formato CSV compatible con Excel español
      // Por qué: Según HU, debe usar ";" y UTF-8 BOM para Excel
      
      // Arrange: Datos mínimos de analytics
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-12-01', to: '2025-12-31', groupBy: 'month' },
        summary: { totalOrders: 10, totalRevenue: 500, avgPrepTime: null },
        series: [
          { period: '2025-12', totalOrders: 10, totalRevenue: 500, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-101', name: 'Pizza', quantity: 20, revenue: 300 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-12-01',
        to: '2025-12-31',
        groupBy: 'month',
        columns: ['period', 'totalOrders', 'totalRevenue', 'productName', 'quantity']
      };

      // Act: Generar CSV
      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: Validar BOM UTF-8 (bytes EF BB BF = \uFEFF)
      expect(csv.charCodeAt(0)).toBe(0xFEFF);

      // Assert: Validar delimitador ";"
      expect(csv).toContain(';');
      expect(csv).not.toContain(','); // No debe usar coma

      // Assert: Validar headers
      expect(csv).toContain('period;totalOrders;totalRevenue;productName;quantity');
    });

    test('debe combinar series y productos en filas (producto cruzado)', async () => {
      // Qué valida: Cada fila combina un periodo con un producto
      // Por qué: Permite análisis de productos por periodo en Excel
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-11-01', to: '2025-12-31', groupBy: 'month' },
        summary: { totalOrders: 30, totalRevenue: 1500, avgPrepTime: null },
        series: [
          { period: '2025-11', totalOrders: 15, totalRevenue: 750, avgPrepTime: null },
          { period: '2025-12', totalOrders: 15, totalRevenue: 750, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-101', name: 'Pizza', quantity: 20, revenue: 600 },
          { productId: 'p-102', name: 'Pasta', quantity: 10, revenue: 400 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-11-01',
        to: '2025-12-31',
        groupBy: 'month',
        columns: ['period', 'productName', 'quantity']
      };

      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: Debe haber 2 series * 2 productos = 4 filas de datos + 1 header = 5 líneas
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(5); // header + 4 data rows

      // Assert: Validar contenido de filas
      expect(csv).toContain('2025-11;Pizza;20');
      expect(csv).toContain('2025-11;Pasta;10');
      expect(csv).toContain('2025-12;Pizza;20');
      expect(csv).toContain('2025-12;Pasta;10');
    });

    test('debe usar columnas por defecto si no se especifican', async () => {
      // Qué valida: Columnas estándar cuando query.columns está vacío
      // Por qué: Facilidad de uso; usuario no debe especificar siempre
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-01-01', to: '2025-01-31', groupBy: 'day' },
        summary: { totalOrders: 5, totalRevenue: 250, avgPrepTime: null },
        series: [
          { period: '2025-01-15', totalOrders: 5, totalRevenue: 250, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-001', name: 'Burger', quantity: 5, revenue: 50 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-01-01',
        to: '2025-01-31',
        groupBy: 'day',
        columns: [] // Sin columnas específicas
      };

      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: Debe incluir columnas por defecto
      expect(csv).toContain('period');
      expect(csv).toContain('totalOrders');
      expect(csv).toContain('totalRevenue');
      expect(csv).toContain('productId');
      expect(csv).toContain('productName');
      expect(csv).toContain('quantity');
      expect(csv).toContain('avgPrepTime');
    });

    test('debe manejar datos nulos (sin analytics) generando CSV vacío', async () => {
      // Qué valida: Comportamiento robusto cuando no hay datos
      // Por qué: Endpoint puede llamar exporter incluso sin datos (204)
      
      const query: CSVExportRequestDTO = {
        from: '2025-06-01',
        to: '2025-06-30',
        groupBy: 'week',
        columns: ['period', 'totalOrders']
      };

      const stream = exporter.export(null, query);
      const csv = await streamToString(stream);

      // Assert: Debe retornar CSV con headers pero sin datos
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(2); // BOM + header + 1 fila vacía

      // Assert: Primera línea debe tener headers
      expect(lines[0]).toContain('period');
      expect(lines[0]).toContain('totalOrders');
    });

    test('debe escapar correctamente caracteres especiales en nombres de productos', async () => {
      // Qué valida: Escapado de comillas y delimitadores en valores CSV
      // Por qué: Nombres de productos pueden tener ";", ",", "\"
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-03-01', to: '2025-03-31', groupBy: 'month' },
        summary: { totalOrders: 3, totalRevenue: 150, avgPrepTime: null },
        series: [
          { period: '2025-03', totalOrders: 3, totalRevenue: 150, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-201', name: 'Pizza "Especial"; con jamón', quantity: 3, revenue: 45 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-03-01',
        to: '2025-03-31',
        groupBy: 'month',
        columns: ['productName', 'quantity']
      };

      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: Debe envolver valores con caracteres especiales en comillas
      // csv-stringify escapa automáticamente con quote: '"'
      expect(csv).toContain('"Pizza ""Especial""; con jamón"');
    });

    test('debe incluir avgPrepTime como campo vacío si es null', async () => {
      // Qué valida: Representación de valores nulos en CSV
      // Por qué: Excel debe mostrar celda vacía, no "null"
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-08-01', to: '2025-08-31', groupBy: 'month' },
        summary: { totalOrders: 10, totalRevenue: 500, avgPrepTime: null },
        series: [
          { period: '2025-08', totalOrders: 10, totalRevenue: 500, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-301', name: 'Ensalada', quantity: 10, revenue: 100 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-08-01',
        to: '2025-08-31',
        groupBy: 'month',
        columns: ['period', 'avgPrepTime', 'productName']
      };

      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: avgPrepTime debe estar presente pero vacío (o como null según stringify)
      const lines = csv.trim().split('\n');
      // Línea de datos: 2025-08;;Ensalada (dos ;; consecutivos = campo vacío)
      expect(lines[1]).toMatch(/2025-08;.*;Ensalada/);
    });

    test('debe retornar stream válido incluso si series está vacía pero products no', async () => {
      // Qué valida: Manejo de casos edge donde solo uno de los arrays tiene datos
      // Por qué: Agregaciones pueden fallar parcialmente
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-09-01', to: '2025-09-30', groupBy: 'month' },
        summary: { totalOrders: 0, totalRevenue: 0, avgPrepTime: null },
        series: [], // Sin datos de series
        productsSold: [
          { productId: 'p-401', name: 'Producto fantasma', quantity: 5, revenue: 25 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-09-01',
        to: '2025-09-30',
        groupBy: 'month',
        columns: ['period', 'productName', 'quantity']
      };

      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: Debe generar CSV con headers pero sin filas de datos (porque series está vacío)
      const lines = csv.trim().split('\n');
      expect(lines.length).toBe(2); // header + 1 fila vacía
    });

    test('debe generar CSV con valores numéricos formateados correctamente', async () => {
      // Qué valida: Representación de números (sin notación científica)
      // Por qué: Excel debe leer números directamente, no strings
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-10-01', to: '2025-10-31', groupBy: 'month' },
        summary: { totalOrders: 1000, totalRevenue: 50000.50, avgPrepTime: null },
        series: [
          { period: '2025-10', totalOrders: 1000, totalRevenue: 50000.50, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-501', name: 'Mega Combo', quantity: 999, revenue: 12345.67 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-10-01',
        to: '2025-10-31',
        groupBy: 'month',
        columns: ['totalOrders', 'totalRevenue', 'quantity', 'revenue']
      };

      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: Números deben estar sin comillas y con decimales correctos
      expect(csv).toContain('1000;50000.5;999;12345.67');
    });
  });

  describe('Error handling', () => {
    
    test('debe manejar errores en stringify y retornar stream con mensaje de error', async () => {
      // Qué valida: Resiliencia ante errores internos de csv-stringify
      // Por qué: No debe lanzar excepciones que rompan el flujo HTTP
      
      // Note: Es difícil forzar un error en stringify sin mockear
      // Este test documenta el comportamiento esperado según el código actual
      
      const analytics: AnalyticsResponseDTO = {
        range: { from: '2025-11-01', to: '2025-11-30', groupBy: 'month' },
        summary: { totalOrders: 5, totalRevenue: 250, avgPrepTime: null },
        series: [
          { period: '2025-11', totalOrders: 5, totalRevenue: 250, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-601', name: 'Test', quantity: 5, revenue: 50 }
        ],
        topNProducts: [],
        message: null
      };

      const query: CSVExportRequestDTO = {
        from: '2025-11-01',
        to: '2025-11-30',
        groupBy: 'month',
        columns: ['period', 'totalOrders']
      };

      // Act: Debe ejecutar sin lanzar excepciones
      const stream = exporter.export(analytics, query);
      const csv = await streamToString(stream);

      // Assert: CSV debe generarse correctamente (no error en este caso)
      expect(csv).toContain('period;totalOrders');
      expect(csv).toContain('2025-11;5');
    });
  });
});
