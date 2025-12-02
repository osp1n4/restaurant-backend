import { Request, Response } from 'express';
import { createOrder, getOrderById } from '../controllers/orderController';
import { orderService } from '../services/httpClient';
import { OrderValidator } from '../validators/orderValidator';
import { HttpResponse } from '../utils/httpResponse';

// Mock de dependencias
jest.mock('../services/httpClient');
jest.mock('../validators/orderValidator');
jest.mock('../utils/httpResponse');

describe('OrderController', () => {
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;
  let consoleErrorSpy: jest.SpyInstance;

  beforeEach(() => {
    // Reset completo de mocks antes de cada test (Independent)
    jest.clearAllMocks();

    // Setup de respuesta mock
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
    mockRequest = {
      body: {},
      params: {},
    };

    // Silenciar console.error en tests
    consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
  });

  afterEach(() => {
    // Restaurar console.error
    consoleErrorSpy.mockRestore();
  });

  describe('createOrder', () => {
    // Fast: Sin I/O real, todo mockeado
    it('debería crear un pedido exitosamente con todos los datos válidos', async () => {
      // Arrange
      const orderData = {
        orderItems: [
          {
            dishName: 'Pizza Margarita',
            quantity: 2,
            unitPrice: 15.99,
          },
          {
            dishName: 'Ensalada César',
            quantity: 1,
            unitPrice: 8.50,
          },
        ],
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
      };

      const createdOrder = {
        id: 'order-123',
        ...orderData,
        totalPrice: 40.48,
        status: 'pending',
        createdAt: '2025-12-02T10:00:00Z',
      };

      mockRequest.body = orderData;
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({ valid: true });
      (orderService.createOrder as jest.Mock).mockResolvedValue({
        success: true,
        data: createdOrder,
      });

      // Act
      await createOrder(mockRequest as Request, mockResponse as Response);

      // Assert - Self-validating: verificaciones claras
      expect(OrderValidator.validateCreateOrder).toHaveBeenCalledWith(mockRequest);
      expect(orderService.createOrder).toHaveBeenCalledWith(orderData);
      expect(HttpResponse.success).toHaveBeenCalledWith(
        mockResponse,
        createdOrder,
        'Pedido creado exitosamente',
        201
      );
    });

    // Independent: No depende de otros tests
    it('debería retornar error 400 si la validación falla por body vacío', async () => {
      mockRequest.body = {};
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({
        valid: false,
        message: 'El cuerpo de la petición está vacío',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(OrderValidator.validateCreateOrder).toHaveBeenCalledWith(mockRequest);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'El cuerpo de la petición está vacío',
        400
      );
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });

    it('debería retornar error 400 si faltan orderItems', async () => {
      mockRequest.body = {
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({
        valid: false,
        message: 'orderItems es requerido',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'orderItems es requerido',
        400
      );
      expect(orderService.createOrder).not.toHaveBeenCalled();
    });

    it('debería retornar error 400 si orderItems está vacío', async () => {
      mockRequest.body = {
        orderItems: [],
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({
        valid: false,
        message: 'orderItems debe tener al menos un elemento',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'orderItems debe tener al menos un elemento',
        400
      );
    });

    it('debería retornar error 400 si falta customerName', async () => {
      mockRequest.body = {
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerEmail: 'juan@example.com',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({
        valid: false,
        message: 'customerName es requerido',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'customerName es requerido',
        400
      );
    });

    it('debería retornar error 400 si falta customerEmail', async () => {
      mockRequest.body = {
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerName: 'Juan Pérez',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({
        valid: false,
        message: 'customerEmail es requerido',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'customerEmail es requerido',
        400
      );
    });

    it('debería retornar error 400 si el email tiene formato inválido', async () => {
      mockRequest.body = {
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerName: 'Juan Pérez',
        customerEmail: 'email-invalido',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({
        valid: false,
        message: 'customerEmail debe tener formato válido',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'customerEmail debe tener formato válido',
        400
      );
    });

    // Repeatable: Siempre produce el mismo resultado
    it('debería manejar errores del servicio correctamente', async () => {
      mockRequest.body = {
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({ valid: true });
      (orderService.createOrder as jest.Mock).mockResolvedValue({
        success: false,
        status: 503,
        message: 'Servicio no disponible',
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(mockResponse, {
        success: false,
        status: 503,
        message: 'Servicio no disponible',
      });
    });

    it('debería manejar excepciones no controladas', async () => {
      mockRequest.body = {
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
      };
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({ valid: true });
      const error = new Error('Error de conexión');
      (orderService.createOrder as jest.Mock).mockRejectedValue(error);

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error en createOrder:', error);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Error interno del servidor al crear el pedido',
        500
      );
    });

    it('debería crear pedido con múltiples items correctamente', async () => {
      const orderData = {
        orderItems: [
          { dishName: 'Pizza', quantity: 2, unitPrice: 15.99 },
          { dishName: 'Pasta', quantity: 1, unitPrice: 12.50 },
          { dishName: 'Bebida', quantity: 3, unitPrice: 2.99 },
        ],
        customerName: 'María García',
        customerEmail: 'maria@example.com',
      };

      mockRequest.body = orderData;
      (OrderValidator.validateCreateOrder as jest.Mock).mockReturnValue({ valid: true });
      (orderService.createOrder as jest.Mock).mockResolvedValue({
        success: true,
        data: { id: 'order-456', ...orderData },
      });

      await createOrder(mockRequest as Request, mockResponse as Response);

      expect(orderService.createOrder).toHaveBeenCalledWith(orderData);
      expect(HttpResponse.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ id: 'order-456' }),
        'Pedido creado exitosamente',
        201
      );
    });
  });

  describe('getOrderById', () => {
    it('debería obtener un pedido por ID exitosamente', async () => {
      // Arrange
      const orderId = 'order-123';
      const orderData = {
        id: orderId,
        orderItems: [
          {
            dishName: 'Pizza',
            quantity: 1,
            unitPrice: 15.99,
          },
        ],
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
        status: 'pending',
        totalPrice: 15.99,
        createdAt: '2025-12-02T10:00:00Z',
      };

      mockRequest.params = { id: orderId };
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({ valid: true });
      (orderService.getOrderById as jest.Mock).mockResolvedValue({
        success: true,
        data: orderData,
      });

      // Act
      await getOrderById(mockRequest as Request, mockResponse as Response);

      // Assert
      expect(OrderValidator.validateOrderId).toHaveBeenCalledWith(mockRequest);
      expect(orderService.getOrderById).toHaveBeenCalledWith(orderId);
      expect(HttpResponse.success).toHaveBeenCalledWith(mockResponse, orderData);
    });

    it('debería retornar error 400 si el ID no está presente', async () => {
      mockRequest.params = {};
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({
        valid: false,
        message: 'Se requiere el ID del pedido',
      });

      await getOrderById(mockRequest as Request, mockResponse as Response);

      expect(OrderValidator.validateOrderId).toHaveBeenCalledWith(mockRequest);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Se requiere el ID del pedido',
        400
      );
      expect(orderService.getOrderById).not.toHaveBeenCalled();
    });

    it('debería retornar error 400 si el ID está vacío', async () => {
      mockRequest.params = { id: '' };
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({
        valid: false,
        message: 'El ID del pedido no puede estar vacío',
      });

      await getOrderById(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'El ID del pedido no puede estar vacío',
        400
      );
    });

    it('debería retornar error 404 si el pedido no existe', async () => {
      const orderId = 'order-not-found';
      mockRequest.params = { id: orderId };
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({ valid: true });
      (orderService.getOrderById as jest.Mock).mockResolvedValue({
        success: false,
        status: 404,
        message: 'Pedido no encontrado',
      });

      await getOrderById(mockRequest as Request, mockResponse as Response);

      expect(orderService.getOrderById).toHaveBeenCalledWith(orderId);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        `Pedido con ID ${orderId} no encontrado`,
        404
      );
    });

    it('debería manejar errores del servicio que no son 404', async () => {
      const orderId = 'order-123';
      mockRequest.params = { id: orderId };
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({ valid: true });
      (orderService.getOrderById as jest.Mock).mockResolvedValue({
        success: false,
        status: 503,
        message: 'Servicio no disponible',
      });

      await getOrderById(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.fromServiceResponse).toHaveBeenCalledWith(mockResponse, {
        success: false,
        status: 503,
        message: 'Servicio no disponible',
      });
    });

    it('debería manejar excepciones no controladas', async () => {
      const orderId = 'order-123';
      mockRequest.params = { id: orderId };
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({ valid: true });
      const error = new Error('Error de red');
      (orderService.getOrderById as jest.Mock).mockRejectedValue(error);

      await getOrderById(mockRequest as Request, mockResponse as Response);

      expect(consoleErrorSpy).toHaveBeenCalledWith('Error en getOrderById:', error);
      expect(HttpResponse.error).toHaveBeenCalledWith(
        mockResponse,
        'Error interno del servidor al obtener el pedido',
        500
      );
    });

    it('debería obtener pedido con diferentes estados correctamente', async () => {
      const orderId = 'order-789';
      const orderData = {
        id: orderId,
        status: 'completed',
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerName: 'Carlos López',
        customerEmail: 'carlos@example.com',
      };

      mockRequest.params = { id: orderId };
      (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({ valid: true });
      (orderService.getOrderById as jest.Mock).mockResolvedValue({
        success: true,
        data: orderData,
      });

      await getOrderById(mockRequest as Request, mockResponse as Response);

      expect(HttpResponse.success).toHaveBeenCalledWith(
        mockResponse,
        expect.objectContaining({ status: 'completed' })
      );
    });

    it('debería manejar IDs con formatos válidos diferentes', async () => {
      const testCases = [
        'order-123',
        'abc123',
        '12345',
        'ORDER_SPECIAL_001',
      ];

      for (const orderId of testCases) {
        jest.clearAllMocks();
        mockRequest.params = { id: orderId };
        (OrderValidator.validateOrderId as jest.Mock).mockReturnValue({ valid: true });
        (orderService.getOrderById as jest.Mock).mockResolvedValue({
          success: true,
          data: { id: orderId },
        });

        await getOrderById(mockRequest as Request, mockResponse as Response);

        expect(orderService.getOrderById).toHaveBeenCalledWith(orderId);
      }
    });
  });
});

