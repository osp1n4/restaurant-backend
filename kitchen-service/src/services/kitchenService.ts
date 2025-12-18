import { KitchenOrder, IKitchenOrder } from '../models/KitchenOrder';
import { RabbitMQClient } from '../rabbitmq/rabbitmqClient';

export interface OrderCreatedEvent {
  orderId: string;
  orderNumber?: string;
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
  constructor(private rabbitMQClient: RabbitMQClient) {}

  /**
   * Maneja el evento order.updated del order-service
   * Actualiza los datos del pedido en la cocina
   */
  async handleOrderUpdated(orderData: OrderCreatedEvent): Promise<IKitchenOrder | null> {
    try {
      console.log(`🔄 Processing order update: ${orderData.orderId}`);

      // Buscar el pedido en la cocina
      const kitchenOrder = await KitchenOrder.findOne({ orderId: orderData.orderId });

      if (!kitchenOrder) {
        console.warn(`⚠️ Order ${orderData.orderId} not found in kitchen, cannot update`);
        return null;
      }

      // Solo actualizar si el pedido está en estado RECEIVED (no ha comenzado a prepararse)
      if (kitchenOrder.status !== 'RECEIVED') {
        console.warn(`⚠️ Order ${orderData.orderId} is already ${kitchenOrder.status}, cannot update`);
        return kitchenOrder;
      }

      // Actualizar datos
      if (orderData.orderNumber !== undefined) {
        kitchenOrder.orderNumber = orderData.orderNumber;
      }
      if (orderData.items) {
        kitchenOrder.items = orderData.items;
        kitchenOrder.estimatedTime = this.calculateEstimatedTime(orderData.items);
      }
      if (orderData.notes !== undefined) {
        kitchenOrder.notes = orderData.notes;
      }
      if (orderData.customerEmail !== undefined) {
        kitchenOrder.customerEmail = orderData.customerEmail;
      }

      await kitchenOrder.save();
      console.log(`✅ Kitchen order updated: ${orderData.orderId}`);

      return kitchenOrder;
    } catch (error) {
      console.error(`❌ Error handling order.updated:`, error);
      throw error;
    }
  }

  /**
   * Maneja el evento order.created del order-service
   * 2. Guarda en MongoDB
   * 3. Publica order.received
   */
  async handleOrderCreated(orderData: OrderCreatedEvent): Promise<IKitchenOrder> {
    try {
      console.log(`🍳 Processing new order: ${orderData.orderId}`);

      // Verificar si ya existe (idempotencia)
      const existingOrder = await KitchenOrder.findOne({ orderId: orderData.orderId });
      if (existingOrder) {
        console.log(`⚠️ Order ${orderData.orderId} already exists, skipping...`);
        return existingOrder;
      }

      // Crear orden en kitchen
      const userId = orderData.userId || orderData.orderId;

      const kitchenOrder = new KitchenOrder({
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
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
      console.log(`✅ Kitchen order saved: ${orderData.orderId}`);

      // Publicar evento order.received para notification-service
      await this.rabbitMQClient.publish('order.received', {
        type: 'order.received',
        orderId: orderData.orderId,
        orderNumber: orderData.orderNumber,
        userId,
        customerName: orderData.customerName,
        customerEmail: orderData.customerEmail,
        status: 'RECEIVED',
        timestamp: new Date().toISOString(),
        data: {
          receivedAt: kitchenOrder.receivedAt,
          estimatedTime: kitchenOrder.estimatedTime,
          items: orderData.items
        }
      });

      console.log(`📤 Event published: order.received for ${orderData.orderId}`);

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
      // Buscar por orderId o por orderNumber (si es formato ORD-XXXXX)
      const query = orderId.startsWith('ORD-') 
        ? { orderNumber: orderId } 
        : { orderId };
      
      const order = await KitchenOrder.findOne(query);

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

      console.log(`👨‍🍳 Order ${orderId} is now PREPARING`);

      // Publicar evento order.preparing para notification-service
      await this.rabbitMQClient.publish('order.preparing', {
        type: 'order.preparing',
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: 'PREPARING',
        timestamp: new Date().toISOString(),
        data: {
          preparingAt: order.preparingAt,
          estimatedTime: order.estimatedTime
        }
      });

      console.log(`📤 Event published: order.preparing for ${orderId}`);

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
      // Buscar por orderId o por orderNumber (si es formato ORD-XXXXX)
      const query = orderId.startsWith('ORD-') 
        ? { orderNumber: orderId } 
        : { orderId };
      
      const order = await KitchenOrder.findOne(query);

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

      console.log(`✅ Order ${orderId} is now READY`);

      // Publicar evento order.ready para notification-service
      await this.rabbitMQClient.publish('order.ready', {
        type: 'order.ready',
        orderId: order.orderId,
        orderNumber: order.orderNumber,
        userId: order.userId,
        customerName: order.customerName,
        customerEmail: order.customerEmail,
        status: 'READY',
        timestamp: new Date().toISOString(),
        data: {
          readyAt: order.readyAt,
          receivedAt: order.receivedAt,
          preparingAt: order.preparingAt,
          items: order.items
        }
      });

      console.log(`📤 Event published: order.ready for ${orderId}`);

      return order;
    } catch (error) {
      console.error(`❌ Error marking order as ready:`, error);
      throw error;
    }
  }

  /**
   * Maneja el evento order.cancelled del order-service
   * Marca el pedido como cancelado
   */
  async handleOrderCancelled(cancelData: any): Promise<void> {
    try {
      console.log(`🚫 Processing order cancellation: ${cancelData.orderId}`);

      // Buscar el pedido en kitchen
      const kitchenOrder = await KitchenOrder.findOne({ orderId: cancelData.orderId });

      if (!kitchenOrder) {
        console.log(`⚠️ Order ${cancelData.orderId} not found in kitchen, skipping...`);
        return;
      }

      // Validar que el pedido no esté en preparación o listo
      if (kitchenOrder.status === 'PREPARING' || kitchenOrder.status === 'READY') {
        console.log(
          `⚠️ Cannot cancel order ${cancelData.orderId} - already ${kitchenOrder.status}. Ignoring cancellation request.`
        );
        // No lanzar error, simplemente ignorar el evento de cancelación
        return;
      }

      // Marcar como cancelado
      kitchenOrder.status = 'CANCELLED';
      kitchenOrder.cancelledAt = new Date();
      await kitchenOrder.save();

      console.log(`✅ Kitchen order ${cancelData.orderId} marked as CANCELLED`);

    } catch (error) {
      console.error(`❌ Error handling order.cancelled:`, error);
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
   * Obtiene un pedido específico
   */
  async getOrderById(orderId: string): Promise<IKitchenOrder | null> {
    try {
      // Buscar por orderId o por orderNumber (si es formato ORD-XXXXX)
      const query = orderId.startsWith('ORD-') 
        ? { orderNumber: orderId } 
        : { orderId };
      
      return await KitchenOrder.findOne(query);
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
