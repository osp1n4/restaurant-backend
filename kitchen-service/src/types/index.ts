/**
 * Tipos y eventos del Kitchen Service
 */

// ========================================
// EVENTOS DE ENTRADA (Consumidos)
// ========================================

/**
 * Evento order.created recibido del order-service (paso 1)
 */
export interface OrderCreatedEvent {
  orderId: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  notes?: string;
  totalAmount?: number;
  createdAt?: string;
}

// ========================================
// EVENTOS DE SALIDA (Publicados)
// ========================================

/**
 * Evento order.received publicado para notification-service (paso 3)
 */
export interface OrderReceivedEvent {
  orderId: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'RECEIVED';
  receivedAt: Date;
  estimatedTime?: number;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
}

/**
 * Evento order.cancelled recibido del order-service
 */
export interface OrderCancelledEvent {
  orderId: string;
  orderNumber: string;
  customerName?: string;
  customerEmail?: string;
  status: 'CANCELLED';
  timestamp: string;
  data?: {
    cancelledAt: string;
  };
}

/**
 * Evento order.preparing publicado para notification-service (paso 6)
 */
export interface OrderPreparingEvent {
  orderId: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'PREPARING';
  preparingAt: Date;
  estimatedTime?: number;
}

/**
 * Evento order.ready publicado para notification-service (paso 9)
 */
export interface OrderReadyEvent {
  orderId: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  status: 'READY';
  readyAt: Date;
  receivedAt: Date;
  preparingAt?: Date;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
}

// ========================================
// RESPUESTAS DE API
// ========================================

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  count?: number;
}

export interface OrderStatusTransition {
  from: 'RECEIVED' | 'PREPARING' | 'READY';
  to: 'RECEIVED' | 'PREPARING' | 'READY';
  timestamp: Date;
}
