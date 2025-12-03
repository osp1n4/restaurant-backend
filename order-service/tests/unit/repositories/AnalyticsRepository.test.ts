/**
 * PRUEBAS UNITARIAS - AnalyticsRepository
 * 
 * Nivel: UNITARIA
 * Alcance: Valida la lógica de agregación MongoDB y validaciones de negocio
 * 
 * Qué se prueba:
 * - Validación de rango máximo de 12 meses
 * - Construcción correcta de pipelines de agregación
 * - Uso de estrategias de agrupación
 * - Delegación a mapper y exporter
 * - Manejo de casos sin datos
 * 
 * Por qué:
 * El repositorio es el corazón de la funcionalidad de analíticas. Contiene
 * la lógica más compleja (pipelines MongoDB) y validaciones críticas de negocio.
 * 
 * Principio FIRST:
 * - Fast: Mongoose model mockeado, sin DB real
 * - Isolated: Todas las dependencias son mocks
 * - Repeatable: Datos de prueba fijos
 * - Self-validating: Asserts verifican comportamiento
 * - Timely: Cubre reglas de negocio de la HU
 */

import { AnalyticsRepository } from '../../../src/repositories/AnalyticsRepository';
import { AnalyticsQueryDTO, CSVExportRequestDTO } from '../../../src/dtos/analytics';
import { Model } from 'mongoose';
import { IOrder } from '../../../src/models/Order';

describe('AnalyticsRepository - Pruebas Unitarias', () => {
  let repository: AnalyticsRepository;
  let mockOrderModel: jest.Mocked<Model<IOrder>>;
  let mockAggregate: jest.Mock;
  let mockExec: jest.Mock;

  beforeEach(() => {
    // Arrange: Mock de Mongoose aggregate chain
    mockExec = jest.fn();
    mockAggregate = jest.fn().mockReturnValue({ exec: mockExec });

    // Mock del modelo Order con aggregate
    mockOrderModel = {
      aggregate: mockAggregate
    } as any;

    // Crear repositorio con modelo mockeado
    repository = new AnalyticsRepository(mockOrderModel);
  });

  describe('Validación de rango de fechas', () => {
    
    test('debe lanzar error RANGE_EXCEEDED si el rango supera 12 meses', async () => {
      // Qué valida: Regla de negocio - máximo 12 meses de consulta
      // Por qué: Según HU, protege contra queries muy pesadas
      
      // Arrange: Rango de 13 meses
      const query: AnalyticsQueryDTO = {
        from: '2024-01-01',
        to: '2025-02-01', // 13 meses después
        groupBy: 'month'
      };

      // Act & Assert: Debe lanzar error con código específico
      await expect(repository.getAnalytics(query)).rejects.toThrow('El rango de fechas excede el máximo permitido');
      
      // Validar que tiene el código RANGE_EXCEEDED
      try {
        await repository.getAnalytics(query);
      } catch (error: any) {
        expect(error.code).toBe('RANGE_EXCEEDED');
      }

      // Assert: No debe haber ejecutado el aggregate
      expect(mockAggregate).not.toHaveBeenCalled();
    });

    test('debe permitir rango exacto de 12 meses', async () => {
      // Qué valida: Límite exacto es válido (12.0 meses)
      // Por qué: Casos borde importantes para validación
      
      // Arrange: Exactamente 12 meses
      const query: AnalyticsQueryDTO = {
        from: '2024-01-01',
        to: '2025-01-01', // Exactamente 12 meses
        groupBy: 'year'
      };

      // Mock: Simular que aggregate retorna datos vacíos
      mockExec.mockResolvedValue([]);

      // Act: No debe lanzar error
      const result = await repository.getAnalytics(query);

      // Assert: Debe haber ejecutado aggregate
      expect(mockAggregate).toHaveBeenCalled();
      expect(result).toBeNull(); // Porque no hay datos
    });

    test('debe permitir rangos menores a 12 meses', async () => {
      // Qué valida: Rangos normales (< 12 meses) funcionan
      // Por qué: Caso más común en producción
      
      const query: AnalyticsQueryDTO = {
        from: '2025-11-01',
        to: '2025-11-30', // 1 mes
        groupBy: 'day'
      };

      mockExec.mockResolvedValue([
        { _id: '2025-11-15', totalOrders: 10, totalRevenue: 500, avgPrepTime: null }
      ]);

      const result = await repository.getAnalytics(query);

      expect(mockAggregate).toHaveBeenCalled();
      expect(result).not.toBeNull();
    });
  });

  describe('Construcción de pipelines de agregación', () => {
    
    test('debe construir pipeline con stage $match para filtrar por rango de fechas', async () => {
      // Qué valida: Primer stage del pipeline filtra por createdAt
      // Por qué: Fundamental para obtener solo pedidos del periodo solicitado
      
      const query: AnalyticsQueryDTO = {
        from: '2025-12-01',
        to: '2025-12-31',
        groupBy: 'month'
      };

      mockExec.mockResolvedValue([
        { _id: '2025-12', totalOrders: 50, totalRevenue: 2500, avgPrepTime: null }
      ]);

      await repository.getAnalytics(query);

      // Assert: Debe haber llamado aggregate
      expect(mockAggregate).toHaveBeenCalled();

      // Obtener el pipeline pasado al aggregate
      const pipeline = mockAggregate.mock.calls[0][0];

      // Validar que el primer stage es $match con rango de fechas
      expect(pipeline[0]).toHaveProperty('$match');
      expect(pipeline[0].$match).toHaveProperty('createdAt');
      expect(pipeline[0].$match.createdAt).toHaveProperty('$gte');
      expect(pipeline[0].$match.createdAt).toHaveProperty('$lte');
    });

    test('debe incluir stage $unwind para descomponer array de items', async () => {
      // Qué valida: Pipeline descompone items para contar productos
      // Por qué: Necesario para agregar por producto
      
      const query: AnalyticsQueryDTO = {
        from: '2025-01-01',
        to: '2025-01-31',
        groupBy: 'day'
      };

      mockExec.mockResolvedValue([
        { _id: '2025-01-15', totalOrders: 5, totalRevenue: 250, avgPrepTime: null }
      ]);

      await repository.getAnalytics(query);

      const pipeline = mockAggregate.mock.calls[0][0];

      // Assert: Debe contener $unwind de items
      const unwindStage = pipeline.find((stage: any) => stage.$unwind);
      expect(unwindStage).toBeDefined();
      expect(unwindStage.$unwind).toBe('$items');
    });

    test('debe construir stage $group con expresión de periodo de la estrategia', async () => {
      // Qué valida: Uso de IGroupingStrategy para generar _id del group
      // Por qué: Estrategia define cómo agrupar (día/semana/mes/año)
      
      const query: AnalyticsQueryDTO = {
        from: '2025-06-01',
        to: '2025-06-30',
        groupBy: 'week'
      };

      mockExec.mockResolvedValue([
        { _id: '2025-23', totalOrders: 10, totalRevenue: 500, avgPrepTime: null }
      ]);

      await repository.getAnalytics(query);

      const pipeline = mockAggregate.mock.calls[0][0];

      // Assert: Debe contener $group con _id basado en periodo
      const groupStage = pipeline.find((stage: any) => stage.$group && stage.$group._id);
      expect(groupStage).toBeDefined();
      expect(groupStage.$group._id).toHaveProperty('$dateToString');
    });

    test('debe incluir acumuladores para totalOrders y totalRevenue', async () => {
      // Qué valida: Agregación suma órdenes y revenue
      // Por qué: Métricas principales del dashboard
      
      const query: AnalyticsQueryDTO = {
        from: '2025-03-01',
        to: '2025-03-31',
        groupBy: 'month'
      };

      mockExec.mockResolvedValue([
        { _id: '2025-03', totalOrders: 25, totalRevenue: 1250, avgPrepTime: null }
      ]);

      await repository.getAnalytics(query);

      const pipeline = mockAggregate.mock.calls[0][0];

      const groupStage = pipeline.find((stage: any) => stage.$group);
      expect(groupStage).toBeDefined();
      expect(groupStage.$group).toHaveProperty('totalOrders');
      expect(groupStage.$group).toHaveProperty('totalRevenue');
    });
  });

  describe('Pipeline de productos vendidos', () => {
    
    test('debe ejecutar segundo aggregate para obtener productos vendidos', async () => {
      // Qué valida: Se ejecutan 2 aggregates (series + productos)
      // Por qué: Necesitamos datos separados para series temporales y top productos
      
      const query: AnalyticsQueryDTO = {
        from: '2025-08-01',
        to: '2025-08-31',
        groupBy: 'month',
        top: 5
      };

      // Mock: Primera llamada retorna series, segunda retorna productos
      mockExec
        .mockResolvedValueOnce([
          { _id: '2025-08', totalOrders: 30, totalRevenue: 1500, avgPrepTime: null }
        ])
        .mockResolvedValueOnce([
          { _id: 'p-101', name: 'Pizza', quantity: 50, revenue: 300 }
        ]);

      await repository.getAnalytics(query);

      // Assert: aggregate debe haberse llamado 2 veces
      expect(mockAggregate).toHaveBeenCalledTimes(2);
    });

    test('debe limitar productos con $limit basado en parámetro top', async () => {
      // Qué valida: Parámetro 'top' controla cuántos productos retornar
      // Por qué: Usuario puede querer top 5, top 10, etc.
      
      const query: AnalyticsQueryDTO = {
        from: '2025-09-01',
        to: '2025-09-30',
        groupBy: 'month',
        top: 3 // Solo top 3 productos
      };

      mockExec
        .mockResolvedValueOnce([
          { _id: '2025-09', totalOrders: 20, totalRevenue: 1000, avgPrepTime: null }
        ])
        .mockResolvedValueOnce([
          { _id: 'p-101', name: 'Producto A', quantity: 100, revenue: 500 },
          { _id: 'p-102', name: 'Producto B', quantity: 80, revenue: 400 },
          { _id: 'p-103', name: 'Producto C', quantity: 60, revenue: 300 }
        ]);

      await repository.getAnalytics(query);

      // Obtener el pipeline de productos (segunda llamada)
      const productsPipeline = mockAggregate.mock.calls[1][0];

      // Assert: Debe contener $limit con valor de 'top'
      const limitStage = productsPipeline.find((stage: any) => stage.$limit);
      expect(limitStage).toBeDefined();
      expect(limitStage.$limit).toBe(3);
    });

    test('debe usar top por defecto de 10 si no se especifica', async () => {
      // Qué valida: Valor por defecto del parámetro opcional 'top'
      // Por qué: HU menciona default 10
      
      const query: AnalyticsQueryDTO = {
        from: '2025-10-01',
        to: '2025-10-31',
        groupBy: 'month'
        // top no especificado
      };

      mockExec
        .mockResolvedValueOnce([
          { _id: '2025-10', totalOrders: 15, totalRevenue: 750, avgPrepTime: null }
        ])
        .mockResolvedValueOnce([]);

      await repository.getAnalytics(query);

      const productsPipeline = mockAggregate.mock.calls[1][0];
      const limitStage = productsPipeline.find((stage: any) => stage.$limit);
      
      expect(limitStage).toBeDefined();
      expect(limitStage.$limit).toBe(10);
    });
  });

  describe('Manejo de datos vacíos', () => {
    
    test('debe retornar null si aggregate de series retorna array vacío', async () => {
      // Qué valida: Sin datos = retornar null (no DTO vacío)
      // Por qué: Controller usa null para responder 204 con mensaje específico
      
      const query: AnalyticsQueryDTO = {
        from: '2025-05-01',
        to: '2025-05-31',
        groupBy: 'day'
      };

      mockExec.mockResolvedValue([]); // Sin datos

      const result = await repository.getAnalytics(query);

      expect(result).toBeNull();
      
      // Assert: No debe ejecutar segundo aggregate si el primero está vacío
      expect(mockAggregate).toHaveBeenCalledTimes(1);
    });

    test('debe retornar DTO completo aunque productos esté vacío', async () => {
      // Qué valida: Series con datos + productos vacíos = DTO válido
      // Por qué: Puede haber pedidos pero sin productos rastreables
      
      const query: AnalyticsQueryDTO = {
        from: '2025-07-01',
        to: '2025-07-31',
        groupBy: 'month'
      };

      mockExec
        .mockResolvedValueOnce([
          { _id: '2025-07', totalOrders: 5, totalRevenue: 250, avgPrepTime: null }
        ])
        .mockResolvedValueOnce([]); // Sin productos

      const result = await repository.getAnalytics(query);

      expect(result).not.toBeNull();
      expect(result!.series).toHaveLength(1);
      expect(result!.productsSold).toHaveLength(0);
      expect(result!.topNProducts).toHaveLength(0);
    });
  });

  describe('Integración con Mapper', () => {
    
    test('debe delegar mapeo de datos a AnalyticsResponseMapper', async () => {
      // Qué valida: Repositorio no mapea, delega a mapper
      // Por qué: SRP - repositorio ejecuta queries, mapper transforma datos
      
      const query: AnalyticsQueryDTO = {
        from: '2025-11-01',
        to: '2025-11-30',
        groupBy: 'week'
      };

      const seriesData = [
        { _id: '2025-44', totalOrders: 10, totalRevenue: 500, avgPrepTime: null }
      ];

      const productsData = [
        { _id: 'p-201', name: 'Burger', quantity: 20, revenue: 100 }
      ];

      mockExec
        .mockResolvedValueOnce(seriesData)
        .mockResolvedValueOnce(productsData);

      const result = await repository.getAnalytics(query);

      // Assert: Resultado debe ser DTO mapeado (no datos crudos de Mongo)
      expect(result).not.toBeNull();
      expect(result).toHaveProperty('range');
      expect(result).toHaveProperty('summary');
      expect(result).toHaveProperty('series');
      expect(result).toHaveProperty('productsSold');
      expect(result).toHaveProperty('topNProducts');
      expect(result).toHaveProperty('message');
    });
  });

  describe('streamCsv', () => {
    
    test('debe retornar stream de CSV generado por CSVExporter', () => {
      // Qué valida: Delegación a exporter para generar stream
      // Por qué: Repositorio orquesta, exporter implementa CSV
      
      const query: CSVExportRequestDTO = {
        from: '2025-12-01',
        to: '2025-12-31',
        groupBy: 'month',
        columns: ['period', 'totalOrders']
      };

      // Act: Obtener stream
      const stream = repository.streamCsv(query);

      // Assert: Debe retornar Readable stream
      expect(stream).toBeDefined();
      expect(typeof stream.on).toBe('function'); // Es un EventEmitter
      expect(typeof stream.pipe).toBe('function'); // Es un Stream
    });

    test('el stream debe ser consumible y contener datos CSV', (done) => {
      // Qué valida: Stream funcional que puede ser piped a response
      // Por qué: Controller hace stream.pipe(res)
      
      const query: CSVExportRequestDTO = {
        from: '2025-01-01',
        to: '2025-01-31',
        groupBy: 'day',
        columns: ['period', 'productName']
      };

      // Mock: Simular datos para el getAnalytics interno
      mockExec
        .mockResolvedValueOnce([
          { _id: '2025-01-15', totalOrders: 5, totalRevenue: 250, avgPrepTime: null }
        ])
        .mockResolvedValueOnce([
          { _id: 'p-301', name: 'Test Product', quantity: 5, revenue: 50 }
        ]);

      const stream = repository.streamCsv(query);

      const chunks: string[] = [];
      stream.on('data', (chunk) => chunks.push(chunk.toString()));
      stream.on('end', () => {
        const csv = chunks.join('');
        // Debe contener BOM y headers
        expect(csv.charCodeAt(0)).toBe(0xFEFF);
        expect(csv).toContain('period');
        expect(csv).toContain('productName');
        done();
      });
      stream.on('error', done);
    });
  });

  describe('Casos edge', () => {
    
    test('debe manejar fechas en borde de año correctamente', async () => {
      // Qué valida: Manejo de transición de año (2024-12 a 2025-01)
      // Por qué: Errores comunes en cálculos de fecha
      
      const query: AnalyticsQueryDTO = {
        from: '2024-12-15',
        to: '2025-01-15', // Cruza año
        groupBy: 'month'
      };

      mockExec
        .mockResolvedValueOnce([
          { _id: '2024-12', totalOrders: 20, totalRevenue: 1000, avgPrepTime: null },
          { _id: '2025-01', totalOrders: 15, totalRevenue: 750, avgPrepTime: null }
        ])
        .mockResolvedValueOnce([]);

      const result = await repository.getAnalytics(query);

      expect(result).not.toBeNull();
      expect(result!.series).toHaveLength(2);
      expect(result!.series[0].period).toBe('2024-12');
      expect(result!.series[1].period).toBe('2025-01');
    });

    test('debe manejar fechas con hora distinta de medianoche', async () => {
      // Qué valida: Normalización de fechas a inicio/fin de día
      // Por qué: Usuario puede enviar fechas con hora arbitraria
      
      // Note: El repositorio convierte from a 00:00:00 y to a 23:59:59
      const query: AnalyticsQueryDTO = {
        from: '2025-03-15', // Se convierte a 2025-03-15T00:00:00.000Z
        to: '2025-03-15',   // Se convierte a 2025-03-15T23:59:59.999Z
        groupBy: 'day'
      };

      mockExec.mockResolvedValue([
        { _id: '2025-03-15', totalOrders: 3, totalRevenue: 150, avgPrepTime: null }
      ]);

      const result = await repository.getAnalytics(query);

      expect(result).not.toBeNull();
      
      // Validar que el $match usa fechas normalizadas
      const pipeline = mockAggregate.mock.calls[0][0];
      const matchStage = pipeline[0];
      
      expect(matchStage.$match.createdAt.$gte).toBeInstanceOf(Date);
      expect(matchStage.$match.createdAt.$lte).toBeInstanceOf(Date);
    });
  });
});
