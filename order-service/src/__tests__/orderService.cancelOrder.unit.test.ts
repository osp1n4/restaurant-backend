import { OrderService } from '../services/orderService';
import { Order, OrderStatus } from '../models/Order';
import { OrderCancellation } from '../models/OrderCancellation';
import { rabbitMQClient } from '../rabbitmq/rabbitmqClient';

jest.mock('../../models/Order', () => {
  const OrderStatus = {
    PENDING: 'pending',
    PREPARING: 'preparing',
    READY: 'ready',
    DELIVERED: 'delivered',
    CANCELLED: 'cancelled',
  };
  return {
    OrderStatus,
    Order: {
      findById: jest.fn(),
      findOne: jest.fn(),
    },
  };
});

jest.mock('../../models/OrderCancellation', () => {
  const mockInstance = { save: jest.fn().mockResolvedValue(undefined) };
  const OrderCancellation = jest.fn(() => mockInstance);
  return { OrderCancellation };
});

jest.mock('../../rabbitmq/rabbitmqClient', () => ({
  rabbitMQClient: {
    publishEvent: jest.fn().mockResolvedValue(undefined),
  },
}));

describe('OrderService.cancelOrder - Unit', () => {
  let service: OrderService;
  let baseOrder: any;

  beforeEach(() => {
    service = new OrderService();

    baseOrder = {
      _id: 'order-123',
      orderNumber: 'ORD-1234567890-001',
      customerName: 'Juan Pérez',
      items: [{ name: 'Pizza', quantity: 1, price: 20 }],
      total: 20,
      status: OrderStatus.PENDING,
      updatedAt: new Date(),
      save: jest.fn().mockResolvedValue(undefined),
    };

    (Order.findById as jest.Mock).mockReset();
    (Order.findOne as jest.Mock).mockReset();
    (OrderCancellation as unknown as jest.Mock).mockClear();
    (rabbitMQClient.publishEvent as jest.Mock).mockClear();
  });

  // F - Fast: prueba rápida y sin IO real
  it('cancela un pedido en estado PENDING', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder });

    const result = await service.cancelOrder('order-123', 'Cambié de idea', 'customer');

    expect(result.status).toBe(OrderStatus.CANCELLED);
    expect(baseOrder.save).toHaveBeenCalledTimes(1);
    expect(OrderCancellation).toHaveBeenCalledTimes(1);
    expect(rabbitMQClient.publishEvent).toHaveBeenCalledWith(
      'order.cancelled',
      expect.objectContaining({
        type: 'order.cancelled',
        orderId: 'order-123',
        reason: 'Cambié de idea',
        cancelledBy: 'customer',
      })
    );
  });

  // I - Isolated: sin dependencias entre pruebas
  it('rechaza cancelar si el estado es PREPARING', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder, status: OrderStatus.PREPARING });
    await expect(service.cancelOrder('order-123')).rejects.toThrow('No se puede cancelar un pedido en estado "preparing"');
  });

  it('rechaza cancelar si el estado es READY', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder, status: OrderStatus.READY });
    await expect(service.cancelOrder('order-123')).rejects.toThrow('No se puede cancelar un pedido en estado "ready"');
  });

  it('rechaza cancelar si el estado es DELIVERED', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder, status: OrderStatus.DELIVERED });
    await expect(service.cancelOrder('order-123')).rejects.toThrow('No se puede cancelar un pedido en estado "delivered"');
  });

  // R - Repeatable: consistente en ejecuciones múltiples
  it('registra historial de cancelación en cada intento', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder });
    for (let i = 0; i < 3; i++) {
      await service.cancelOrder('order-123', 'Razón ' + i, 'customer');
    }
    expect(OrderCancellation).toHaveBeenCalledTimes(3);
  });

  // S - Self-validating: assertions claras
  it('usa razón por defecto si no se especifica', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder });
    await service.cancelOrder('order-123');
    expect(OrderCancellation).toHaveBeenCalledWith(
      expect.objectContaining({
        reason: 'Sin especificar',
      })
    );
  });

  it('propaga error si el pedido no existe', async () => {
    (Order.findById as jest.Mock).mockResolvedValue(null);
    await expect(service.cancelOrder('inexistente')).rejects.toThrow('no encontrado');
  });

  it('publica evento con payload esperado', async () => {
    (Order.findById as jest.Mock).mockResolvedValue({ ...baseOrder });
    await service.cancelOrder('order-123', 'test', 'admin');
    expect(rabbitMQClient.publishEvent).toHaveBeenCalledWith(
      'order.cancelled',
      expect.objectContaining({
        type: 'order.cancelled',
        orderId: 'order-123',
        orderNumber: 'ORD-1234567890-001',
        cancelledBy: 'admin',
        reason: 'test',
      })
    );
  });
});