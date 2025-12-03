import { connect, Connection, Channel } from 'amqplib';

export class RabbitMQClient {
  consume(arg0: string, arg1: string, arg2: (orderData: any) => Promise<void>) {
    throw new Error('Method not implemented.');
  }
  private connection: Awaited<ReturnType<typeof connect>> | null = null;
  private channel: Channel | null = null;
  private readonly url: string;
  private readonly exchangeName: string = 'restaurant_orders';

  constructor(url?: string) {
    this.url = url || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  /**
   * Conecta a RabbitMQ y crea el canal y exchange
   */
  async connect(): Promise<void> {
    try {
      console.log('🔄 Conectando a RabbitMQ...');
      this.connection = await connect(this.url);
      this.channel = await this.connection.createChannel();
      
      // Crear exchange de tipo topic para eventos de pedidos
      await this.channel.assertExchange(this.exchangeName, 'topic', {
        durable: true
      });

      console.log('✅ Conectado a RabbitMQ exitosamente');
    } catch (error) {
      console.error('❌ Error conectando a RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Publica un evento relacionado con pedidos
   * @param routingKey - Clave de enrutamiento (ej: 'order.created', 'order.updated')
   * @param message - Mensaje a publicar
   */
  async publishEvent(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ no está conectado. Llama a connect() primero.');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));

      const published = this.channel.publish(
        this.exchangeName,
        routingKey,
        messageBuffer,
        {
          persistent: true // Los mensajes se guardan en disco
        }
      );

      if (published) {
        console.log(`📤 Evento publicado: ${routingKey}`, message);
      } else {
        console.warn(`⚠️ Buffer lleno, evento no publicado: ${routingKey}`);
      }

      return published;
    } catch (error) {
      console.error(`❌ Error publicando evento ${routingKey}:`, error);
      throw error;
    }
  }

  /**
   * Cierra la conexión a RabbitMQ
   */
  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
        this.channel = null;
      }
      if (this.connection) {
        await this.connection.close();
        this.connection = null;
      }
      console.log('🔌 Conexión a RabbitMQ cerrada');
    } catch (error) {
      console.error('❌ Error cerrando conexión a RabbitMQ:', error);
      throw error;
    }
  }

  /**
   * Consume eventos de un routing key específico
   * @param routingKey - Clave de enrutamiento a consumir (ej: 'order.ready')
   * @param queueName - Nombre de la cola (opcional, se genera automáticamente si no se proporciona)
   * @param handler - Función que maneja el mensaje recibido
   */
  async consumeEvent(
    routingKey: string,
    handler: (message: any) => Promise<void>,
    queueName?: string
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ no está conectado. Llama a connect() primero.');
    }

    try {
      // Crear cola temporal exclusiva si no se proporciona nombre
      const queue = queueName || `order-service-${routingKey}`;
      
      await this.channel.assertQueue(queue, {
        durable: true // La cola sobrevive a reinicios del servidor
      });

      // Vincular la cola al exchange con el routing key
      await this.channel.bindQueue(queue, this.exchangeName, routingKey);

      console.log(`📥 Suscrito a eventos: ${routingKey} (cola: ${queue})`);

      // Consumir mensajes
      await this.channel.consume(queue, async (msg) => {
        if (!msg) {
          return;
        }

        try {
          const content = JSON.parse(msg.content.toString());
          console.log(`📨 Evento recibido: ${routingKey}`, content);
          
          await handler(content);
          
          // Confirmar procesamiento del mensaje
          this.channel!.ack(msg);
        } catch (error) {
          console.error(`❌ Error procesando mensaje de ${routingKey}:`, error);
          // Rechazar el mensaje y no reenviarlo a la cola
          this.channel!.nack(msg, false, false);
        }
      }, {
        noAck: false // Requiere confirmación manual del procesamiento
      });
    } catch (error) {
      console.error(`❌ Error suscribiéndose a ${routingKey}:`, error);
      throw error;
    }
  }

  /**
   * Verifica si está conectado
   */
  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

// Instancia singleton del cliente RabbitMQ
export const rabbitMQClient = new RabbitMQClient();

