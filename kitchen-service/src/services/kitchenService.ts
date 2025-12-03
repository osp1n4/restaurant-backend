import { KitchenOrder, IKitchenOrder } from '../models/KitchenOrder';
import { IEventPublisher } from '../interfaces/IEventPublisher';

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber?: string;  // ✅ NUEVO: Número de orden legible (ORD-xxx)
  userId?: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  notes?: string;
  totalAmount?: number;
  status?: string;
  createdAt?: string;
}

export class KitchenService {
  /**
   * Constructor con Dependency Injection
   * Principio SOLID: Dependency Inversion Principle (DIP)
   *
   * @param eventPublisher - Abstracción para publicar eventos (no implementación concreta)
   */
  constructor(private readonly eventPublisher: IEventPublisher) {}

  /**
   * Maneja el evento order.created del order-service
   * 2. Guarda en MongoDB
   * 3. Publica order.received
   */
  async handleOrderCreated(orderData: OrderCreatedEvent): Promise<IKitchenOrder> {
    try {
      console.log(`🍳 Processing new order: ${orderData.orderNumber || orderData.orderId}`);

      // Verificar si ya existe (idempotencia)
      const existingOrder = await KitchenOrder.findOne({ orderId: orderData.orderId });
      if (existingOrder) {
        console.log(`⚠️ Order ${orderData.orderNumber || orderData.orderId} already exists, skipping...`);
        return existingOrder;
      }

      // Crear orden en kitchen
      const userId = orderData.userId || orderData.orderId;

      const kitchenOrder = new KitchenOrder({
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,  // ✅ Guardar orderNumber
        userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        items: orderData.items,
        status: 'RECEIVED',
        receivedAt: new Date(),
        notes: orderData.notes,
        estimatedTime: this.calculateEstimatedTime(orderData.items)
      });

      await kitchenOrder.save();
      console.log(`✅ Kitchen order saved: ${orderData.orderNumber || orderData.orderId}`);

      // Publicar evento order.received para notification-service
      await this.eventPublisher.publish('order.received', {
        type: 'order.received',
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,  // ✅ Incluir orderNumber
        userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        status: 'RECEIVED',
        timestamp: new Date().toISOString(),
        data: {
          orderNumber: orderData.orderNumber,  // ✅ También en data
          receivedAt: kitchenOrder.receivedAt,
          estimatedTime: kitchenOrder.estimatedTime,
          items: orderData.items
        }
      });

      console.log(`📤 Event published: order.received for ${orderData.orderNumber || orderData.orderId}`);

      return kitchenOrder;
    } catch (error) {
      console.error(`❌ Error handling order.created:`, error);
      throw error;
    }
  }

  /**
   * 5. Inicia la preparación del pedido
   * 6. Publica order.preparing
   */
  async startPreparing(orderId: string): Promise<IKitchenOrder> {
    try {
      // Buscar por orderId o orderNumber
      const order = await KitchenOrder.findOne({
        $or: [
          { orderId: orderId },
          { orderNumber: orderId }
        ]
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.status !== 'RECEIVED') {
        throw new Error(`Order ${orderId} cannot start preparing. Current status: ${order.status}`);
      }

      // Actualizar estado
      order.status = 'PREPARING';
      order.preparingAt = new Date();
      await order.save();

      console.log(`👨‍🍳 Order ${order.orderNumber || orderId} is now PREPARING`);

      // Publicar evento order.preparing para notification-service
      await this.eventPublisher.publish('order.preparing', {
        type: 'order.preparing',
        orderId: order.orderId,
        orderNumber: order.orderNumber,  // ✅ Incluir orderNumber
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: 'PREPARING',
        timestamp: new Date().toISOString(),
        data: {
          orderNumber: order.orderNumber,  // ✅ También en data
          preparingAt: order.preparingAt,
          estimatedTime: order.estimatedTime
        }
      });

      console.log(`📤 Event published: order.preparing for ${order.orderNumber || orderId}`);

      return order;
    } catch (error) {
      console.error(`❌ Error starting preparation:`, error);
      throw error;
    }
  }

  /**
   * 8. Marca el pedido como listo
   * 9. Publica order.ready
   */
  async markAsReady(orderId: string): Promise<IKitchenOrder> {
    try {
      // Buscar por orderId o orderNumber
      const order = await KitchenOrder.findOne({
        $or: [
          { orderId: orderId },
          { orderNumber: orderId }
        ]
      });

      if (!order) {
        throw new Error(`Order ${orderId} not found`);
      }

      if (order.status !== 'PREPARING') {
        throw new Error(`Order ${orderId} cannot be marked as ready. Current status: ${order.status}`);
      }

      // Actualizar estado
      order.status = 'READY';
      order.readyAt = new Date();
      await order.save();

      console.log(`✅ Order ${order.orderNumber || orderId} is now READY`);

      // Publicar evento order.ready para notification-service
      await this.eventPublisher.publish('order.ready', {
        type: 'order.ready',
        orderId: order.orderId,
        orderNumber: order.orderNumber,  // ✅ Incluir orderNumber
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: 'READY',
        timestamp: new Date().toISOString(),
        data: {
          orderNumber: order.orderNumber,  // ✅ También en data
          readyAt: order.readyAt,
          receivedAt: order.receivedAt,
          preparingAt: order.preparingAt,
          items: order.items
        }
      });

      console.log(`📤 Event published: order.ready for ${order.orderNumber || orderId}`);

      return order;
    } catch (error) {
      console.error(`❌ Error marking order as ready:`, error);
      throw error;
    }
  }

  /**
   * Maneja el evento order.cancelled del order-service
   * Cancela el pedido en cocina si existe
   */
  async handleOrderCancelled(orderData: any): Promise<IKitchenOrder | null> {
    try {
      const { orderId, previousStatus, reason, cancelledBy } = orderData;

      console.log(`🚫 Procesando cancelación de pedido: ${orderId}`);

      const kitchenOrder = await KitchenOrder.findOne({ orderId });

      if (!kitchenOrder) {
        console.log(`⚠️ Pedido ${orderId} no encontrado en cocina (probablemente ya fue entregado)`);
        return null;
      }

      // Cambiar status a CANCELLED
      kitchenOrder.status = 'CANCELLED' as any; // Agregar a enum si es necesario
      kitchenOrder.cancelledAt = new Date();
      kitchenOrder.cancellationReason = reason;
      await kitchenOrder.save();

      console.log(`✅ Pedido cancelado en cocina: ${orderId}`);

      return kitchenOrder;
    } catch (error) {
      console.error(`❌ Error manejando cancelación:`, error);
      throw error;
    }
  }

  /**
   * Obtiene todos los pedidos en cocina
   */
  async getAllOrders(status?: string): Promise<IKitchenOrder[]> {
    try {
      const filter = status ? { status: status.toUpperCase() } : {};
      return await KitchenOrder.find(filter).sort({ receivedAt: -1 });
    } catch (error) {
      console.error(`❌ Error fetching orders:`, error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido específico por orderId o orderNumber
   */
  async getOrderById(orderId: string): Promise<IKitchenOrder | null> {
    try {
      // Buscar por orderId o orderNumber
      return await KitchenOrder.findOne({
        $or: [
          { orderId: orderId },
          { orderNumber: orderId }
        ]
      });
    } catch (error) {
      console.error(`❌ Error fetching order:`, error);
      throw error;
    }
  }

  /**
   * Calcula tiempo estimado basado en cantidad de items
   */
  private calculateEstimatedTime(items: Array<{ quantity: number }>): number {
    const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);
    // 5 minutos base + 2 minutos por item
    return 5 + (totalItems * 2);
  }
}
