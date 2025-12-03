import express, { Request, Response } from 'express';
import cors from 'cors';
import mongoose from 'mongoose';
import { connectDatabase } from './config/database';
import { rabbitMQClient } from './rabbitmq/rabbitmqClient';
import orderRoutes from './routes/orderRoutes';
import reviewRoutes from './routes/reviewRoutes';
import { orderService } from './services/orderService';
import { OrderStatus } from './models/Order';

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

// Rutas
app.use('/orders', orderRoutes);
app.use('/reviews', reviewRoutes);

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

    // 3. Suscribirse al evento order.ready del Kitchen Service
    console.log('👂 Suscribiendo a eventos order.ready...');
    await rabbitMQClient.consumeEvent('order.ready', async (message) => {
      try {
        const { orderId } = message;

        if (!orderId) {
          console.warn('⚠️ Mensaje order.ready sin orderId:', message);
          return;
        }

        console.log(`🔄 Actualizando estado del pedido ${orderId} a READY`);

        // Actualizar el estado del pedido a READY
        const updatedOrder = await orderService.updateOrderStatus(
          orderId,
          OrderStatus.READY
        );

        if (updatedOrder) {
          console.log(`✅ Pedido ${updatedOrder.orderNumber} actualizado a estado READY`);
        } else {
          console.warn(`⚠️ No se encontró el pedido con ID: ${orderId}`);
        }
      } catch (error) {
        console.error('❌ Error procesando evento order.ready:', error);
        throw error; // Re-lanzar para que el mensaje se rechace
      }
    });
    console.log('✅ Consumer listo para order.ready');

    // 4. Iniciar servidor HTTP
    app.listen(PORT, () => {
      console.log(`📋 Order Service corriendo en puerto ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Endpoints disponibles:`);
      console.log(`   POST   /orders - Crear pedido`);
      console.log(`   GET    /orders - Listar pedidos`);
      console.log(`   GET    /orders/:id - Obtener pedido`);
      console.log(`   GET    /orders/:id/status - Consultar estado`);
      console.log(`   POST   /orders/:id/cancel - Cancelar pedido`);
      console.log(`   GET    /orders/:id/cancellation - Ver cancelación`);
      console.log(`   POST   /reviews - Crear reseña`);
      console.log(`   GET    /reviews - Listar reseñas aprobadas`);
      console.log(`   GET    /reviews/:id - Obtener reseña`);
      console.log(`   PATCH  /reviews/:id/status - Cambiar estado (admin)`);
      console.log(`📥 Consumiendo eventos: order.ready`);
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

