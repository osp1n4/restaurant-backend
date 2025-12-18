import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { RabbitMQClient } from './rabbitmq/rabbitmqClient';
import { KitchenService } from './services/kitchenService';
import { KitchenController } from './controllers/kitchenController';
import { createKitchenRoutes } from './routes/kitchenRoutes';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3002;
const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/kitchen';
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'kitchen-service',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected'
  });
});

// Función principal de inicialización
async function startServer() {
  try {
    console.log('🚀 Starting Kitchen Service...');

    // 1. Conectar a MongoDB
    console.log('📦 Connecting to MongoDB...');
    await mongoose.connect(MONGODB_URL);
    console.log('✅ MongoDB connected');

    // 2. Inicializar RabbitMQ
    console.log('🐇 Connecting to RabbitMQ...');
    const rabbitMQClient = new RabbitMQClient();
    await rabbitMQClient.connect(RABBITMQ_URL);
    console.log('✅ RabbitMQ connected');

    // 3. Crear instancias de servicio, controlador y rutas
    const kitchenService = new KitchenService(rabbitMQClient);
    const kitchenController = new KitchenController(kitchenService);
    const kitchenRoutes = createKitchenRoutes(kitchenController);

    // 4. Registrar rutas
    app.use('/api/kitchen', kitchenRoutes);

    // 5. Configurar consumidores de eventos RabbitMQ
    console.log('👂 Setting up RabbitMQ consumers...');
    
    // Consumer para order.created
    await rabbitMQClient.consume(
      'kitchen-service-queue',
      'order.created',
      async (orderData) => {
        console.log('📥 Received order.created event:', orderData);
        await kitchenService.handleOrderCreated(orderData);
      }
    );
    console.log('✅ Consumer ready for order.created events');

    // Configurar consumidor de eventos order.updated (para modificaciones)
    console.log('👂 Setting up RabbitMQ consumer for order.updated...');
    await rabbitMQClient.consume(
      'kitchen-service-updated-queue',
      'order.updated',
      async (orderData) => {
        console.log('📥 Received order.updated event:', orderData);
        await kitchenService.handleOrderUpdated(orderData);
      }
    );
    console.log('✅ Consumer ready for order.updated events');

    // Consumer para order.cancelled
    await rabbitMQClient.consume(
      'kitchen-service-cancelled-queue',
      'order.cancelled',
      async (cancelData) => {
        console.log('📥 Received order.cancelled event:', cancelData);
        await kitchenService.handleOrderCancelled(cancelData);
      }
    );
    console.log('✅ Consumer ready for order.cancelled events');

    // 6. Iniciar servidor
    // 6. Middleware de manejo de errores (después de las rutas)
    app.use(notFoundHandler);
    app.use(errorHandler);

    // 7. Iniciar servidor
    app.listen(PORT, () => {
      logger.info(`Kitchen Service running on port ${PORT}`);
      logger.info('Endpoints available: GET /api/kitchen/orders, POST /api/kitchen/orders/:orderId/start-preparing');
    });

    // Manejo de cierre graceful
    process.on('SIGINT', async () => {
      logger.info('Shutting down gracefully...');
      await mongoose.connection.close();
      await rabbitMQClient.close();
      process.exit(0);
    });
  } catch (error) {
    logger.error('Failed to start server', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

export default app;
