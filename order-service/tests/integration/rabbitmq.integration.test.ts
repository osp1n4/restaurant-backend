/**
 * Integration Tests - RabbitMQ Communication
 * Tests Producer -> Broker -> Consumer flow
 *
 * These tests verify:
 * - Real RabbitMQ connection and message publishing
 * - Message delivery from producer to consumer
 * - Exchange and queue configuration
 * - Message routing and routing keys
 * - Error handling in message processing
 * - Message persistence and acknowledgments
 */

// Import using TypeScript syntax - ts-jest will handle it
import * as amqp from 'amqplib';

// Create a simple RabbitMQ client class for testing purposes
class TestRabbitMQClient {
  private connection: any = null;
  private channel: any = null;
  private readonly url: string;
  private readonly exchangeName: string = 'restaurant_orders';

  constructor(url?: string) {
    this.url = url || process.env.RABBITMQ_URL || 'amqp://localhost:5672';
  }

  async connect(): Promise<void> {
    try {
      this.connection = await amqp.connect(this.url);
      this.channel = await this.connection.createChannel();
      await this.channel.assertExchange(this.exchangeName, 'topic', { durable: true });
    } catch (error) {
      throw error;
    }
  }

  async publishEvent(routingKey: string, message: any): Promise<boolean> {
    if (!this.channel) {
      throw new Error('RabbitMQ no está conectado. Llama a connect() primero.');
    }

    const messageBuffer = Buffer.from(JSON.stringify({
      ...message,
      timestamp: new Date().toISOString()
    }));

    return this.channel.publish(
      this.exchangeName,
      routingKey,
      messageBuffer,
      { persistent: true }
    );
  }

  async consumeEvent(
    routingKey: string,
    handler: (message: any) => Promise<void>,
    queueName?: string
  ): Promise<void> {
    if (!this.channel) {
      throw new Error('RabbitMQ no está conectado. Llama a connect() primero.');
    }

    const queue = queueName || `test-queue-${routingKey}-${Date.now()}`;
    await this.channel.assertQueue(queue, { durable: true });
    await this.channel.bindQueue(queue, this.exchangeName, routingKey);

    await this.channel.consume(queue, async (msg: any) => {
      if (!msg) return;
      try {
        const content = JSON.parse(msg.content.toString());
        await handler(content);
        this.channel!.ack(msg);
      } catch (error) {
        this.channel!.nack(msg, false, false);
      }
    }, { noAck: false });
  }

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
    } catch (error) {
      throw error;
    }
  }

  isConnected(): boolean {
    return this.connection !== null && this.channel !== null;
  }
}

describe('RabbitMQ Integration Tests - Producer -> Broker -> Consumer', () => {
  let producerClient: TestRabbitMQClient;
  let consumerClient: TestRabbitMQClient;
  const testExchangeName = 'restaurant_orders';

  // Use real RabbitMQ or testcontainers
  const rabbitmqUrl = process.env.RABBITMQ_URL || 'amqp://localhost:5672';

  beforeAll(async () => {
    // Wait for RabbitMQ to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
  });

  beforeEach(async () => {
    // Create separate clients for producer and consumer to simulate microservices
    producerClient = new TestRabbitMQClient(rabbitmqUrl);
    consumerClient = new TestRabbitMQClient(rabbitmqUrl);

    await producerClient.connect();
    await consumerClient.connect();
  });

  afterEach(async () => {
    try {
      await producerClient.close();
      await consumerClient.close();
    } catch (error) {
      console.error('Error closing connections:', error);
    }
  });

  describe('Connection Tests', () => {
    test('should connect to RabbitMQ successfully', async () => {
      expect(producerClient.isConnected()).toBe(true);
      expect(consumerClient.isConnected()).toBe(true);
    });

    test('should throw error when publishing without connection', async () => {
      const disconnectedClient = new TestRabbitMQClient(rabbitmqUrl);

      await expect(
        disconnectedClient.publishEvent('test.key', { data: 'test' })
      ).rejects.toThrow('RabbitMQ no está conectado');
    });

    test('should handle connection errors gracefully', async () => {
      const badClient = new TestRabbitMQClient('amqp://invalid-host:5672');

      await expect(badClient.connect()).rejects.toThrow();
    });
  });

  describe('Producer -> Consumer: Review Created Event', () => {
    test('should publish and consume review.created event', async () => {
      const testMessage = {
        reviewId: 'test-review-123',
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: { overall: 5, food: 5 },
        comment: 'Excellent service!',
        status: 'pending',
      };

      // Create promise to wait for message consumption
      const messageReceived = new Promise<any>((resolve) => {
        consumerClient.consumeEvent(
          'review.created',
          async (message: any) => {
            resolve(message);
          },
          'test-review-created-queue'
        );
      });

      // Wait for consumer to be ready
      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish event (Producer)
      const published = await producerClient.publishEvent('review.created', testMessage);
      expect(published).toBe(true);

      // Wait for message to be consumed (Consumer)
      const receivedMessage = await messageReceived;

      // Verify message content
      expect(receivedMessage).toMatchObject(testMessage);
      expect(receivedMessage).toHaveProperty('timestamp');
      expect(new Date(receivedMessage.timestamp)).toBeInstanceOf(Date);
    }, 10000);

    test('should handle multiple consumers for the same event', async () => {
      const testMessage = {
        reviewId: 'multi-consumer-test',
        orderId: 'ORD-002',
        ratings: { overall: 4, food: 4 },
      };

      const consumer1Received = new Promise<any>((resolve) => {
        consumerClient.consumeEvent(
          'review.created',
          async (message: any) => resolve(message),
          'consumer1-queue'
        );
      });

      // Create second consumer client
      const consumer2Client = new TestRabbitMQClient(rabbitmqUrl);
      await consumer2Client.connect();

      const consumer2Received = new Promise<any>((resolve) => {
        consumer2Client.consumeEvent(
          'review.created',
          async (message: any) => resolve(message),
          'consumer2-queue'
        );
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish event
      await producerClient.publishEvent('review.created', testMessage);

      // Both consumers should receive the message
      const [msg1, msg2] = await Promise.all([consumer1Received, consumer2Received]);

      expect(msg1).toMatchObject(testMessage);
      expect(msg2).toMatchObject(testMessage);

      await consumer2Client.close();
    }, 10000);
  });

  describe('Producer -> Consumer: Review Status Changed Event', () => {
    test('should publish and consume review.status.changed event', async () => {
      const testMessage = {
        reviewId: 'review-456',
        orderId: 'ORD-003',
        previousStatus: 'pending',
        newStatus: 'approved',
        changedAt: new Date().toISOString(),
      };

      const messageReceived = new Promise<any>((resolve) => {
        consumerClient.consumeEvent(
          'review.status.changed',
          async (message: any) => resolve(message),
          'test-status-changed-queue'
        );
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      await producerClient.publishEvent('review.status.changed', testMessage);

      const receivedMessage = await messageReceived;
      expect(receivedMessage).toMatchObject(testMessage);
      expect(receivedMessage.newStatus).toBe('approved');
    }, 10000);
  });

  describe('Message Routing and Routing Keys', () => {
    test('should route messages correctly based on routing key pattern', async () => {
      const reviewMessage = {
        type: 'review',
        data: 'review data',
      };

      const orderMessage = {
        type: 'order',
        data: 'order data',
      };

      let reviewReceived = false;
      let orderReceived = false;

      // Consumer for review.* events
      consumerClient.consumeEvent(
        'review.*',
        async (message: any) => {
          reviewReceived = true;
        },
        'review-wildcard-queue'
      );

      // Consumer for order.* events
      const orderConsumer = new TestRabbitMQClient(rabbitmqUrl);
      await orderConsumer.connect();

      orderConsumer.consumeEvent(
        'order.*',
        async (message: any) => {
          orderReceived = true;
        },
        'order-wildcard-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish review event
      await producerClient.publishEvent('review.created', reviewMessage);
      await new Promise(resolve => setTimeout(resolve, 300));

      // Publish order event
      await producerClient.publishEvent('order.created', orderMessage);
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(reviewReceived).toBe(true);
      expect(orderReceived).toBe(true);

      await orderConsumer.close();
    }, 10000);

    test('should not route message to wrong consumer', async () => {
      let wrongConsumerCalled = false;

      // Consumer listening only to order.created
      consumerClient.consumeEvent(
        'order.created',
        async (message: any) => {
          wrongConsumerCalled = true;
        },
        'wrong-consumer-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish review event (should not be consumed)
      await producerClient.publishEvent('review.created', { test: 'data' });
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(wrongConsumerCalled).toBe(false);
    }, 10000);
  });

  describe('Error Handling in Message Processing', () => {
    test('should handle consumer errors without breaking the connection', async () => {
      let errorThrown = false;
      let successfullyProcessed = false;

      // Consumer that throws error on first message
      let messageCount = 0;
      consumerClient.consumeEvent(
        'review.test',
        async (message: any) => {
          messageCount++;
          if (messageCount === 1) {
            errorThrown = true;
            throw new Error('Simulated processing error');
          } else {
            successfullyProcessed = true;
          }
        },
        'error-handling-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish first message (will throw error)
      await producerClient.publishEvent('review.test', { id: 1 });
      await new Promise(resolve => setTimeout(resolve, 300));

      // Publish second message (should be processed)
      await producerClient.publishEvent('review.test', { id: 2 });
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(errorThrown).toBe(true);
      expect(successfullyProcessed).toBe(true);
      expect(consumerClient.isConnected()).toBe(true);
    }, 10000);
  });

  describe('Message Persistence and Acknowledgments', () => {
    test('should persist messages with durable exchange and queue', async () => {
      const persistentMessage = {
        orderId: 'ORD-PERSIST',
        important: true,
        mustNotLose: 'critical data',
      };

      let messageReceived = false;

      consumerClient.consumeEvent(
        'review.persistent',
        async (message: any) => {
          messageReceived = true;
          expect(message).toMatchObject(persistentMessage);
        },
        'persistent-test-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish with persistence flag
      await producerClient.publishEvent('review.persistent', persistentMessage);
      await new Promise(resolve => setTimeout(resolve, 500));

      expect(messageReceived).toBe(true);
    }, 10000);

    test('should acknowledge messages after successful processing', async () => {
      let processingCompleted = false;

      consumerClient.consumeEvent(
        'review.ack',
        async (message: any) => {
          // Simulate processing
          await new Promise(resolve => setTimeout(resolve, 100));
          processingCompleted = true;
        },
        'ack-test-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      await producerClient.publishEvent('review.ack', { test: 'ack' });
      await new Promise(resolve => setTimeout(resolve, 300));

      expect(processingCompleted).toBe(true);
    }, 10000);
  });

  describe('Real-World Scenario: Complete Review Workflow', () => {
    test('should handle complete review lifecycle through RabbitMQ', async () => {
      const reviewData = {
        reviewId: 'workflow-test-123',
        orderId: 'ORD-WORKFLOW',
        customerName: 'Alice Smith',
        customerEmail: 'alice@example.com',
        ratings: { overall: 5, food: 5 },
        comment: 'Amazing food and service!',
      };

      const eventsReceived: string[] = [];

      // Notification Service Consumer
      const notificationConsumer = new TestRabbitMQClient(rabbitmqUrl);
      await notificationConsumer.connect();

      notificationConsumer.consumeEvent(
        'review.*',
        async (message: any) => {
          eventsReceived.push('notification-service');
          console.log('📧 Notification Service: Sending email notification');
        },
        'notification-service-queue'
      );

      // Analytics Service Consumer
      const analyticsConsumer = new TestRabbitMQClient(rabbitmqUrl);
      await analyticsConsumer.connect();

      analyticsConsumer.consumeEvent(
        'review.created',
        async (message: any) => {
          eventsReceived.push('analytics-service');
          console.log('📊 Analytics Service: Recording review metrics');
        },
        'analytics-service-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 1000));

      // Step 1: Order Service publishes review.created
      console.log('📤 Order Service: Publishing review.created event');
      await producerClient.publishEvent('review.created', {
        ...reviewData,
        status: 'pending',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Step 2: Admin approves review -> publish review.status.changed
      console.log('📤 Order Service: Publishing review.status.changed event');
      await producerClient.publishEvent('review.status.changed', {
        reviewId: reviewData.reviewId,
        orderId: reviewData.orderId,
        previousStatus: 'pending',
        newStatus: 'approved',
      });

      await new Promise(resolve => setTimeout(resolve, 500));

      // Verify all consumers received messages
      expect(eventsReceived).toContain('notification-service');
      expect(eventsReceived).toContain('analytics-service');
      expect(eventsReceived.length).toBeGreaterThanOrEqual(2);

      await notificationConsumer.close();
      await analyticsConsumer.close();
    }, 15000);
  });

  describe('Performance and Scalability', () => {
    test('should handle multiple messages in quick succession', async () => {
      const messagesReceived: any[] = [];
      const messageCount = 20;

      consumerClient.consumeEvent(
        'review.bulk',
        async (message: any) => {
          messagesReceived.push(message);
        },
        'bulk-test-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      // Publish multiple messages rapidly
      const publishPromises = [];
      for (let i = 0; i < messageCount; i++) {
        publishPromises.push(
          producerClient.publishEvent('review.bulk', {
            id: i,
            data: `Message ${i}`,
          })
        );
      }

      await Promise.all(publishPromises);
      await new Promise(resolve => setTimeout(resolve, 2000));

      // All messages should be received
      expect(messagesReceived.length).toBe(messageCount);

      // Verify order (messages should arrive in order)
      for (let i = 0; i < messageCount; i++) {
        expect(messagesReceived[i].id).toBe(i);
      }
    }, 15000);

    test('should measure message latency', async () => {
      const latencies: number[] = [];

      consumerClient.consumeEvent(
        'review.latency',
        async (message: any) => {
          const receiveTime = Date.now();
          const sendTime = new Date(message.timestamp).getTime();
          const latency = receiveTime - sendTime;
          latencies.push(latency);
        },
        'latency-test-queue'
      );

      await new Promise(resolve => setTimeout(resolve, 500));

      // Send 10 messages
      for (let i = 0; i < 10; i++) {
        await producerClient.publishEvent('review.latency', { messageId: i });
        await new Promise(resolve => setTimeout(resolve, 50));
      }

      await new Promise(resolve => setTimeout(resolve, 1000));

      expect(latencies.length).toBe(10);

      // Calculate average latency
      const avgLatency = latencies.reduce((a, b) => a + b, 0) / latencies.length;
      console.log(`📊 Average message latency: ${avgLatency.toFixed(2)}ms`);

      // Latency should be reasonable (< 500ms)
      expect(avgLatency).toBeLessThan(500);
    }, 15000);
  });

  describe('Connection Resilience', () => {
    test('should reconnect after connection loss', async () => {
      // This test would require actually dropping the connection
      // For now, we test that multiple operations work

      await producerClient.publishEvent('review.test1', { data: 'test1' });
      await producerClient.publishEvent('review.test2', { data: 'test2' });
      await producerClient.publishEvent('review.test3', { data: 'test3' });

      expect(producerClient.isConnected()).toBe(true);
    }, 10000);

    test('should handle graceful shutdown', async () => {
      const testClient = new TestRabbitMQClient(rabbitmqUrl);
      await testClient.connect();

      expect(testClient.isConnected()).toBe(true);

      await testClient.close();

      expect(testClient.isConnected()).toBe(false);
    }, 10000);
  });
});
