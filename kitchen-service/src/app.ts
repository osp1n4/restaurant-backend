import express from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { RabbitMQClient } from './rabbitmq/rabbitmqClient';
import { KitchenService } from './services/kitchenService';
import { KitchenController } from './controllers/kitchenController';
import { createKitchenRoutes } from './routes/kitchenRoutes';

const app = express();
const PORT = process.env.PORT || 3002;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'kitchen-service',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Función principal de inicialización
async function startServer() {
  try {
    // 1. Conectar a MongoDB
    console.log('🔄 Conectando a MongoDB...');
    await connectDatabase();
    console.log('✅ MongoDB conectado');

    // 2. Inicializar RabbitMQ
    console.log('🐰 Conectando a RabbitMQ...');
    const rabbitMQClient = new RabbitMQClient();
    await rabbitMQClient.connect(RABBITMQ_URL);
    console.log('✅ RabbitMQ conectado');

    // 3. Crear instancias de servicio, controlador y rutas con Dependency Injection
    const { RabbitMQEventPublisher } = await import('./adapters/RabbitMQEventPublisher');
    const eventPublisher = new RabbitMQEventPublisher(rabbitMQClient);
    const kitchenService = new KitchenService(eventPublisher);
    const kitchenController = new KitchenController(kitchenService);
    const kitchenRoutes = createKitchenRoutes(kitchenController);

    // 4. Registrar rutas
    app.use('/api/kitchen', kitchenRoutes);

    // 5. Configurar consumidor de eventos order.created
    console.log('👂 Suscribiendo a eventos order.created...');
    await rabbitMQClient.consume(
      'kitchen-service-queue',
      'order.created',
      async (orderData) => {
        console.log('📥 Evento recibido: order.created', orderData);
        await kitchenService.handleOrderCreated(orderData);
      }
    );
    console.log('✅ Consumer listo para order.created');

    // 6. Iniciar servidor
    app.listen(PORT, () => {
      console.log(`👨‍🍳 Kitchen Service corriendo en puerto ${PORT}`);
      console.log(`📡 Endpoints disponibles:`);
      console.log(`   GET  /api/kitchen/orders`);
      console.log(`   GET  /api/kitchen/orders/:orderId`);
      console.log(`   POST /api/kitchen/orders/:orderId/start-preparing`);
      console.log(`   POST /api/kitchen/orders/:orderId/ready`);
      console.log(`   GET  /health`);
    });

    // Manejo de cierre graceful
    process.on('SIGINT', async () => {
      console.log('\n🛑 Cerrando gracefully...');
      await mongoose.connection.close();
      await rabbitMQClient.close();
      process.exit(0);
    });

  } catch (error) {
    console.error('❌ Error iniciando servidor:', error);
    process.exit(1);
  }
}

// Iniciar el servidor
startServer();

export default app;
