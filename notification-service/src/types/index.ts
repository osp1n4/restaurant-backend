// Tipos de eventos que RabbitMQ publica
export type OrderEventType = 'order.created' | 'order.received' | 'order.preparing' | 'order.ready';

// Estructura de un evento de pedido
export interface OrderEvent {
  orderId: string;
  type: OrderEventType;
  timestamp: Date;
  data?: any;
}

// Estructura de una notificación para el cliente
export interface Notification {
  id: string;
  type: 'success' | 'info' | 'warning';
  message: string;
  orderId: string;
  timestamp: Date;
  eventType?: string;
  orderNumber?: string;  // ✅ Incluir orderNumber
  data?: any;            // ✅ Datos adicionales del evento
}