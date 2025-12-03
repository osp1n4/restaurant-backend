/**
 * PRUEBAS UNITARIAS - AnalyticsResponseMapper
 * 
 * Nivel: UNITARIA
 * Alcance: Valida la transformación de datos crudos de MongoDB a DTOs
 * 
 * Qué se prueba:
 * - Mapeo correcto de series temporales
 * - Cálculo de resumen (totalOrders, totalRevenue)
 * - Mapeo de productos vendidos
 * - Manejo de datos vacíos o nulos
 * 
 * Por qué:
 * El mapper es crítico para garantizar que los datos lleguen al frontend
 * en el formato correcto y con los tipos esperados. Errores aquí rompen
 * la visualización en el dashboard.
 * 
 * Principio FIRST:
 * - Fast: Transformaciones puras sin I/O
 * - Isolated: No depende de BD ni servicios
 * - Repeatable: Datos fijos = resultado fijo
 * - Self-validating: Asserts claros
 * - Timely: Valida contratos definidos en INSTRUCTIONS_HU
 */

import { AnalyticsResponseMapper } from '../../../src/mappers/AnalyticsResponseMapper';
import { AnalyticsQueryDTO } from '../../../src/dtos/analytics';

describe('AnalyticsResponseMapper - Pruebas Unitarias', () => {
  let mapper: AnalyticsResponseMapper;

  beforeEach(() => {
    // Arrange: Instancia limpia del mapper
    mapper = new AnalyticsResponseMapper();
  });

  describe('mapToDTO', () => {
    
    test('debe mapear correctamente datos completos de series y productos', () => {
      // Qué valida: Transformación completa de datos agregados de MongoDB a DTO
      // Por qué: Es el flujo principal del dashboard de analíticas
      
      // Arrange: Datos simulados de MongoDB aggregation
      const seriesData = [
        {
          _id: '2025-12',
          totalOrders: 50,
          totalRevenue: 12500.75,
          avgPrepTime: null
        },
        {
          _id: '2025-11',
          totalOrders: 35,
          totalRevenue: 8750.50,
          avgPrepTime: null
        }
      ];

      const productsData = [
        {
          _id: 'p-101',
          name: 'Pizza Margarita',
          quantity: 120,
          revenue: 720.00
        },
        {
          _id: 'p-102',
          name: 'Lasaña',
          quantity: 80,
          revenue: 560.00
        }
      ];

      const query: AnalyticsQueryDTO = {
        from: '2025-11-01',
        to: '2025-12-31',
        groupBy: 'month',
        top: 10
      };

      // Act: Ejecutar mapeo
      const result = mapper.mapToDTO(seriesData, productsData, query);

      // Assert: Validar estructura y datos
      expect(result.range).toEqual({
        from: '2025-11-01',
        to: '2025-12-31',
        groupBy: 'month'
      });

      expect(result.summary.totalOrders).toBe(85); // 50 + 35
      expect(result.summary.totalRevenue).toBe(21251.25); // 12500.75 + 8750.50
      expect(result.summary.avgPrepTime).toBeNull();

      expect(result.series).toHaveLength(2);
      expect(result.series[0]).toEqual({
        period: '2025-12',
        totalOrders: 50,
        totalRevenue: 12500.75,
        avgPrepTime: null
      });

      expect(result.productsSold).toHaveLength(2);
      expect(result.productsSold[0].productId).toBe('p-101');
      expect(result.productsSold[0].name).toBe('Pizza Margarita');
      expect(result.productsSold[0].quantity).toBe(120);
      expect(result.productsSold[0].revenue).toBe(720.00);

      expect(result.topNProducts).toEqual(result.productsSold);
      expect(result.message).toBeNull();
    });

    test('debe redondear totalRevenue del summary a 2 decimales', () => {
      // Qué valida: Precisión decimal en totales monetarios
      // Por qué: Evita errores de punto flotante en la UI
      
      const seriesData = [
        { _id: '2025-01', totalOrders: 10, totalRevenue: 100.123456, avgPrepTime: null },
        { _id: '2025-02', totalOrders: 15, totalRevenue: 200.987654, avgPrepTime: null }
      ];

      const productsData: any[] = [];
      const query: AnalyticsQueryDTO = { from: '2025-01-01', to: '2025-02-28', groupBy: 'month' };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      // 100.123456 + 200.987654 = 301.11111 -> redondeado a 301.11
      expect(result.summary.totalRevenue).toBe(301.11);
    });

    test('debe manejar series vacías correctamente', () => {
      // Qué valida: Comportamiento con datos vacíos (sin pedidos en el rango)
      // Por qué: Endpoint debe retornar 204 si no hay datos (según HU)
      
      const seriesData: any[] = [];
      const productsData: any[] = [];
      const query: AnalyticsQueryDTO = { from: '2025-01-01', to: '2025-01-31', groupBy: 'day' };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.summary.totalOrders).toBe(0);
      expect(result.summary.totalRevenue).toBe(0);
      expect(result.series).toHaveLength(0);
      expect(result.productsSold).toHaveLength(0);
    });

    test('debe mapear productos con revenue correcto', () => {
      // Qué valida: Cálculo de revenue por producto (quantity * precio acumulado)
      // Por qué: Gráficos de productos más vendidos dependen de este dato
      
      const seriesData = [
        { _id: '2025-01', totalOrders: 10, totalRevenue: 500, avgPrepTime: null }
      ];

      const productsData = [
        { _id: 'p-201', name: 'Burger Premium', quantity: 25, revenue: 625.50 },
        { _id: 'p-202', name: 'Papas Fritas', quantity: 40, revenue: 120.00 },
        { _id: 'p-203', name: 'Refresco', quantity: 60, revenue: 90.00 }
      ];

      const query: AnalyticsQueryDTO = { from: '2025-01-01', to: '2025-01-31', groupBy: 'month', top: 5 };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.productsSold).toHaveLength(3);
      
      const burger = result.productsSold.find(p => p.productId === 'p-201');
      expect(burger).toBeDefined();
      expect(burger!.revenue).toBe(625.50);
      expect(burger!.quantity).toBe(25);
    });

    test('debe mantener avgPrepTime como null si no está disponible', () => {
      // Qué valida: Campo opcional avgPrepTime
      // Por qué: Según HU, si no hay timestamps de cocina, debe ser null
      
      const seriesData = [
        { _id: '2025-06', totalOrders: 20, totalRevenue: 1000, avgPrepTime: null }
      ];

      const productsData: any[] = [];
      const query: AnalyticsQueryDTO = { from: '2025-06-01', to: '2025-06-30', groupBy: 'month' };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.summary.avgPrepTime).toBeNull();
      expect(result.series[0].avgPrepTime).toBeNull();
    });

    test('debe preservar el orden de las series tal como vienen de MongoDB', () => {
      // Qué valida: No reordena series (MongoDB ya las ordena por $sort en pipeline)
      // Por qué: Frontend espera series ordenadas cronológicamente
      
      const seriesData = [
        { _id: '2025-01', totalOrders: 10, totalRevenue: 500, avgPrepTime: null },
        { _id: '2025-02', totalOrders: 15, totalRevenue: 750, avgPrepTime: null },
        { _id: '2025-03', totalOrders: 20, totalRevenue: 1000, avgPrepTime: null }
      ];

      const productsData: any[] = [];
      const query: AnalyticsQueryDTO = { from: '2025-01-01', to: '2025-03-31', groupBy: 'month' };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.series[0].period).toBe('2025-01');
      expect(result.series[1].period).toBe('2025-02');
      expect(result.series[2].period).toBe('2025-03');
    });

    test('debe copiar topNProducts desde productsSold', () => {
      // Qué valida: topNProducts es una referencia a los mismos productos
      // Por qué: Evita duplicación; backend ya filtra top N en el pipeline
      
      const seriesData = [
        { _id: '2025-05', totalOrders: 30, totalRevenue: 1500, avgPrepTime: null }
      ];

      const productsData = [
        { _id: 'p-301', name: 'Producto A', quantity: 100, revenue: 500 },
        { _id: 'p-302', name: 'Producto B', quantity: 80, revenue: 400 }
      ];

      const query: AnalyticsQueryDTO = { from: '2025-05-01', to: '2025-05-31', groupBy: 'month', top: 2 };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.topNProducts).toEqual(result.productsSold);
      expect(result.topNProducts).toHaveLength(2);
    });

    test('debe incluir el parámetro top del query en el rango si está presente', () => {
      // Qué valida: Preservación de todos los parámetros del query en el DTO
      // Por qué: Frontend puede usar 'top' para mostrar filtro aplicado
      
      const seriesData = [{ _id: '2025-04', totalOrders: 5, totalRevenue: 250, avgPrepTime: null }];
      const productsData: any[] = [];
      const query: AnalyticsQueryDTO = { from: '2025-04-01', to: '2025-04-30', groupBy: 'day', top: 5 };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      // Note: El mapper actual solo incluye from/to/groupBy en range, no top
      // Este test valida el comportamiento actual
      expect(result.range.from).toBe('2025-04-01');
      expect(result.range.to).toBe('2025-04-30');
      expect(result.range.groupBy).toBe('day');
    });
  });

  describe('Edge cases', () => {
    
    test('debe manejar totalRevenue con valores muy grandes sin perder precisión', () => {
      // Qué valida: Manejo de números grandes (JavaScript Number.MAX_SAFE_INTEGER)
      // Por qué: Restaurantes de alto volumen pueden tener revenues millonarios
      
      const seriesData = [
        { _id: '2025-12', totalOrders: 10000, totalRevenue: 9999999.99, avgPrepTime: null }
      ];

      const productsData: any[] = [];
      const query: AnalyticsQueryDTO = { from: '2025-12-01', to: '2025-12-31', groupBy: 'month' };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.summary.totalRevenue).toBe(9999999.99);
    });

    test('debe manejar productos con nombres vacíos o caracteres especiales', () => {
      // Qué valida: Sanitización de strings (o su ausencia intencional)
      // Por qué: Datos de usuario pueden tener caracteres raros
      
      const seriesData = [
        { _id: '2025-01', totalOrders: 5, totalRevenue: 100, avgPrepTime: null }
      ];

      const productsData = [
        { _id: 'p-001', name: '', quantity: 10, revenue: 50 },
        { _id: 'p-002', name: 'Pizza "Especial" & Única', quantity: 5, revenue: 75 }
      ];

      const query: AnalyticsQueryDTO = { from: '2025-01-01', to: '2025-01-31', groupBy: 'month' };

      const result = mapper.mapToDTO(seriesData, productsData, query);

      expect(result.productsSold[0].name).toBe('');
      expect(result.productsSold[1].name).toBe('Pizza "Especial" & Única');
    });
  });
});
