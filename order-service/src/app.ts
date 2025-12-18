import express from 'express';
import cors from 'cors';
import { connectDatabase } from './config/database';
import { rabbitMQClient } from './rabbitmq/rabbitmqClient';
import orderRoutes from './routes/orderRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import adminRoutes from './routes/adminRoutes';
import menuRoutes from './routes/menuRoutes';
import { orderService } from './services/orderService';
import { OrderStatus } from './models/Order';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Rutas
app.use('/orders', orderRoutes);
app.use('/', analyticsRoutes);
app.use('/admin', adminRoutes);
app.use('/', menuRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'order-service',
    timestamp: new Date().toISOString()
  });
});

// Inicializar servicios
async function startServer() {
  try {
    // Conectar a MongoDB
    await connectDatabase();

    // Conectar a RabbitMQ (opcional - no falla si no está disponible)
    try {
      await rabbitMQClient.connect();
      
      // Suscribirse al evento order.preparing del Kitchen Service
      await rabbitMQClient.consumeEvent('order.preparing', async (message) => {
      try {
        const { orderId } = message;

        if (!orderId) {
          console.warn('⚠️ Mensaje order.preparing sin orderId:', message);
          return;
        }

        console.log(`👨‍🍳 Actualizando estado del pedido ${orderId} a PREPARING`);

        const updatedOrder = await orderService.updateOrderStatus(
          orderId,
          OrderStatus.PREPARING
        );

        if (updatedOrder) {
          console.log(`✅ Pedido ${updatedOrder.orderNumber} actualizado a estado PREPARING`);
        } else {
          console.warn(`⚠️ No se encontró el pedido con ID: ${orderId}`);
        }
      } catch (error) {
        console.error('❌ Error procesando evento order.preparing:', error);
        throw error;
      }
    });

    // Suscribirse al evento order.ready del Kitchen Service
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
      
      console.log(`📥 RabbitMQ conectado - Consumiendo eventos: order.preparing, order.ready`);
    } catch (rabbitmqError) {
      console.warn(`⚠️ RabbitMQ no disponible - El servicio funcionará sin mensajería:`, rabbitmqError instanceof Error ? rabbitmqError.message : rabbitmqError);
    }

    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`📋 Order Service corriendo en puerto ${PORT}`);
      console.log(`🌐 Health check: http://localhost:${PORT}/health`);
      console.log(`📦 Endpoints disponibles:`);
      console.log(`   POST   /orders - Crear pedido`);
      console.log(`   GET    /orders - Listar pedidos`);
      console.log(`   GET    /orders/:id - Obtener pedido`);
      console.log(`   GET    /orders/:id/status - Consultar estado`);
    });
  } catch (error) {
    console.error('❌ Error iniciando el servidor:', error);
    process.exit(1);
  }
}

// Manejar cierre graceful
process.on('SIGTERM', async () => {
  console.log('🛑 SIGTERM recibido, cerrando servidor...');
  await rabbitMQClient.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('🛑 SIGINT recibido, cerrando servidor...');
  await rabbitMQClient.close();
  process.exit(0);
});

// Middleware de manejo de rutas no encontradas (debe ir después de todas las rutas)
app.use(notFoundHandler);

// Middleware de manejo de errores (debe ir al final)
app.use(errorHandler);

// Iniciar el servidor
startServer();

