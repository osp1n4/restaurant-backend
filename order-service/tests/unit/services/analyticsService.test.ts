/**
 * PRUEBAS UNITARIAS - AnalyticsService
 * 
 * Nivel: UNITARIA
 * Alcance: Valida la orquestación del servicio de analíticas
 * 
 * Qué se prueba:
 * - Delegación correcta al repositorio
 * - Manejo de respuestas (datos vs null)
 * - Stream de CSV
 * - Principio de responsabilidad única (solo orquestación)
 * 
 * Por qué:
 * El servicio es el punto de entrada desde los controllers. Debe
 * delegar correctamente sin añadir lógica de negocio adicional.
 * 
 * Principio FIRST:
 * - Fast: Solo mocks, sin I/O real
 * - Isolated: Repository mockeado
 * - Repeatable: Comportamiento determinista
 * - Self-validating: Asserts claros
 * - Timely: Valida contratos entre capas
 */

import { AnalyticsService } from '../../../src/services/analyticsService';
import { IAnalyticsRepository } from '../../../src/interfaces/IAnalyticsRepository';
import { AnalyticsQueryDTO, AnalyticsResponseDTO, CSVExportRequestDTO } from '../../../src/dtos/analytics';
import { Readable } from 'stream';

describe('AnalyticsService - Pruebas Unitarias', () => {
  let service: AnalyticsService;
  let mockRepository: jest.Mocked<IAnalyticsRepository>;

  beforeEach(() => {
    // Arrange: Mock del repositorio con todas sus funciones
    mockRepository = {
      getAnalytics: jest.fn(),
      streamCsv: jest.fn()
    } as jest.Mocked<IAnalyticsRepository>;

    // Crear servicio con repositorio mockeado (inyección de dependencias)
    service = new AnalyticsService(mockRepository);
  });

  describe('getAnalytics', () => {
    
    test('debe delegar llamada al repositorio con los parámetros correctos', async () => {
      // Qué valida: El servicio pasa el query sin modificarlo al repositorio
      // Por qué: SRP - el servicio no debe transformar datos, solo orquestar
      
      // Arrange: Query de entrada
      const query: AnalyticsQueryDTO = {
        from: '2025-12-01',
        to: '2025-12-31',
        groupBy: 'month',
        top: 10
      };

      // Mock del response del repositorio
      const mockResponse: AnalyticsResponseDTO = {
        range: { from: '2025-12-01', to: '2025-12-31', groupBy: 'month' },
        summary: { totalOrders: 50, totalRevenue: 2500, avgPrepTime: null },
        series: [
          { period: '2025-12', totalOrders: 50, totalRevenue: 2500, avgPrepTime: null }
        ],
        productsSold: [
          { productId: 'p-101', name: 'Pizza', quantity: 100, revenue: 500 }
        ],
        topNProducts: [],
        message: null
      };

      mockRepository.getAnalytics.mockResolvedValue(mockResponse);

      // Act: Llamar al servicio
      const result = await service.getAnalytics(query);

      // Assert: Debe haber llamado al repositorio con el query exacto
      expect(mockRepository.getAnalytics).toHaveBeenCalledWith(query);
      expect(mockRepository.getAnalytics).toHaveBeenCalledTimes(1);

      // Assert: Debe retornar exactamente lo que el repositorio retornó
      expect(result).toEqual(mockResponse);
    });

    test('debe retornar null si el repositorio retorna null', async () => {
      // Qué valida: Propagación de "sin datos" desde repositorio
      // Por qué: Controller usa null para decidir responder 204 No Content
      
      const query: AnalyticsQueryDTO = {
        from: '2025-01-01',
        to: '2025-01-31',
        groupBy: 'day'
      };

      mockRepository.getAnalytics.mockResolvedValue(null);

      const result = await service.getAnalytics(query);

      expect(mockRepository.getAnalytics).toHaveBeenCalledWith(query);
      expect(result).toBeNull();
    });

    test('debe propagar errores del repositorio sin modificarlos', async () => {
      // Qué valida: Transparencia de errores (no los atrapa ni transforma)
      // Por qué: Controller maneja errores específicos (RANGE_EXCEEDED, etc.)
      
      const query: AnalyticsQueryDTO = {
        from: '2024-01-01',
        to: '2025-12-31', // Rango > 12 meses
        groupBy: 'month'
      };

      const rangeError = Object.assign(
        new Error('El rango de fechas excede el máximo permitido'),
        { code: 'RANGE_EXCEEDED' }
      );

      mockRepository.getAnalytics.mockRejectedValue(rangeError);

      // Act & Assert: Debe relanzar el error exacto
      await expect(service.getAnalytics(query)).rejects.toThrow('El rango de fechas excede el máximo permitido');
      await expect(service.getAnalytics(query)).rejects.toMatchObject({ code: 'RANGE_EXCEEDED' });
    });

    test('debe funcionar correctamente con query sin parámetro "top" (opcional)', async () => {
      // Qué valida: Manejo de parámetros opcionales en el DTO
      // Por qué: 'top' es opcional según la HU (default 10 en repositorio)
      
      const query: AnalyticsQueryDTO = {
        from: '2025-11-01',
        to: '2025-11-30',
        groupBy: 'week'
        // top no especificado
      };

      const mockResponse: AnalyticsResponseDTO = {
        range: { from: '2025-11-01', to: '2025-11-30', groupBy: 'week' },
        summary: { totalOrders: 20, totalRevenue: 1000, avgPrepTime: null },
        series: [],
        productsSold: [],
        topNProducts: [],
        message: null
      };

      mockRepository.getAnalytics.mockResolvedValue(mockResponse);

      const result = await service.getAnalytics(query);

      expect(mockRepository.getAnalytics).toHaveBeenCalledWith(query);
      expect(result).toEqual(mockResponse);
    });
  });

  describe('streamCsv', () => {
    
    test('debe delegar llamada de stream CSV al repositorio', () => {
      // Qué valida: Servicio pasa query de export al repositorio
      // Por qué: Stream debe generarse en la capa de repositorio/exporter
      
      // Arrange: Query de exportación
      const query: CSVExportRequestDTO = {
        from: '2025-12-01',
        to: '2025-12-31',
        groupBy: 'month',
        top: 10,
        columns: ['period', 'totalOrders', 'totalRevenue']
      };

      // Mock del stream
      const mockStream = new Readable({
        read() {
          this.push('period;totalOrders;totalRevenue\n');
          this.push('2025-12;50;2500\n');
          this.push(null); // End stream
        }
      });

      mockRepository.streamCsv.mockReturnValue(mockStream);

      // Act: Llamar al servicio
      const result = service.streamCsv(query);

      // Assert: Debe haber llamado al repositorio
      expect(mockRepository.streamCsv).toHaveBeenCalledWith(query);
      expect(mockRepository.streamCsv).toHaveBeenCalledTimes(1);

      // Assert: Debe retornar el stream sin modificarlo
      expect(result).toBe(mockStream);
    });

    test('debe retornar stream válido que puede ser consumido', (done) => {
      // Qué valida: El stream retornado es funcional
      // Por qué: Controller hace pipe(res), debe funcionar
      
      const query: CSVExportRequestDTO = {
        from: '2025-01-01',
        to: '2025-01-31',
        groupBy: 'day',
        columns: ['period', 'productName']
      };

      const mockStream = new Readable({
        read() {
          this.push('\uFEFFperiod;productName\n'); // BOM UTF-8
          this.push('2025-01-15;Pizza\n');
          this.push(null);
        }
      });

      mockRepository.streamCsv.mockReturnValue(mockStream);

      const result = service.streamCsv(query);

      // Assert: Stream debe emitir datos
      const chunks: string[] = [];
      result.on('data', (chunk) => chunks.push(chunk.toString()));
      result.on('end', () => {
        const csv = chunks.join('');
        expect(csv).toContain('period;productName');
        expect(csv).toContain('2025-01-15;Pizza');
        done();
      });
      result.on('error', done);
    });

    test('debe funcionar con query que tiene columnas vacías (usar defaults)', () => {
      // Qué valida: Parámetro columns opcional/vacío
      // Por qué: Usuario puede no especificar columnas personalizadas
      
      const query: CSVExportRequestDTO = {
        from: '2025-06-01',
        to: '2025-06-30',
        groupBy: 'week',
        columns: [] // Sin columnas específicas
      };

      const mockStream = new Readable({ read() { this.push(null); } });
      mockRepository.streamCsv.mockReturnValue(mockStream);

      const result = service.streamCsv(query);

      expect(mockRepository.streamCsv).toHaveBeenCalledWith(query);
      expect(result).toBe(mockStream);
    });
  });

  describe('Responsabilidad única', () => {
    
    test('el servicio no debe contener lógica de negocio, solo delegación', async () => {
      // Qué valida: El servicio es un orquestador puro (SRP)
      // Por qué: Lógica de negocio debe estar en repositorio/strategies
      
      // Este test es conceptual, valida que NO haya transformaciones
      const query: AnalyticsQueryDTO = {
        from: '2025-05-01',
        to: '2025-05-31',
        groupBy: 'month',
        top: 5
      };

      const mockResponse: AnalyticsResponseDTO = {
        range: { from: '2025-05-01', to: '2025-05-31', groupBy: 'month' },
        summary: { totalOrders: 10, totalRevenue: 500, avgPrepTime: null },
        series: [],
        productsSold: [],
        topNProducts: [],
        message: null
      };

      mockRepository.getAnalytics.mockResolvedValue(mockResponse);

      const result = await service.getAnalytics(query);

      // Assert: El servicio NO modificó el query ni la respuesta
      expect(result).toBe(mockResponse); // Misma referencia
    });

    test('el servicio no debe validar parámetros (responsabilidad del controller/repository)', async () => {
      // Qué valida: Sin validación en servicio
      // Por qué: Controller valida HTTP, repositorio valida negocio
      
      // Query inválido (sin campos requeridos)
      const invalidQuery: any = {
        from: '2025-01-01'
        // Falta 'to' y 'groupBy'
      };

      mockRepository.getAnalytics.mockResolvedValue(null);

      // Act: Servicio no debe validar, solo delega
      await service.getAnalytics(invalidQuery);

      // Assert: Llamó al repositorio sin validar
      expect(mockRepository.getAnalytics).toHaveBeenCalledWith(invalidQuery);
    });
  });

  describe('Integración con interfaces', () => {
    
    test('debe cumplir con el contrato IAnalyticsService', () => {
      // Qué valida: Implementación completa de la interfaz
      // Por qué: DIP - otros módulos dependen de la interfaz
      
      // Assert: Servicio tiene todos los métodos de IAnalyticsService
      expect(service.getAnalytics).toBeDefined();
      expect(typeof service.getAnalytics).toBe('function');

      expect(service.streamCsv).toBeDefined();
      expect(typeof service.streamCsv).toBe('function');
    });

    test('debe aceptar cualquier implementación de IAnalyticsRepository', () => {
      // Qué valida: DIP - servicio depende de abstracción, no concreción
      // Por qué: Permite inyectar CachedRepository, TestRepository, etc.
      
      // Arrange: Otro mock de repositorio
      const anotherMockRepo: IAnalyticsRepository = {
        getAnalytics: jest.fn().mockResolvedValue(null),
        streamCsv: jest.fn().mockReturnValue(new Readable({ read() { this.push(null); } }))
      };

      // Act: Crear servicio con otra implementación
      const anotherService = new AnalyticsService(anotherMockRepo);

      // Assert: Debe funcionar igual
      expect(anotherService).toBeInstanceOf(AnalyticsService);
      expect(anotherService.getAnalytics).toBeDefined();
    });
  });
});
