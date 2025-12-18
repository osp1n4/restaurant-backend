import express, { Request, Response } from 'express';
import cors from 'cors';
import notificationService from './services/notificationService';
import rabbitMQConsumer from './rabbitmq/consumer';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { logger } from './utils/logger';

const app = express();
const PORT = process.env.PORT || 3003;

// Middleware
app.use(cors());
app.use(express.json());

/**
 * Endpoint SSE - Server-Sent Events
 * El frontend se conecta aquí para recibir notificaciones en tiempo real
 */
app.get('/notifications/stream', (req: Request, res: Response) => {
  // Configurar headers para SSE
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Registrar cliente
  notificationService.addClient(res);

  // Cuando el cliente se desconecta
  req.on('close', () => {
    notificationService.removeClient(res);
  });
});

/**
 * Health check endpoint
 */
app.get('/health', (req: Request, res: Response) => {
  res.json({ 
    status: 'ok', 
    service: 'notification-service',
    timestamp: new Date().toISOString()
  });
});

// Middleware de manejo de errores (después de todas las rutas)
app.use(notFoundHandler);
app.use(errorHandler);

/**
 * Inicializar servidor y RabbitMQ
 */
async function startServer() {
  try {
    // Conectar a RabbitMQ
    await rabbitMQConsumer.connect();

    // Iniciar servidor HTTP
    app.listen(PORT, () => {
      logger.info(`Notification Service running on port ${PORT}`);
      logger.info(`SSE endpoint: http://localhost:${PORT}/notifications/stream`);
    });
  } catch (error) {
    logger.error('Error al iniciar el servidor', { error: error instanceof Error ? error.message : error });
    process.exit(1);
  }
}

// Graceful shutdown
process.on('SIGINT', async () => {
  logger.info('Cerrando servidor...');
  await rabbitMQConsumer.close();
  process.exit(0);
});

startServer();