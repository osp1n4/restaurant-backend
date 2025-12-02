import request from 'supertest';
import express, { Express } from 'express';
import orderRoutes from '../routes/orderRoutes';
import * as orderController from '../controllers/orderController';

// Mock del controlador
jest.mock('../controllers/orderController');

describe('OrderRoutes - Principios FIRST', () => {
  let app: Express;

  beforeEach(() => {
    // Reset mocks (Independent)
    jest.clearAllMocks();

    // Crear app de Express
    app = express();
    app.use(express.json());
    app.use('/orders', orderRoutes);
  });

  describe('POST /orders', () => {
    // Fast: Todo mockeado
    it('debería llamar a createOrder cuando se hace POST a /orders', async () => {
      (orderController.createOrder as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json({ success: true, data: { id: 'order-123' } });
      });

      const orderData = {
        orderItems: [{ dishName: 'Pizza', quantity: 1, unitPrice: 15.99 }],
        customerName: 'Juan Pérez',
        customerEmail: 'juan@example.com',
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData);

      expect(orderController.createOrder).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('debería pasar el body correctamente al controlador', async () => {
      let capturedBody: any;
      (orderController.createOrder as jest.Mock).mockImplementation((req, res) => {
        capturedBody = req.body;
        res.status(201).json({ success: true });
      });

      const orderData = {
        orderItems: [{ dishName: 'Pasta', quantity: 2, unitPrice: 12.50 }],
        customerName: 'María García',
        customerEmail: 'maria@example.com',
      };

      await request(app)
        .post('/orders')
        .send(orderData);

      expect(capturedBody).toEqual(orderData);
    });

    // Repeatable: Siempre el mismo resultado
    it('debería aceptar órdenes con múltiples items', async () => {
      (orderController.createOrder as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json({ success: true });
      });

      const orderData = {
        orderItems: [
          { dishName: 'Pizza', quantity: 1, unitPrice: 15.99 },
          { dishName: 'Bebida', quantity: 2, unitPrice: 2.50 },
        ],
        customerName: 'Carlos López',
        customerEmail: 'carlos@example.com',
      };

      const response = await request(app)
        .post('/orders')
        .send(orderData);

      expect(response.status).toBe(201);
    });
  });

  describe('GET /orders/:id', () => {
    // Self-validating: Aserciones claras
    it('debería llamar a getOrderById con el id correcto', async () => {
      (orderController.getOrderById as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { id: req.params.id } });
      });

      const response = await request(app).get('/orders/order-123');

      expect(orderController.getOrderById).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería manejar diferentes formatos de ID', async () => {
      (orderController.getOrderById as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: { id: req.params.id } });
      });

      const ids = ['order-123', 'abc123', '12345', 'ORDER_SPECIAL'];

      for (const id of ids) {
        jest.clearAllMocks();
        await request(app).get(`/orders/${id}`);
        expect(orderController.getOrderById).toHaveBeenCalled();
      }
    });

    it('debería pasar parámetros de ruta correctamente', async () => {
      let capturedId: string = '';
      (orderController.getOrderById as jest.Mock).mockImplementation((req, res) => {
        capturedId = req.params.id;
        res.status(200).json({ success: true });
      });

      const orderId = 'test-order-456';
      await request(app).get(`/orders/${orderId}`);

      expect(capturedId).toBe(orderId);
    });
  });

  describe('Rutas no existentes', () => {
    it('debería retornar 404 para métodos no permitidos en raíz', async () => {
      const response = await request(app).put('/orders');
      expect(response.status).toBe(404);
    });

    it('debería retornar 404 para métodos no permitidos en /:id', async () => {
      const response = await request(app).delete('/orders/order-123');
      expect(response.status).toBe(404);
    });

    it('debería retornar 404 para rutas no definidas', async () => {
      const response = await request(app).get('/orders/order-123/invalid');
      expect(response.status).toBe(404);
    });
  });
});
