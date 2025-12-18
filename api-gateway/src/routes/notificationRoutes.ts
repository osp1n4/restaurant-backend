import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();
// Usar nombre del servicio en Docker, localhost como fallback para desarrollo local
const NOTIFICATION_SERVICE_URL = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3003';

/**
 * Proxy para Server-Sent Events (SSE) del servicio de notificaciones
 * Esta ruta hace de puente entre el frontend y el notification-service
 */
router.get('/stream', async (req: Request, res: Response) => {
  try {
    // Configurar headers SSE para el cliente
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.setHeader('X-Accel-Buffering', 'no'); // Para nginx
    
    console.log('📡 New SSE client connected through API Gateway');

    // Crear conexión hacia el notification-service
    const notificationStream = await axios({
      method: 'GET',
      url: `${NOTIFICATION_SERVICE_URL}/notifications/stream`,
      responseType: 'stream',
      timeout: 0 // Sin timeout para conexiones largas
    });

    // Reenviar datos del notification-service al cliente
    notificationStream.data.on('data', (chunk: Buffer) => {
      res.write(chunk);
    });

    // Manejar cierre de conexión del notification-service
    notificationStream.data.on('end', () => {
      console.log('🔌 Notification service stream ended');
      res.end();
    });

    // Manejar error en la conexión con notification-service
    notificationStream.data.on('error', (error: Error) => {
      console.error('❌ Error in notification service stream:', error.message);
      res.end();
    });

    // Manejar desconexión del cliente
    req.on('close', () => {
      console.log('❌ SSE client disconnected');
      notificationStream.data.destroy();
    });

  } catch (error: any) {
    console.error('❌ Error setting up SSE proxy:', error.message);
    
    if (!res.headersSent) {
      res.status(500).json({
        success: false,
        message: 'Error al conectar con el servicio de notificaciones'
      });
    }
  }
});

export default router;
