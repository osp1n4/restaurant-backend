import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { rabbitMQClient } from './rabbitmq/rabbitmqClient';
import orderRoutes from './routes/orderRoutes';

const app = express();
const PORT = process.env.PORT || 3001;
const RABBITMQ_URL = process.env.RABBITMQ_URL || 'amqp://localhost';

// Middleware
app.use(cors());
app.use(express.json());

// Health check
app.get('/health', (req: Request, res: Response) => {
  res.json({
    status: 'ok',
    service: 'order-service',
    mongodb: mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use('/orders', orderRoutes);

// 404 handler
app.use((req: Request, res: Response) => {
  res.status(404).json({
    error: `Ruta ${req.method} ${req.path} no encontrada`
  });
});

// Error handler
app.use((err: Error, req: Request, res: Response) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    error: 'Error interno del servidor',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  });
});

// Iniciar servidor
async function startServer(): Promise<void> {
  try {
    // 1. Conectar a MongoDB
    console.log('🔄 Conectando a MongoDB...');
    await connectDatabase();
    console.log('✅ MongoDB conectado');

    // 2. Conectar a RabbitMQ
    console.log('🐰 Conectando a RabbitMQ...');
    await rabbitMQClient.connect();
    console.log('✅ RabbitMQ conectado');

    // 3. Consumir eventos order.ready del Kitchen Service
    console.log('👂 Suscribiendo a eventos order.ready...');
    await rabbitMQClient.consume(
      'order-service-queue',
      'order.ready',
      async (orderData: any) => {
        console.log('📥 Evento recibido: order.ready', orderData);
        // Aquí iría la lógica para actualizar el estado del pedido
      }
    );
    console.log('✅ Consumer listo para order.ready');

    // 4. Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`✅ Order Service corriendo en puerto ${PORT}`);
      console.log(`📡 Endpoints disponibles:`);
      console.log(`   POST /orders`);
      console.log(`   GET  /orders`);
      console.log(`   GET  /orders/:id`);
      console.log(`   GET  /orders/:id/status`);
      console.log(`   POST /orders/:id/cancel`);
      console.log(`   GET  /orders/:id/cancellation`);
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

// Iniciar
startServer();

export default app;

