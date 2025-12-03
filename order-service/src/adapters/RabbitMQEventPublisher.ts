import { IEventPublisher } from '../interfaces/IEventPublisher';
import { RabbitMQClient } from '../rabbitmq/rabbitmqClient';

/**
 * Adaptador para RabbitMQ que implementa IEventPublisher
 * Patrón de Diseño: Adapter Pattern
 *
 * Objetivo: Encapsular la implementación concreta de RabbitMQ
 * detrás de la interfaz IEventPublisher, permitiendo intercambiar
 * la implementación sin afectar a los servicios que la consumen.
 *
 * Principio SOLID: Open/Closed Principle (OCP)
 * Abierto a extensión (nuevos adapters), cerrado a modificación.
 */
export class RabbitMQEventPublisher implements IEventPublisher {
  /**
   * Constructor con dependency injection
   * @param client - Cliente de RabbitMQ configurado
   */
  constructor(private readonly client: RabbitMQClient) {}

  /**
   * Implementación del método publishEvent usando RabbitMQ
   * Delega la publicación al cliente de RabbitMQ subyacente
   *
   * @param eventType - Tipo de evento a publicar
   * @param data - Datos del evento
   */
  async publishEvent(eventType: string, data: any): Promise<void> {
    await this.client.publishEvent(eventType, data);
  }
}
