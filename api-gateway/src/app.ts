import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import axios from 'axios';
import orderRoutes from './routes/orderRoutes';
import kitchenRoutes from './routes/kitchenRoutes';
import userRoutes from './routes/userRoutes';
import reviewRoutes from './routes/reviewRoutes';
import analyticsRoutes from './routes/analyticsRoutes';
import { config, validateConfig } from './config';

// Validar configuración al iniciar
validateConfig();

const app = express();
const PORT = config.server.port;

// CORS configurado
if (config.cors.enabled) {
  app.use(cors({
    origin: config.cors.origin,
  }));
}

app.use(express.json());

app.use((req: Request, res: Response, next: NextFunction) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

app.use('/orders', orderRoutes);
app.use('/kitchen', kitchenRoutes);
app.use('/users', userRoutes);
app.use('/reviews', reviewRoutes);
app.use('/', analyticsRoutes);

app.get('/health', async (req: Request, res: Response) => {
  const healthStatus = {
    status: 'ok',
    service: 'api-gateway',
    timestamp: new Date().toISOString(),
    environment: config.server.nodeEnv,
    version: '1.0.0',
    services: {
      orderService: {
        url: config.services.orderService.url,
        status: 'unknown',
      },
      kitchenService: {
        url: config.services.kitchenService.url,
        status: 'unknown',
      },
    },
  };

  // Verificar conectividad con servicios backend (opcional, no bloqueante)
  try {
    const [orderHealth, kitchenHealth] = await Promise.allSettled([
      axios.get(`${config.services.orderService.url}/health`, { timeout: 2000 }),
      axios.get(`${config.services.kitchenService.url}/health`, { timeout: 2000 }),
    ]);

    healthStatus.services.orderService.status =
      orderHealth.status === 'fulfilled' ? 'available' : 'unavailable';
    healthStatus.services.kitchenService.status =
      kitchenHealth.status === 'fulfilled' ? 'available' : 'unavailable';
  } catch (error) {
    // Si falla la verificación, no afecta el health check principal
    console.warn('No se pudo verificar estado de servicios backend');
  }

  res.json(healthStatus);
});

app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'API Gateway - Sistema de Pedidos de Restaurante',
    version: '1.0.0',
    endpoints: {
      orders: '/orders',
      kitchen: '/kitchen',
      reviews: '/reviews',
      analytics: '/admin/analytics',
      health: '/health',
      users: '/users',
    },
  });
});

// Middleware para manejar rutas no encontradas (404)
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Ruta ${req.method} ${req.path} no encontrada`,
  });
});

// Middleware de manejo de errores global
app.use((err: Error, req: Request, res: Response, next: NextFunction) => {
  console.error('Error no manejado:', err);
  res.status(500).json({
    success: false,
    message: 'Error interno del servidor',
    ...(process.env.NODE_ENV === 'development' && { error: err.message }),
  });
});

app.listen(PORT, () => {
  console.log(`🚪 API Gateway corriendo en puerto ${PORT}`);
  console.log(`📍 Entorno: ${config.server.nodeEnv}`);
  console.log(`📍 Order Service URL: ${config.services.orderService.url}`);
  console.log(`📍 Kitchen Service URL: ${config.services.kitchenService.url}`);
});
