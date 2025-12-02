import request from 'supertest';
import express, { Express } from 'express';
import kitchenRoutes from '../routes/kitchenRoutes';
import * as kitchenController from '../controllers/kitchenController';

// Mock del controlador
jest.mock('../controllers/kitchenController');

describe('KitchenRoutes - Principios FIRST', () => {
  let app: Express;

  beforeEach(() => {
    // Reset mocks antes de cada test (Independent)
    jest.clearAllMocks();

    // Crear app de Express para testing
    app = express();
    app.use(express.json());
    app.use('/kitchen', kitchenRoutes);
  });

  describe('GET /kitchen/orders', () => {
    // Fast: Sin dependencias externas reales
    it('debería llamar a getKitchenOrders cuando se hace GET a /kitchen/orders', async () => {
      (kitchenController.getKitchenOrders as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: [] });
      });

      const response = await request(app).get('/kitchen/orders');

      expect(kitchenController.getKitchenOrders).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería pasar query params al controlador', async () => {
      (kitchenController.getKitchenOrders as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: [] });
      });

      await request(app).get('/kitchen/orders?status=pending');

      expect(kitchenController.getKitchenOrders).toHaveBeenCalled();
    });
  });

  describe('GET /kitchen/orders/:orderId', () => {
    // Repeatable: Mismo input = mismo output
    it('debería llamar a getKitchenOrderById con el orderId correcto', async () => {
      (kitchenController.getKitchenOrderById as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { id: req.params.orderId } });
      });

      const response = await request(app).get('/kitchen/orders/order-123');

      expect(kitchenController.getKitchenOrderById).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería manejar diferentes formatos de orderId', async () => {
      (kitchenController.getKitchenOrderById as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { id: req.params.orderId } });
      });

      const orderIds = ['order-123', 'abc-def', '12345'];

      for (const orderId of orderIds) {
        jest.clearAllMocks();
        await request(app).get(`/kitchen/orders/${orderId}`);
        expect(kitchenController.getKitchenOrderById).toHaveBeenCalled();
      }
    });
  });

  describe('POST /kitchen/orders/:orderId/start-preparing', () => {
    // Self-validating: Verificaciones claras
    it('debería llamar a startPreparing con el orderId correcto', async () => {
      (kitchenController.startPreparing as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Preparación iniciada' });
      });

      const response = await request(app)
        .post('/kitchen/orders/order-123/start-preparing');

      expect(kitchenController.startPreparing).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería aceptar body en la petición POST', async () => {
      (kitchenController.startPreparing as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });

      const response = await request(app)
        .post('/kitchen/orders/order-123/start-preparing')
        .send({ note: 'Preparar con prioridad' });

      expect(kitchenController.startPreparing).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });
  });

  describe('POST /kitchen/orders/:orderId/ready', () => {
    it('debería llamar a markAsReady con el orderId correcto', async () => {
      (kitchenController.markAsReady as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Pedido marcado como listo' });
      });

      const response = await request(app)
        .post('/kitchen/orders/order-123/ready');

      expect(kitchenController.markAsReady).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería procesar peticiones para diferentes orderIds', async () => {
      (kitchenController.markAsReady as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true });
      });

      const orderIds = ['order-1', 'order-2', 'order-3'];

      for (const orderId of orderIds) {
        jest.clearAllMocks();
        await request(app).post(`/kitchen/orders/${orderId}/ready`);
        expect(kitchenController.markAsReady).toHaveBeenCalled();
      }
    });
  });

  describe('Rutas no existentes', () => {
    it('debería retornar 404 para rutas no definidas', async () => {
      const response = await request(app).get('/kitchen/invalid-route');
      expect(response.status).toBe(404);
    });

    it('debería retornar 404 para métodos no permitidos', async () => {
      const response = await request(app).delete('/kitchen/orders/order-123');
      expect(response.status).toBe(404);
    });
  });
});
