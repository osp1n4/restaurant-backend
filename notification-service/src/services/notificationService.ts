import { Response } from 'express';
import { Notification, OrderEvent } from '../types';

/**
 * Servicio de notificaciones - Patrón Observer
 * Responsabilidad única: Gestionar clientes SSE y enviar notificaciones
 */
class NotificationService {
  private clients: Response[] = [];
  private notificationCounter = 0;

  // Agregar nuevo cliente SSE
  addClient(res: Response): void {
    this.clients.push(res);
    console.log(`✅ Cliente conectado. Total: ${this.clients.length}`);

    // Enviar mensaje de bienvenida
    this.sendToClient(res, {
      id: Date.now().toString(),
      type: 'info',
      message: 'Conectado al sistema de notificaciones',
      orderId: '',
      timestamp: new Date()
    });
  }

  // Remover cliente desconectado
  removeClient(res: Response): void {
    this.clients = this.clients.filter(client => client !== res);
    console.log(`❌ Cliente desconectado. Total: ${this.clients.length}`);
  }

  // Procesar evento de RabbitMQ y crear notificación
  handleOrderEvent(event: OrderEvent): void {
    const notification = this.createNotification(event);
    this.broadcast(notification);
    console.log(`📢 Notificación enviada: ${notification.message}`);
  }

  // Crear notificación basada en tipo de evento
  private createNotification(event: OrderEvent): Notification {
    const messages: Record<OrderEvent['type'], string> = {
      'order.created': `Pedido #${event.orderId} recibido correctamente`,
      'order.received': `Pedido #${event.orderId} recibido en cocina`,
      'order.preparing': `Tu pedido #${event.orderId} está siendo preparado`,
      'order.ready': `¡Tu pedido #${event.orderId} está listo para recoger!`
    };

    const types: Record<OrderEvent['type'], Notification['type']> = {
      'order.created': 'info',
      'order.received': 'info',
      'order.preparing': 'warning',
      'order.ready': 'success'
    };

    return {
      id: `${Date.now()}-${this.notificationCounter++}`,
      type: types[event.type],
      message: messages[event.type],
      orderId: event.orderId,
      timestamp: new Date(),
      eventType: event.type,
      // ✅ Incluir orderNumber si existe en el evento
      orderNumber: event.data?.orderNumber,
      // ✅ Incluir todos los datos adicionales
      data: event.data
    };
  }

  // Enviar notificación a todos los clientes
  private broadcast(notification: Notification): void {
    this.clients.forEach(client => this.sendToClient(client, notification));
  }

  // Enviar datos a un cliente específico (formato SSE)
  private sendToClient(res: Response, notification: Notification): void {
    res.write(`data: ${JSON.stringify(notification)}\n\n`);
  }
}

// Singleton - una sola instancia compartida
export default new NotificationService();