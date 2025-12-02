import { Request, Response } from 'express';
import {
  getKitchenOrders,
  getKitchenOrderById,
  startPreparing,
  markAsReady,
} from '../controllers/kitchenController';
import { kitchenService } from '../services/httpClient';
import { HttpResponse } from '../utils/httpResponse';

// Mock de dependencias
jest.mock('../services/httpClient');
jest.mock('../utils/httpResponse');

describe('KitchenController - Principios FIRST', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset completo antes de cada test (Independent)
    jest.clearAllMocks();

    // Setup de respuesta mock
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      query: {},
      params: {},
      body: {},
    };

    // Silenciar console.error
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  describe('getKitchenOrders', () => {
    // Fast: Todo mockeado, sin I/O real
    it('debería obtener todos los pedidos de cocina sin filtros', async () => {
      const mockOrders = [
        {
          id: 'order-1',
          status: 'pending',
          items: [{ dishName: 'Pizza', quantity: 2 }],
        },
        {
          id: 'order-2',
          status: 'preparing',
          items: [{ dishName: 'Pasta', quantity: 1 }],
        },
      ];

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          count: 2,
          data: mockOrders,
        },
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.getKitchenOrders).toHaveBeenCalledWith(undefined);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockOrders,
      });
    });

    // Independent: No depende de otros tests
    it('debería filtrar pedidos por status "pending"', async () => {
      mockRequest.query = { status: 'pending' };
      const mockOrders = [
        {
          id: 'order-1',
          status: 'pending',
          items: [{ dishName: 'Pizza', quantity: 2 }],
        },
      ];

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          count: 1,
          data: mockOrders,
        },
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.getKitchenOrders).toHaveBeenCalledWith('pending');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockOrders,
      });
    });

    it('debería filtrar pedidos por status "preparing"', async () => {
      mockRequest.query = { status: 'preparing' };
      const mockOrders = [
        {
          id: 'order-2',
          status: 'preparing',
          items: [{ dishName: 'Pasta', quantity: 1 }],
        },
      ];

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          count: 1,
          data: mockOrders,
        },
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.getKitchenOrders).toHaveBeenCalledWith('preparing');
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockOrders,
      });
    });

    it('debería filtrar pedidos por status "ready"', async () => {
      mockRequest.query = { status: 'ready' };
      const mockOrders = [
        {
          id: 'order-3',
          status: 'ready',
          items: [{ dishName: 'Ensalada', quantity: 1 }],
        },
      ];

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          count: 1,
          data: mockOrders,
        },
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.getKitchenOrders).toHaveBeenCalledWith('ready');
    });

    // Repeatable: Siempre produce el mismo resultado
    it('debería manejar respuesta cuando no hay pedidos', async () => {
      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          count: 0,
          data: [],
        },
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 0,
        data: [],
      });
    });

    it('debería manejar respuesta con data directamente como array', async () => {
      const mockOrders = [
        { id: 'order-1', status: 'pending' },
        { id: 'order-2', status: 'preparing' },
      ];

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOrders,
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 2,
        data: mockOrders,
      });
    });

    it('debería usar count del servicio si está disponible', async () => {
      const mockOrders = [{ id: 'order-1' }, { id: 'order-2' }];

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: {
          count: 5, // Count diferente a la longitud del array
          data: mockOrders,
        },
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 5,
        data: mockOrders,
      });
    });

    it('debería manejar errores del servicio', async () => {
      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: false,
        status: 503,
        message: 'Servicio no disponible',
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(mockResponse, {
        success: false,
        status: 503,
        message: 'Servicio no disponible',
      });
    });

    // Self-validating: Aserciones claras
    it('debería manejar excepciones no controladas', async () => {
      const error = new Error('Error de conexión');
      (kitchenService.getKitchenOrders as jest.Mock).mockRejectedValue(error);

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error en getKitchenOrders:', error);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Error interno del servidor al obtener los pedidos de cocina',
        500
      );
    });

    it('debería manejar data con objeto único (no array)', async () => {
      const mockOrder = { id: 'order-1', status: 'pending' };

      (kitchenService.getKitchenOrders as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOrder,
      });

      await getKitchenOrders(mockRequest as Request, mockResponse as Response);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        count: 1,
        data: mockOrder,
      });
    });
  });

  describe('getKitchenOrderById', () => {
    it('debería obtener un pedido específico por ID', async () => {
      const orderId = 'order-123';
      const mockOrder = {
        id: orderId,
        status: 'preparing',
        items: [{ dishName: 'Pizza', quantity: 2 }],
        customerName: 'Juan Pérez',
      };

      mockRequest.params = { orderId };
      (kitchenService.getKitchenOrderById as jest.Mock).mockResolvedValue({
        success: true,
        data: mockOrder,
      });

      await getKitchenOrderById(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.getKitchenOrderById).toHaveBeenCalledWith(orderId);
      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(mockResponse, {
        success: true,
        data: mockOrder,
      });
    });

    it('debería retornar error 400 si falta el orderId', async () => {
      mockRequest.params = {};

      await getKitchenOrderById(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Order ID es requerido',
        400
      );
      expect(kitchenService.getKitchenOrderById).not.toHaveBeenCalled();
    });

    it('debería retornar error 400 si orderId está vacío', async () => {
      mockRequest.params = { orderId: '' };

      await getKitchenOrderById(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Order ID es requerido',
        400
      );
    });

    it('debería manejar error 404 cuando el pedido no existe', async () => {
      const orderId = 'order-not-found';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 404,
          data: { message: 'Order not found' },
        },
      };

      (kitchenService.getKitchenOrderById as jest.Mock).mockRejectedValue(error);

      await getKitchenOrderById(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        `Pedido ${orderId} no encontrado`,
        404
      );
    });

    it('debería manejar errores genéricos del servicio', async () => {
      mockRequest.params = { orderId: 'order-123' };
      const error = new Error('Error de red');
      (kitchenService.getKitchenOrderById as jest.Mock).mockRejectedValue(error);

      await getKitchenOrderById(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error en getKitchenOrderById:', error);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Error interno del servidor al obtener el pedido',
        500
      );
    });

    it('debería manejar diferentes formatos de orderId', async () => {
      const testIds = ['order-123', 'abc-def-ghi', '12345', 'ORDER_SPECIAL'];

      for (const orderId of testIds) {
        jest.clearAllMocks();
        mockRequest.params = { orderId };
        (kitchenService.getKitchenOrderById as jest.Mock).mockResolvedValue({
          success: true,
          data: { id: orderId },
        });

        await getKitchenOrderById(mockRequest as Request, mockResponse as Response);

        expect(kitchenService.getKitchenOrderById).toHaveBeenCalledWith(orderId);
      }
    });
  });

  describe('startPreparing', () => {
    it('debería iniciar la preparación de un pedido exitosamente', async () => {
      const orderId = 'order-123';
      const mockResult = {
        success: true,
        data: {
          id: orderId,
          status: 'preparing',
          startedAt: '2025-12-02T10:00:00Z',
        },
      };

      mockRequest.params = { orderId };
      (kitchenService.startPreparing as jest.Mock).mockResolvedValue(mockResult);

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.startPreparing).toHaveBeenCalledWith(orderId);
      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(mockResponse, mockResult);
    });

    it('debería retornar error 400 si falta el orderId', async () => {
      mockRequest.params = {};

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Order ID es requerido',
        400
      );
      expect(kitchenService.startPreparing).not.toHaveBeenCalled();
    });

    it('debería retornar error 400 si orderId está vacío', async () => {
      mockRequest.params = { orderId: '' };

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Order ID es requerido',
        400
      );
    });

    it('debería manejar error 404 cuando el pedido no existe', async () => {
      const orderId = 'order-not-found';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 404,
          data: { message: 'Order not found' },
        },
      };

      (kitchenService.startPreparing as jest.Mock).mockRejectedValue(error);

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        `Pedido ${orderId} no encontrado`,
        404
      );
    });

    it('debería manejar error 400 con mensaje del servicio', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 400,
          data: { message: 'El pedido ya está en preparación' },
        },
      };

      (kitchenService.startPreparing as jest.Mock).mockRejectedValue(error);

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'El pedido ya está en preparación',
        400
      );
    });

    it('debería usar mensaje por defecto si error 400 no tiene mensaje', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 400,
          data: {},
        },
      };

      (kitchenService.startPreparing as jest.Mock).mockRejectedValue(error);

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'No se puede iniciar la preparación',
        400
      );
    });

    it('debería manejar excepciones no controladas', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const error = new Error('Error de red');
      (kitchenService.startPreparing as jest.Mock).mockRejectedValue(error);

      await startPreparing(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error en startPreparing:', error);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Error interno del servidor al iniciar la preparación',
        500
      );
    });
  });

  describe('markAsReady', () => {
    it('debería marcar un pedido como listo exitosamente', async () => {
      const orderId = 'order-123';
      const mockResult = {
        success: true,
        data: {
          id: orderId,
          status: 'ready',
          readyAt: '2025-12-02T10:30:00Z',
        },
      };

      mockRequest.params = { orderId };
      (kitchenService.markAsReady as jest.Mock).mockResolvedValue(mockResult);

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(kitchenService.markAsReady).toHaveBeenCalledWith(orderId);
      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(mockResponse, mockResult);
    });

    it('debería retornar error 400 si falta el orderId', async () => {
      mockRequest.params = {};

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Order ID es requerido',
        400
      );
      expect(kitchenService.markAsReady).not.toHaveBeenCalled();
    });

    it('debería retornar error 400 si orderId está vacío', async () => {
      mockRequest.params = { orderId: '' };

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Order ID es requerido',
        400
      );
    });

    it('debería manejar error 404 cuando el pedido no existe', async () => {
      const orderId = 'order-not-found';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 404,
          data: { message: 'Order not found' },
        },
      };

      (kitchenService.markAsReady as jest.Mock).mockRejectedValue(error);

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        `Pedido ${orderId} no encontrado`,
        404
      );
    });

    it('debería manejar error 400 con mensaje del servicio', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 400,
          data: { message: 'El pedido debe estar en preparación primero' },
        },
      };

      (kitchenService.markAsReady as jest.Mock).mockRejectedValue(error);

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'El pedido debe estar en preparación primero',
        400
      );
    });

    it('debería usar mensaje por defecto si error 400 no tiene mensaje', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const error = {
        response: {
          status: 400,
          data: {},
        },
      };

      (kitchenService.markAsReady as jest.Mock).mockRejectedValue(error);

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'No se puede marcar como listo',
        400
      );
    });

    it('debería manejar excepciones no controladas', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const error = new Error('Error de red');
      (kitchenService.markAsReady as jest.Mock).mockRejectedValue(error);

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error en markAsReady:', error);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Error interno del servidor al marcar el pedido como listo',
        500
      );
    });

    it('debería procesar transición de estado correctamente', async () => {
      const orderId = 'order-123';
      mockRequest.params = { orderId };
      const mockResult = {
        success: true,
        data: {
          id: orderId,
          status: 'ready',
          previousStatus: 'preparing',
          readyAt: '2025-12-02T10:30:00Z',
        },
      };

      (kitchenService.markAsReady as jest.Mock).mockResolvedValue(mockResult);

      await markAsReady(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({
          success: true,
          data: expect.objectContaining({
            status: 'ready',
          }),
        })
      );
    });
  });
});
