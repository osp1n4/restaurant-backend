import amqplib, { Connection, Channel, ConsumeMessage } from 'amqplib';

export class RabbitMQClient {
  private connection: Connection | null = null;
  private channel: Channel | null = null;
  private readonly exchange: string;
  private readonly MAX_RETRIES = 3;
  private url: string;

  constructor(exchange: string = 'restaurant_orders') {
    this.exchange = exchange;
    this.url = process.env.RABBITMQ_URL || 'amqp://rabbitmq:5672';
  }

  async connect(url?: string): Promise<void> {
    if (url) {
      this.url = url;
    }

    try {
      console.log('🔌 Attempting to connect to RabbitMQ...');
      this.connection = await amqplib.connect(this.url);
      this.channel = await this.connection.createChannel();

      await this.channel.assertExchange(this.exchange, 'topic', { durable: true });
      await this.channel.prefetch(1);

      this.connection.on('error', (err: Error) => {
        console.error('❌ RabbitMQ connection error:', err);
      });

      this.connection.on('close', () => {
        console.log('⚠️ RabbitMQ connection closed. Reconnecting...');
        this.reconnect();
      });

      console.log('✅ Connected to RabbitMQ');
    } catch (error) {
      console.error('❌ Failed to connect to RabbitMQ:', error);
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  private async reconnect(): Promise<void> {
    try {
      await this.connect(this.url);
    } catch (error) {
      console.error('❌ Reconnection failed, retrying in 5s...');
      setTimeout(() => this.reconnect(), 5000);
    }
  }

  async publish(routingKey: string, message: any): Promise<void> {
    if (!this.channel) {
      console.error('❌ Cannot publish message: Channel not initialized.');
      throw new Error('Channel not initialized. Call connect() first.');
    }

    try {
      const messageBuffer = Buffer.from(JSON.stringify(message));
      await this.channel.publish(this.exchange, routingKey, messageBuffer);
      console.log(`📤 Message published to ${routingKey}`);
    } catch (error) {
      console.error('❌ Failed to publish message:', error);
    }
  }

  async consume(
    queue: string, 
    routingKey: string, 
    callback: (msg: any) => Promise<void>
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('Channel not initialized. Call connect() first.');
    }
    
    try {
      let queueName = queue;

      try {
        await this.channel.assertQueue(queueName, { 
          durable: true,
          arguments: {
            'x-dead-letter-exchange': `${this.exchange}_dlx`
          }
        });
      } catch (assertError: any) {
        if (assertError.code === 406) {
          console.warn(`⚠️ Queue ${queueName} exists with different arguments. Using alternative queue name.`);
          queueName = `${queue}-v5`;
          await this.channel.assertQueue(queueName, { 
            durable: true,
            arguments: {
              'x-dead-letter-exchange': `${this.exchange}_dlx`
            }
          });
        } else {
          throw assertError;
        }
      }

      await this.channel.bindQueue(queueName, this.exchange, routingKey);
      
      await this.channel.consume(
        queueName, 
        async (msg: ConsumeMessage | null) => {
          if (!msg) return;
          
          try {
            const content = JSON.parse(msg.content.toString());
            console.log(`📥 Received: ${routingKey}`, content);
            
            await callback(content);
            
            if (this.channel) {
              this.channel.ack(msg);
              console.log('✅ Message acknowledged');
            }
            
          } catch (error) {
            console.error('❌ Error processing message:', error);
            
            const retryCount = (msg.properties.headers?.['x-retry-count'] || 0) as number;
            
            if (retryCount < this.MAX_RETRIES) {
              console.log(`⚠️ Retry ${retryCount + 1}/${this.MAX_RETRIES}`);
              
              if (this.channel) {
                this.channel.publish(
                  this.exchange,
                  msg.fields.routingKey,
                  msg.content,
                  {
                    ...msg.properties,
                    headers: {
                      ...msg.properties.headers,
                      'x-retry-count': retryCount + 1
                    }
                  }
                );
                this.channel.ack(msg);
              }
            } else {
              console.log('❌ Max retries reached, sending to DLQ');
              if (this.channel) {
                this.channel.nack(msg, false, false);
              }
            }
          }
        },
        { noAck: false }
      );
      
      console.log(`👂 Listening to: ${routingKey} (queue: ${queueName})`);
      
    } catch (error) {
      console.error(`❌ Error setting up consumer for ${queue}:`, error);
      throw error;
    }
  }

  async close(): Promise<void> {
    try {
      if (this.channel) {
        await this.channel.close();
      }
      if (this.connection) {
        await this.connection.close();
      }
      console.log('✅ RabbitMQ connection closed gracefully');
    } catch (error) {
      console.error('❌ Error closing RabbitMQ connection:', error);
      throw error;
    }
  }

  isConnected(): boolean {
    try {
      return (
        this.connection !== null && 
        this.channel !== null &&
        // @ts-expect-error - amqplib types don't include connection property
        !this.connection.connection.closed
      );
    } catch {
      return false;
    }
  }
}