import * as amqp from 'amqplib/callback_api';
import notificationService from '../services/notificationService';
import { OrderEvent } from '../types';

/**
 * Consumer de RabbitMQ
 * Responsabilidad única: Conectar a RabbitMQ y consumir eventos
 */
class RabbitMQConsumer {
  private connection: amqp.Connection | null = null;
  private channel: amqp.Channel | null = null;
  private readonly EXCHANGE = 'restaurant_orders';
  private readonly QUEUE = 'notifications';

  async connect(): Promise<void> {
    try {
      const rabbitUrl = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
      
      // Conectar con retry
      this.connection = await this.connectWithRetry(rabbitUrl);
      this.channel = await this.createChannel(this.connection);

      // Configurar exchange y queue
      await this.assertExchange();
      await this.assertQueue();

      // Binding: escuchar todos los eventos
      await this.bindQueue('order.created');
      await this.bindQueue('order.received');
      await this.bindQueue('order.updated');
      await this.bindQueue('order.preparing');
      await this.bindQueue('order.ready');
      await this.bindQueue('order.cancelled');

      // Consumir mensajes
      await this.consumeMessages();

      console.log('🐰 RabbitMQ conectado - Escuchando notificaciones...');
    } catch (error) {
      console.error('❌ Error al conectar RabbitMQ:', error);
      throw error;
    }
  }

  // Reintentar conexión con backoff
  private async connectWithRetry(url: string, maxRetries = 5): Promise<amqp.Connection> {
    for (let i = 0; i < maxRetries; i++) {
      try {
        return await this.connectPromise(url);
      } catch (error) {
        const waitTime = Math.min(1000 * Math.pow(2, i), 10000);
        console.log(`⏳ Reintentando conexión en ${waitTime}ms...`);
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }
    }
    throw new Error('No se pudo conectar a RabbitMQ después de varios intentos');
  }

  // Wrapper para convertir callback a Promise
  private connectPromise(url: string): Promise<amqp.Connection> {
    return new Promise((resolve, reject) => {
      amqp.connect(url, (err, conn) => {
        if (err) reject(err);
        else resolve(conn);
      });
    });
  }

  // Crear canal con Promise
  private createChannel(connection: amqp.Connection): Promise<amqp.Channel> {
    return new Promise((resolve, reject) => {
      connection.createChannel((err, ch) => {
        if (err) reject(err);
        else resolve(ch);
      });
    });
  }

  // Assert exchange con Promise
  private assertExchange(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel!.assertExchange(this.EXCHANGE, 'topic', { durable: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Assert queue con Promise
  private assertQueue(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel!.assertQueue(this.QUEUE, { durable: true }, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Bind queue con Promise
  private bindQueue(routingKey: string): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel!.bindQueue(this.QUEUE, this.EXCHANGE, routingKey, {}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Consumir mensajes con Promise
  private consumeMessages(): Promise<void> {
    return new Promise((resolve, reject) => {
      this.channel!.consume(this.QUEUE, (msg) => {
        if (msg) {
          this.handleMessage(msg.content.toString());
          this.channel!.ack(msg);
        }
      }, {}, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  }

  // Procesar mensaje recibido
  // eslint-disable-next-line complexity
  private handleMessage(content: string): void {
    try {
      const rawEvent = JSON.parse(content);
      console.log('🔍 Raw event received:', JSON.stringify(rawEvent, null, 2));
      let event: OrderEvent | null = null;

      if (rawEvent.type && rawEvent.orderId) {
        console.log(`✅ Event has explicit type: ${rawEvent.type}`);
        event = {
          type: rawEvent.type as OrderEvent['type'],
          orderId: rawEvent.orderId,
          timestamp: rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date(),
          data: rawEvent.data || rawEvent
        };
      } else if (rawEvent.orderId) {
        console.log('⚠️ Event missing type, inferring...');
        let inferredType: OrderEvent['type'] = 'order.created';
        if (rawEvent.status === 'READY' || rawEvent.readyAt) {
          inferredType = 'order.ready';
        } else if (rawEvent.status === 'PREPARING' || rawEvent.preparingAt) {
          inferredType = 'order.preparing';
        } else if (rawEvent.status === 'RECEIVED' || rawEvent.receivedAt) {
          inferredType = 'order.received';
        }

        event = {
          type: inferredType,
          orderId: rawEvent.orderId,
          timestamp: rawEvent.timestamp ? new Date(rawEvent.timestamp) : new Date(),
          data: rawEvent
        };
      }

      if (!event) {
        console.warn('⚠️ Evento con formato desconocido:', rawEvent);
        return;
      }

      console.log(`📨 Evento recibido: ${event.type} - Order #${event.orderId}`);
      
      // Delegar al servicio de notificaciones
      notificationService.handleOrderEvent(event);
    } catch (error) {
      console.error('❌ Error al procesar mensaje:', error);
    }
  }

  // Cerrar conexión
  async close(): Promise<void> {
    return new Promise((resolve) => {
      if (this.channel) {
        this.channel.close(() => {
          if (this.connection) {
            this.connection.close(() => {
              console.log('🔌 RabbitMQ desconectado');
              resolve();
            });
          } else {
            resolve();
          }
        });
      } else {
        resolve();
      }
    });
  }
}

export default new RabbitMQConsumer();