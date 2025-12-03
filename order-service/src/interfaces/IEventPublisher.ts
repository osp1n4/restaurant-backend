/**
 * Interfaz para publicación de eventos
 * Principio SOLID: Dependency Inversion Principle (DIP)
 *
 * Objetivo: Abstraer la implementación del sistema de mensajería
 * Permite inyectar diferentes implementaciones (RabbitMQ, Kafka, AWS SQS, etc.)
 * sin modificar los servicios que dependen de esta abstracción.
 *
 * Patrón de Diseño: Adapter Pattern
 * Los adaptadores concretos implementan esta interfaz para diferentes brokers.
 */
export interface IEventPublisher {
  /**
   * Publica un evento en el sistema de mensajería
   * @param eventType - Tipo de evento (ej: 'order.created', 'order.cancelled')
   * @param data - Datos del evento a publicar
   * @returns Promise que resuelve cuando el evento se ha publicado exitosamente
   */
  publishEvent(eventType: string, data: any): Promise<void>;
}
