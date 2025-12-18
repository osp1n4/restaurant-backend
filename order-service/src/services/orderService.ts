import { Order, IOrder, OrderStatus, OrderItem } from '../models/Order';
import { rabbitMQClient } from '../rabbitmq/rabbitmqClient';

export class OrderService {
  /**
   * Crea un nuevo pedido
   * @param customerName - Nombre del cliente
   * @param items - Items del pedido
   * @param customerEmail - Email del cliente (opcional)
   * @param notes - Notas del pedido (opcional)
   * @returns El pedido creado
   */
  async createOrder(
    customerName: string,
    items: OrderItem[],
    customerEmail?: string,
    notes?: string
  ): Promise<IOrder> {
    try {
      // Generar número de pedido único
      const orderNumber = await this.generateOrderNumber();

      // Crear el pedido
      const order = new Order({
        orderNumber,
        customerName,
        customerEmail,
        items,
        notes,
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
        notes: savedOrder.notes,
        totalAmount: savedOrder.total,
        status: savedOrder.status,
        timestamp: new Date().toISOString(),
        createdAt: savedOrder.createdAt.toISOString(),
        data: {
          total: savedOrder.total,
          createdAt: savedOrder.createdAt
        }
      };

      // Intentar publicar evento, pero no fallar si RabbitMQ no está disponible
      try {
        await rabbitMQClient.publishEvent('order.created', eventData);
        console.log(`📤 Evento order.created publicado`);
      } catch (mqError) {
        console.warn(`⚠️ No se pudo publicar evento a RabbitMQ (el pedido se creó correctamente):`, mqError instanceof Error ? mqError.message : mqError);
      }

      console.log(`✅ Pedido creado: ${savedOrder.orderNumber}`);

      return savedOrder;
    } catch (error) {
      console.error('❌ Error creando pedido:', error);
      throw error;
    }
  }

  /**
   * Obtiene un pedido por su ID
   * @param orderId - ID del pedido
   * @returns El pedido encontrado
   */
  async getOrderById(orderId: string): Promise<IOrder | null> {
    try {
      const order = await Order.findById(orderId);
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
      const order = await Order.findById(orderId).select('status orderNumber');
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
   * Actualiza un pedido (items, notas, email)
   * Solo se puede actualizar si el pedido está en estado PENDING
   * @param orderId - ID del pedido
   * @param updateData - Datos a actualizar
   * @returns El pedido actualizado
   */
  async updateOrder(orderId: string, updateData: {
    items?: OrderItem[],
    notes?: string,
    customerEmail?: string
  }): Promise<IOrder | null> {
    try {
      // Buscar el pedido actual por orderNumber o por _id
      let currentOrder = null;
      if (orderId.startsWith('ORD-')) {
        currentOrder = await Order.findOne({ orderNumber: orderId });
      } else if (/^[a-fA-F0-9]{24}$/.test(orderId)) {
        currentOrder = await Order.findById(orderId);
      }

      if (!currentOrder) {
        return null;
      }

      // Validar que el pedido esté en estado PENDING
      if (currentOrder.status !== OrderStatus.PENDING) {
        throw new Error(`El pedido no se puede modificar porque ya está en estado ${currentOrder.status}`);
      }

      // Preparar datos de actualización
      const updates: any = { updatedAt: new Date() };
      
      if (updateData.items) {
        updates.items = updateData.items;
        // Recalcular total
        updates.total = updateData.items.reduce((sum, item) => sum + (item.price * item.quantity), 0);
      }
      
      if (updateData.notes !== undefined) {
        updates.notes = updateData.notes;
      }
      
      if (updateData.customerEmail) {
        updates.customerEmail = updateData.customerEmail;
      }

      // Actualizar en MongoDB usando el _id
      const updatedOrder = await Order.findByIdAndUpdate(
        currentOrder._id,
        updates,
        { new: true }
      );

      if (updatedOrder) {
        // Publicar evento order.updated a RabbitMQ
        try {
          await rabbitMQClient.publishEvent('order.updated', {
            type: 'order.updated',
            orderId: updatedOrder._id.toString(),
            orderNumber: updatedOrder.orderNumber,
            customerName: updatedOrder.customerName,
            customerEmail: updatedOrder.customerEmail,
            items: updatedOrder.items.map((item) => ({
              name: item.name,
              quantity: item.quantity,
              price: item.price
            })),
            notes: updatedOrder.notes,
            totalAmount: updatedOrder.total,
            status: updatedOrder.status,
            timestamp: new Date().toISOString(),
            updatedAt: updatedOrder.updatedAt.toISOString()
          });
          console.log(`📤 Evento order.updated publicado para ${updatedOrder.orderNumber}`);
        } catch (mqError) {
          console.warn(`⚠️ No se pudo publicar evento order.updated a RabbitMQ:`, mqError instanceof Error ? mqError.message : mqError);
        }
      }

      console.log(`✅ Pedido actualizado: ${updatedOrder?.orderNumber}`);
      return updatedOrder;
    } catch (error) {
      console.error('❌ Error actualizando pedido:', error);
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
      // Preparar el update con timestamps según el estado
      const updateData: any = { 
        status, 
        updatedAt: new Date() 
      };

      // Agregar timestamps específicos según el estado (US-031)
      if (status === OrderStatus.PREPARING) {
        updateData.preparingStartedAt = new Date();
      } else if (status === OrderStatus.READY) {
        updateData.readyAt = new Date();
      }

      const order = await Order.findByIdAndUpdate(
        orderId,
        updateData,
        { new: true }
      );

      if (order) {
        // Publicar evento de actualización (opcional)
        try {
          await rabbitMQClient.publishEvent('order.updated', {
            type: 'order.updated',
            orderId: order._id.toString(),
            orderNumber: order.orderNumber,
            status: order.status,
            updatedAt: order.updatedAt
          });
        } catch (mqError) {
          console.warn(`⚠️ No se pudo publicar evento de actualización a RabbitMQ:`, mqError instanceof Error ? mqError.message : mqError);
        }
      }

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
   * Solo se puede cancelar si el pedido está en estado PENDING
   * @param orderId - ID o número del pedido
   * @returns El pedido cancelado
   */
  async cancelOrder(orderId: string): Promise<IOrder | null> {
    try {
      // Buscar el pedido por orderNumber o por _id
      let currentOrder = null;
      if (orderId.startsWith('ORD-')) {
        currentOrder = await Order.findOne({ orderNumber: orderId });
      } else if (/^[a-fA-F0-9]{24}$/.test(orderId)) {
        currentOrder = await Order.findById(orderId);
      }

      if (!currentOrder) {
        return null;
      }

      // Validar que el pedido esté en estado PENDING
      if (currentOrder.status !== OrderStatus.PENDING) {
        throw new Error(
          `El pedido no se puede cancelar porque ya está en estado ${currentOrder.status}`
        );
      }

      // Actualizar estado a CANCELLED
      currentOrder.status = OrderStatus.CANCELLED;
      currentOrder.updatedAt = new Date();
      await currentOrder.save();

      console.log(`🚫 Pedido cancelado: ${currentOrder.orderNumber}`);

      // Publicar evento order.cancelled a RabbitMQ
      try {
        await rabbitMQClient.publishEvent('order.cancelled', {
          type: 'order.cancelled',
          orderId: currentOrder._id.toString(),
          orderNumber: currentOrder.orderNumber,
          customerName: currentOrder.customerName,
          customerEmail: currentOrder.customerEmail,
          status: 'CANCELLED',
          timestamp: new Date().toISOString(),
          data: {
            cancelledAt: currentOrder.updatedAt
          }
        });
        console.log(`📤 Evento order.cancelled publicado para ${currentOrder.orderNumber}`);
      } catch (mqError) {
        console.warn(
          `⚠️ No se pudo publicar evento order.cancelled a RabbitMQ:`,
          mqError instanceof Error ? mqError.message : mqError
        );
      }

      return currentOrder;
    } catch (error) {
      console.error('❌ Error cancelando pedido:', error);
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

// Instancia singleton del servicio
export const orderService = new OrderService();

