import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { OrderService } from './orderService';
import { Order, OrderStatus } from '../models/Order';
import { OrderCancellation } from '../models/OrderCancellation';
import { rabbitMQClient } from '../rabbitmq/rabbitmqClient';

// Mock de MongoDB y RabbitMQ
jest.mock('../models/Order');
jest.mock('../models/OrderCancellation');
jest.mock('../rabbitmq/rabbitmqClient');

describe('OrderService - cancelOrder', () => {
  let orderService: OrderService;
  let mockOrder: any;
  let mockCancellation: any;

  beforeEach(() => {
    orderService = new OrderService();
    
    // Setup mocks
    mockOrder = {
      _id: 'order-123',
      orderNumber: 'ORD-1234567890-001',
      customerName: 'Juan Pérez',
      customerEmail: 'juan@example.com',
      status: OrderStatus.PENDING,
      items: [{ name: 'Pizza', quantity: 1, price: 20 }],
      total: 20,
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(true)
    };

    mockCancellation = {
      save: jest.fn().mockResolvedValue(true)
    };

    jest.clearAllMocks();
  });

  describe('F.I.R.S.T Principles', () => {
    
    // ✅ FAST: Pruebas rápidas sin I/O real
    it('debería cancelar un pedido en estado PENDING rápidamente', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      const result = await orderService.cancelOrder('order-123', 'Cambié de idea', 'customer');

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(mockOrder.save).toHaveBeenCalled();
    });

    // ✅ INDEPENDENT: Sin dependencias entre tests
    it('debería rechazar cancelación si el pedido está en estado PREPARING', async () => {
      mockOrder.status = OrderStatus.PREPARING;
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        orderService.cancelOrder('order-123')
      ).rejects.toThrow('No se puede cancelar un pedido en estado "preparing"');
    });

    it('debería rechazar cancelación si el pedido está en estado READY', async () => {
      mockOrder.status = OrderStatus.READY;
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        orderService.cancelOrder('order-123')
      ).rejects.toThrow('No se puede cancelar un pedido en estado "ready"');
    });

    it('debería rechazar cancelación si el pedido está en estado DELIVERED', async () => {
      mockOrder.status = OrderStatus.DELIVERED;
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);

      await expect(
        orderService.cancelOrder('order-123')
      ).rejects.toThrow('No se puede cancelar un pedido en estado "delivered"');
    });

    // ✅ REPEATABLE: Resultados consistentes
    it('debería registrar historial de cancelación consistentemente', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      for (let i = 0; i < 3; i++) {
        await orderService.cancelOrder('order-123', 'Razón test', 'customer');
      }

      expect(OrderCancellation).toHaveBeenCalledTimes(3);
      expect(mockCancellation.save).toHaveBeenCalledTimes(3);
    });

    // ✅ SELF-VALIDATING: Pruebas con assertions claras
    it('debería permitir cancelar un pedido en estado PENDING', async () => {
      mockOrder.status = OrderStatus.PENDING;
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      const result = await orderService.cancelOrder(
        'order-123', 
        'Cliente cambió de idea', 
        'customer'
      );

      expect(result).toBeDefined();
      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(result.updatedAt).toBeDefined();
    });

    it('debería publicar evento order.cancelled cuando se cancela correctamente', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      await orderService.cancelOrder('order-123', 'Razón test', 'admin');

      expect(rabbitMQClient.publishEvent).toHaveBeenCalledWith(
        'order.cancelled',
        expect.objectContaining({
          type: 'order.cancelled',
          orderId: 'order-123',
          reason: 'Razón test',
          cancelledBy: 'admin'
        })
      );
    });

    // ✅ TIMELY: Tests escritos antes o después, pero claros en intención
    it('debería rechazar cancelación de pedido inexistente', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(null);

      await expect(
        orderService.cancelOrder('inexistente-id')
      ).rejects.toThrow('no encontrado');
    });

    it('debería guardar razón de cancelación en el historial', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      const reason = 'Cambio de planes familiar';
      await orderService.cancelOrder('order-123', reason, 'customer');

      expect(OrderCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: reason,
          previousStatus: mockOrder.status
        })
      );
    });

    it('debería registrar quién cancela el pedido (customer o admin)', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      await orderService.cancelOrder('order-123', 'Razón', 'admin');

      expect(OrderCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          cancelledBy: 'admin'
        })
      );
    });
  });

  describe('Edge Cases', () => {
    it('debería manejar cancelación sin razón (usar valor por defecto)', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockResolvedValue(true);

      await orderService.cancelOrder('order-123', undefined, 'customer');

      expect(OrderCancellation).toHaveBeenCalledWith(
        expect.objectContaining({
          reason: 'Sin especificar'
        })
      );
    });

    it('debería manejar error de RabbitMQ sin fallar la cancelación', async () => {
      (Order.findById as jest.Mock).mockResolvedValue(mockOrder);
      (OrderCancellation as jest.Mock).mockReturnValue(mockCancellation);
      (rabbitMQClient.publishEvent as jest.Mock).mockRejectedValue(
        new Error('RabbitMQ connection lost')
      );

      await expect(
        orderService.cancelOrder('order-123')
      ).rejects.toThrow('RabbitMQ connection lost');
    });
  });
});
