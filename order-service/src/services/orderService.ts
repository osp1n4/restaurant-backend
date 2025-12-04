import { Order, IOrder, OrderStatus, OrderItem } from '../models/Order';
import { OrderCancellation } from '../models/OrderCancellation';
import { IEventPublisher } from '../interfaces/IEventPublisher';

export class OrderService {
  /**
   * Constructor con Dependency Injection
   * Principio SOLID: Dependency Inversion Principle (DIP)
   *
   * @param eventPublisher - Abstracción para publicar eventos (no implementación concreta)
   */
  constructor(private readonly eventPublisher: IEventPublisher) {}
  /**
   * Crea un nuevo pedido
   * @param customerName - Nombre del cliente
   * @param items - Items del pedido
   * @param customerEmail - Email del cliente (opcional)
   * @returns El pedido creado
   */
  async createOrder(
    customerName: string,
    items: OrderItem[],
    customerEmail?: string
  ): Promise<IOrder> {
    try {
      // Generar número de pedido único
      const orderNumber = await this.generateOrderNumber();

      // Crear el pedido
      const order = new Order({
        orderNumber,
        customerName,
        customerEmail: customerEmail || 'no-email@example.com',
        items,
        status: OrderStatus.PENDING
      });

      // Calcular total
      order.total = items.reduce((sum, item) => sum + (item.price * item.quantity), 0);

      // Guardar en MongoDB
      const savedOrder = await order.save();

      // Publicar evento order.created a RabbitMQ con estructura enriquecida
      const eventData = {
        type: 'order.created',
        orderId: savedOrder._id.toString(),
        userId: savedOrder._id.toString(), // Usamos el orderId como identificador del usuario por ahora
        orderNumber: savedOrder.orderNumber,
        customerName: savedOrder.customerName,
        customerEmail,
        items: savedOrder.items.map((item) => ({
          name: item.name,
          quantity: item.quantity,
          price: item.price
        })),
        totalAmount: savedOrder.total,
        status: savedOrder.status,
        timestamp: new Date().toISOString(),
        createdAt: savedOrder.createdAt.toISOString(),
        data: {
          total: savedOrder.total,
          createdAt: savedOrder.createdAt
        }
      };

      await this.eventPublisher.publishEvent('order.created', eventData);

      console.log(`✅ Pedido creado: ${savedOrder.orderNumber}`);

      return savedOrder;
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido por su ID
   * @param orderId - ID del pedido (puede ser _id de MongoDB o orderNumber/orderId)
   * @returns El pedido encontrado
   */
  async getOrderById(orderId: string): Promise<IOrder | null> {
    try {
      // Intentar buscar por _id primero (si es un ObjectId válido)
      let order = null;

      if (orderId.match(/^[0-9a-fA-F]{24}$/)) {
        // Es un ObjectId válido de MongoDB
        order = await Order.findById(orderId);
      }

      // Si no se encontró, buscar por orderId o orderNumber
      if (!order) {
        order = await Order.findOne({
          $or: [
            { orderId: orderId },
            { orderNumber: orderId }
          ]
        });
      }

      return order;
    } catch (error) {
      console.error('❌ Error obteniendo pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido por su número de pedido
   * @param orderNumber - Número del pedido
   * @returns El pedido encontrado
   */
  async getOrderByNumber(orderNumber: string): Promise<IOrder | null> {
    try {
      const order = await Order.findOne({ orderNumber });
      return order;
    } catch (error) {
      console.error('❌ Error obteniendo pedido por número:', error);
      throw error;
    }
  }

  /**
   * Obtiene el estado de un pedido
   * @param orderId - ID del pedido
   * @returns El estado del pedido o null si no existe
   */
  async getOrderStatus(orderId: string): Promise<{ status: OrderStatus; orderNumber: string } | null> {
    try {
      const order = await this.getOrderById(orderId);
      if (!order) {
        return null;
      }
      return {
        status: order.status,
        orderNumber: order.orderNumber
      };
    } catch (error) {
      console.error('❌ Error obteniendo estado del pedido:', error);
      throw error;
    }
  }

  /**
   * Actualiza el estado de un pedido
   * @param orderId - ID del pedido
   * @param status - Nuevo estado
   * @returns El pedido actualizado
   */
  async updateOrderStatus(orderId: string, status: OrderStatus): Promise<IOrder | null> {
    try {
      const order = await this.getOrderById(orderId);
      
      if (!order) {
        return null;
      }

      order.status = status;
      order.updatedAt = new Date();
      await order.save();

      // Publicar evento de actualización
      await this.eventPublisher.publishEvent('order.updated', {
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        status: order.status,
        updatedAt: order.updatedAt
      });

      return order;
    } catch (error) {
      console.error('❌ Error actualizando estado del pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene todos los pedidos (con paginación opcional)
   * @param limit - Límite de resultados
   * @param skip - Número de resultados a saltar
   * @returns Lista de pedidos
   */
  async getAllOrders(limit: number = 50, skip: number = 0): Promise<IOrder[]> {
    try {
      const orders = await Order.find()
        .sort({ createdAt: -1 })
        .limit(limit)
        .skip(skip);
      return orders;
    } catch (error) {
      console.error('❌ Error obteniendo pedidos:', error);
      throw error;
    }
  }

  /**
   * Cancela un pedido
   * @param orderId - ID del pedido a cancelar
   * @param reason - Razón de la cancelación (opcional)
   * @param cancelledBy - Quién cancela: 'customer' o 'admin'
   * @returns El pedido cancelado
   */
  async cancelOrder(
    orderId: string,
    reason?: string,
    cancelledBy: 'customer' | 'admin' = 'customer'
  ): Promise<IOrder> {
    try {
      const order = await this.getOrderById(orderId);

      if (!order) {
        throw new Error(`Pedido ${orderId} no encontrado`);
      }

      // Validar que solo se puede cancelar si está en estado PENDING o RECEIVED
      const cancellableStatuses = [OrderStatus.PENDING, 'received']; // 'received' es desde Kitchen Service

      if (!cancellableStatuses.includes(order.status as any)) {
        throw new Error(
          `No se puede cancelar un pedido en estado "${order.status}". ` +
          `Solo se pueden cancelar pedidos pendientes o recibidos en cocina.`
        );
      }

      // Guardar historial de cancelación antes de actualizar
      const cancellation = new OrderCancellation({
        orderId: order._id.toString(),
        orderNumber: order.orderNumber,
        customerName: order.customerName,
        customerEmail: order.customerName,
        reason: reason || 'Sin especificar',
        previousStatus: order.status,
        cancelledBy,
        cancelledAt: new Date()
      });

      await cancellation.save();
      console.log(`📝 Cancelación registrada: ${order.orderNumber}`);

      // Actualizar estado del pedido a CANCELLED
      order.status = OrderStatus.CANCELLED;
      order.updatedAt = new Date();
      const cancelledOrder = await order.save();

      // Publicar evento order.cancelled para notification-service
      const eventData = {
        type: 'order.cancelled',
        orderId: cancelledOrder._id.toString(),
        orderNumber: cancelledOrder.orderNumber,
        customerName: cancelledOrder.customerName,
        customerEmail: order.customerName,
        previousStatus: cancellation.previousStatus,
        reason: reason || 'Sin especificar',
        cancelledBy,
        timestamp: new Date().toISOString(),
        data: {
          cancelledAt: cancellation.cancelledAt,
          items: cancelledOrder.items,
          total: cancelledOrder.total
        }
      };

      await this.eventPublisher.publishEvent('order.cancelled', eventData);
      console.log(`📤 Evento publicado: order.cancelled para ${cancelledOrder.orderNumber}`);

      return cancelledOrder;
    } catch (error) {
      console.error('❌ Error cancelando pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene el historial de cancelaciones de un pedido
   */
  async getOrderCancellationHistory(orderId: string): Promise<any> {
    try {
      const cancellation = await OrderCancellation.findOne({ orderId });
      return cancellation;
    } catch (error) {
      console.error('❌ Error obteniendo historial de cancelación:', error);
      throw error;
    }
  }

  /**
   * Genera un número de pedido único
   * @returns Número de pedido único
   */
  private async generateOrderNumber(): Promise<string> {
    let orderNumber: string;
    let exists = true;
    let attempts = 0;
    const maxAttempts = 10;

    while (exists && attempts < maxAttempts) {
      const timestamp = Date.now();
      const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      orderNumber = `ORD-${timestamp}-${random}`;

      const existingOrder = await Order.findOne({ orderNumber });
      exists = existingOrder !== null;
      attempts++;
    }

    if (exists) {
      throw new Error('No se pudo generar un número de pedido único');
    }

    return orderNumber!;
  }
}

// Instancia singleton del servicio con Dependency Injection
import { rabbitMQClient } from '../rabbitmq/rabbitmqClient';
import { RabbitMQEventPublisher } from '../adapters/RabbitMQEventPublisher';

const eventPublisher = new RabbitMQEventPublisher(rabbitMQClient);
export const orderService = new OrderService(eventPublisher);
