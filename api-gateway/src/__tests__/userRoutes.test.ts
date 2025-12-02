import request from 'supertest';
import express, { Express } from 'express';
import userRoutes from '../routes/userRoutes';
import userController from '../controllers/userController';

// Mock del controlador
jest.mock('../controllers/userController');

describe('UserRoutes - Principios FIRST', () => {
  let app: Express;

  beforeEach(() => {
    // Reset mocks (Independent)
    jest.clearAllMocks();

    // Crear app de Express
    app = express();
    app.use(express.json());
    app.use('/users', userRoutes);
  });

  describe('GET /users', () => {
    // Fast: Sin I/O real
    it('debería llamar a listUsers cuando se hace GET a /users', async () => {
      (userController.listUsers as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, data: [] });
      });

      const response = await request(app).get('/users');

      expect(userController.listUsers).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería pasar query params de filtros al controlador', async () => {
      let capturedQuery: any;
      (userController.listUsers as jest.Mock).mockImplementation((req, res) => {
        capturedQuery = req.query;
        res.status(200).json({ success: true, data: [] });
      });

      await request(app).get('/users?name=Juan&email=juan@example.com&role=admin');

      expect(capturedQuery.name).toBe('Juan');
      expect(capturedQuery.email).toBe('juan@example.com');
      expect(capturedQuery.role).toBe('admin');
    });

    it('debería pasar parámetros de paginación', async () => {
      let capturedQuery: any;
      (userController.listUsers as jest.Mock).mockImplementation((req, res) => {
        capturedQuery = req.query;
        res.status(200).json({ success: true, data: [] });
      });

      await request(app).get('/users?page=2&limit=10');

      expect(capturedQuery.page).toBe('2');
      expect(capturedQuery.limit).toBe('10');
    });
  });

  describe('POST /users', () => {
    // Repeatable: Mismo resultado siempre
    it('debería llamar a createUser cuando se hace POST a /users', async () => {
      (userController.createUser as jest.Mock).mockImplementation((req, res) => {
        res.status(201).json({ success: true, uid: 'user-123' });
      });

      const userData = {
        name: 'Juan Pérez',
        email: 'juan@example.com',
        password: 'Password123!',
        role: 'empleado',
      };

      const response = await request(app)
        .post('/users')
        .send(userData);

      expect(userController.createUser).toHaveBeenCalled();
      expect(response.status).toBe(201);
    });

    it('debería pasar el body correctamente al controlador', async () => {
      let capturedBody: any;
      (userController.createUser as jest.Mock).mockImplementation((req, res) => {
        capturedBody = req.body;
        res.status(201).json({ success: true });
      });

      const userData = {
        name: 'María García',
        email: 'maria@example.com',
        password: 'SecurePass456!',
        role: 'admin',
      };

      await request(app).post('/users').send(userData);

      expect(capturedBody).toEqual(userData);
    });
  });

  describe('PUT /users/:uid', () => {
    // Self-validating: Verificaciones claras
    it('debería llamar a editUser con el uid correcto', async () => {
      (userController.editUser as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Usuario actualizado' });
      });

      const response = await request(app)
        .put('/users/user-123')
        .send({ name: 'Nuevo Nombre' });

      expect(userController.editUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería pasar el uid como parámetro de ruta', async () => {
      let capturedUid: string = '';
      (userController.editUser as jest.Mock).mockImplementation((req, res) => {
        capturedUid = req.params.uid;
        res.status(200).json({ success: true });
      });

      await request(app).put('/users/test-uid-456').send({ name: 'Test' });

      expect(capturedUid).toBe('test-uid-456');
    });

    it('debería pasar datos de actualización en el body', async () => {
      let capturedBody: any;
      (userController.editUser as jest.Mock).mockImplementation((req, res) => {
        capturedBody = req.body;
        res.status(200).json({ success: true });
      });

      const updateData = { name: 'Nombre Actualizado', role: 'admin' };
      await request(app).put('/users/user-123').send(updateData);

      expect(capturedBody).toEqual(updateData);
    });
  });

  describe('PATCH /users/:uid/disable', () => {
    it('debería llamar a disableUser con el uid correcto', async () => {
      (userController.disableUser as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Usuario desactivado' });
      });

      const response = await request(app).patch('/users/user-123/disable');

      expect(userController.disableUser).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería pasar el uid correctamente', async () => {
      let capturedUid: string = '';
      (userController.disableUser as jest.Mock).mockImplementation((req, res) => {
        capturedUid = req.params.uid;
        res.status(200).json({ success: true });
      });

      await request(app).patch('/users/disable-test-123/disable');

      expect(capturedUid).toBe('disable-test-123');
    });
  });

  describe('POST /users/:uid/reset-password', () => {
    it('debería llamar a resetPassword con el uid correcto', async () => {
      (userController.resetPassword as jest.Mock).mockImplementation((req, res) => {
        res.status(200).json({ success: true, message: 'Contraseña restablecida' });
      });

      const response = await request(app)
        .post('/users/user-123/reset-password')
        .send({ newPassword: 'NewPassword123!' });

      expect(userController.resetPassword).toHaveBeenCalled();
      expect(response.status).toBe(200);
    });

    it('debería pasar el uid y la nueva contraseña', async () => {
      let capturedUid: string = '';
      let capturedBody: any;
      (userController.resetPassword as jest.Mock).mockImplementation((req, res) => {
        capturedUid = req.params.uid;
        capturedBody = req.body;
        res.status(200).json({ success: true });
      });

      const passwordData = { newPassword: 'SuperSecure789!' };
      await request(app)
        .post('/users/reset-uid-456/reset-password')
        .send(passwordData);

      expect(capturedUid).toBe('reset-uid-456');
      expect(capturedBody).toEqual(passwordData);
    });
  });

  describe('Rutas no existentes', () => {
    it('debería retornar 404 para rutas no definidas', async () => {
      const response = await request(app).get('/users/invalid-route');
      expect(response.status).toBe(404);
    });

    it('debería retornar 404 para métodos no permitidos', async () => {
      const response = await request(app).delete('/users/user-123');
      expect(response.status).toBe(404);
    });
  });
});
