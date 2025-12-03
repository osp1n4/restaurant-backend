import * as amqplib from 'amqplib';
import { rabbitMQClient } from '../rabbitmq/rabbitmqClient';

// Esta prueba valida el flujo real de publicación y consumo del evento order.cancelled.
// No usa mocks y requiere un broker RabbitMQ accesible (RABBITMQ_URL).
describe('order.cancelled - Integration (Producer -> Broker -> Consumer)', () => {
  const EXCHANGE = 'restaurant_orders';
  const ROUTING_KEY = 'order.cancelled';
  const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

  let connection: amqplib.ChannelModel | null = null;
  let channel: amqplib.Channel | null = null;

  beforeAll(async () => {
    try {
      connection = await amqplib.connect(RABBITMQ_URL);
      channel = await connection.createChannel();
      await channel.assertExchange(EXCHANGE, 'topic', { durable: true });
    } catch (err) {
      console.warn('⏭️ RabbitMQ no disponible, se omite prueba de integración:', (err as Error).message);
      // Marcar skip si no hay broker
      // @ts-ignore
      (global as any).rabbitUnavailable = true;
    }
  });

  afterAll(async () => {
    try {
      if (channel) await channel.close();
      if (connection) await connection.close();
    } catch {
      // noop
    }
  });

  const shouldSkip = () => (global as any).rabbitUnavailable === true;

  it('publica y recibe el evento order.cancelled con payload esperado', async () => {
    if (shouldSkip()) {
      console.warn('⏭️ Prueba omitida: RabbitMQ no disponible');
      return;
    }

    // Crear una queue temporal y bind al routingKey
    const asserted = await channel!.assertQueue('', { exclusive: true, durable: false, autoDelete: true });
    await channel!.bindQueue(asserted.queue, EXCHANGE, ROUTING_KEY);

    // Consumir una sola vez y validar contenido
    const receivedPromise = new Promise<any>((resolve, reject) => {
      channel!.consume(asserted.queue, (msg) => {
        if (!msg) return reject(new Error('Mensaje nulo'));
        try {
          const content = JSON.parse(msg.content.toString());
          resolve(content);
          channel!.ack(msg);
        } catch (e) {
          reject(e);
        }
      }, { noAck: false });
    });

    // Publicar usando el cliente del servicio
    await rabbitMQClient.connect();
    const payload = {
      type: 'order.cancelled',
      orderId: 'order-integration-1',
      orderNumber: 'ORD-INT-0001',
      customerName: 'Tester',
      customerEmail: 'tester@example.com',
      previousStatus: 'pending',
      reason: 'integration-test',
      cancelledBy: 'admin',
      timestamp: new Date().toISOString(),
      data: {
        cancelledAt: new Date().toISOString(),
        items: [{ name: 'Pizza', quantity: 1, price: 10 }],
        total: 10,
      }
    };
    await rabbitMQClient.publishEvent(ROUTING_KEY, payload);

    const received = await Promise.race([
      receivedPromise,
      new Promise((_resolve, reject) => setTimeout(() => reject(new Error('Timeout esperando mensaje')), 5000))
    ]);

    expect(received).toMatchObject({
      type: 'order.cancelled',
      orderId: 'order-integration-1',
      reason: 'integration-test',
      cancelledBy: 'admin',
    });
  }, 15000);
});
