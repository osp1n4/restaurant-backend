import { BaseHttpClient } from '../services/baseHttpClient';
import axios, { AxiosError } from 'axios';

// Mock de axios
jest.mock('axios');
const mockedAxios = axios as jest.Mocked<typeof axios>;

describe('BaseHttpClient - Principios FIRST', () => {
  let client: BaseHttpClient;
  let mockAxiosInstance: any;

  beforeEach(() => {
    // Reset mocks (Independent)
    jest.clearAllMocks();

    // Mock de la instancia de axios
    mockAxiosInstance = {
      get: jest.fn(),
      post: jest.fn(),
      put: jest.fn(),
      delete: jest.fn(),
    };

    mockedAxios.create.mockReturnValue(mockAxiosInstance as any);

    // Crear cliente con configuración de prueba
    client = new BaseHttpClient('http://localhost:3000', 5000);
  });

  describe('Constructor', () => {
    // Fast: Solo verifica configuración
    it('debería crear una instancia de axios con la configuración correcta', () => {
      expect(mockedAxios.create).toHaveBeenCalledWith({
        baseURL: 'http://localhost:3000',
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    });

    it('debería usar timeout por defecto de 10000ms si no se especifica', () => {
      new BaseHttpClient('http://api.example.com');

      expect(mockedAxios.create).toHaveBeenCalledWith(
        expect.objectContaining({
          timeout: 10000,
        })
      );
    });

    it('debería configurar diferentes baseURLs', () => {
      const urls = [
        'http://localhost:8080',
        'https://api.production.com',
        'http://192.168.1.100:3000',
      ];

      urls.forEach((url) => {
        mockedAxios.create.mockClear();
        new BaseHttpClient(url);
        expect(mockedAxios.create).toHaveBeenCalledWith(
          expect.objectContaining({
            baseURL: url,
          })
        );
      });
    });
  });

  describe('GET method', () => {
    // Repeatable: Mismo resultado siempre
    it('debería realizar una petición GET exitosa', async () => {
      const mockData = { id: 1, name: 'Test' };
      mockAxiosInstance.get.mockResolvedValue({ data: mockData });

      const result = await client.get('/test');

      expect(mockAxiosInstance.get).toHaveBeenCalledWith('/test');
      expect(result).toEqual({
        success: true,
        data: mockData,
      });
    });

    it('debería manejar diferentes endpoints', async () => {
      const endpoints = ['/users', '/orders/123', '/api/data'];

      for (const endpoint of endpoints) {
        mockAxiosInstance.get.mockResolvedValue({ data: {} });
        await client.get(endpoint);
        expect(mockAxiosInstance.get).toHaveBeenCalledWith(endpoint);
        mockAxiosInstance.get.mockClear();
      }
    });

    it('debería manejar respuestas con diferentes tipos de datos', async () => {
      const testCases = [
        { id: 1, name: 'Object' },
        [1, 2, 3],
        'string response',
        123,
        true,
      ];

      for (const testData of testCases) {
        mockAxiosInstance.get.mockResolvedValue({ data: testData });
        const result = await client.get('/test');
        expect(result.data).toEqual(testData);
      }
    });

    // Self-validating: Verificaciones de errores
    it('debería manejar error con respuesta del servidor (4xx, 5xx)', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 404,
          data: { message: 'Not found' },
        } as any,
        message: 'Request failed',
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      const result = await client.get('/not-found');

      expect(result).toEqual({
        success: false,
        status: 404,
        message: 'Not found',
        error: { message: 'Not found' },
      });
    });

    it('debería manejar error sin mensaje en la respuesta', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 500,
          data: {},
        } as any,
        message: 'Internal Server Error',
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      const result = await client.get('/error');

      expect(result).toEqual({
        success: false,
        status: 500,
        message: 'Internal Server Error',
        error: {},
      });
    });

    it('debería manejar error de red (sin respuesta)', async () => {
      const axiosError: Partial<AxiosError> = {
        request: {},
        message: 'Network Error',
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      const result = await client.get('/test');

      expect(result).toEqual({
        success: false,
        status: 503,
        message: 'El servicio no está disponible. Por favor, intente más tarde.',
      });
    });

    it('debería manejar error desconocido', async () => {
      const axiosError: Partial<AxiosError> = {
        message: 'Unknown error',
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);

      const result = await client.get('/test');

      expect(result).toEqual({
        success: false,
        status: 500,
        message: 'Unknown error',
      });
    });
  });

  describe('POST method', () => {
    it('debería realizar una petición POST exitosa con datos', async () => {
      const postData = { name: 'New Item', quantity: 5 };
      const mockResponse = { id: 123, ...postData };
      mockAxiosInstance.post.mockResolvedValue({ data: mockResponse });

      const result = await client.post('/items', postData);

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/items', postData);
      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });

    it('debería realizar POST sin datos (body vacío)', async () => {
      mockAxiosInstance.post.mockResolvedValue({ data: { success: true } });

      const result = await client.post('/action');

      expect(mockAxiosInstance.post).toHaveBeenCalledWith('/action', undefined);
      expect(result.success).toBe(true);
    });

    it('debería manejar diferentes tipos de datos en POST', async () => {
      const testData = [
        { object: 'data' },
        ['array', 'data'],
        'string data',
      ];

      for (const data of testData) {
        mockAxiosInstance.post.mockResolvedValue({ data: { received: data } });
        await client.post('/test', data);
        expect(mockAxiosInstance.post).toHaveBeenCalledWith('/test', data);
        mockAxiosInstance.post.mockClear();
      }
    });

    it('debería manejar error 400 en POST', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 400,
          data: { message: 'Bad Request' },
        } as any,
        message: 'Request failed',
      };

      mockAxiosInstance.post.mockRejectedValue(axiosError);

      const result = await client.post('/test', {});

      expect(result).toEqual({
        success: false,
        status: 400,
        message: 'Bad Request',
        error: { message: 'Bad Request' },
      });
    });
  });

  describe('PUT method', () => {
    it('debería realizar una petición PUT exitosa', async () => {
      const updateData = { name: 'Updated Name' };
      const mockResponse = { id: 1, ...updateData };
      mockAxiosInstance.put.mockResolvedValue({ data: mockResponse });

      const result = await client.put('/items/1', updateData);

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/items/1', updateData);
      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });

    it('debería realizar PUT sin datos', async () => {
      mockAxiosInstance.put.mockResolvedValue({ data: { updated: true } });

      const result = await client.put('/items/1');

      expect(mockAxiosInstance.put).toHaveBeenCalledWith('/items/1', undefined);
      expect(result.success).toBe(true);
    });

    it('debería manejar error 404 en PUT', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 404,
          data: { message: 'Resource not found' },
        } as any,
        message: 'Not found',
      };

      mockAxiosInstance.put.mockRejectedValue(axiosError);

      const result = await client.put('/items/999', {});

      expect(result).toEqual({
        success: false,
        status: 404,
        message: 'Resource not found',
        error: { message: 'Resource not found' },
      });
    });
  });

  describe('DELETE method', () => {
    it('debería realizar una petición DELETE exitosa', async () => {
      const mockResponse = { deleted: true, id: 1 };
      mockAxiosInstance.delete.mockResolvedValue({ data: mockResponse });

      const result = await client.delete('/items/1');

      expect(mockAxiosInstance.delete).toHaveBeenCalledWith('/items/1');
      expect(result).toEqual({
        success: true,
        data: mockResponse,
      });
    });

    it('debería manejar múltiples peticiones DELETE', async () => {
      const ids = [1, 2, 3, 4, 5];

      for (const id of ids) {
        mockAxiosInstance.delete.mockResolvedValue({ data: { deleted: true } });
        await client.delete(`/items/${id}`);
        expect(mockAxiosInstance.delete).toHaveBeenCalledWith(`/items/${id}`);
        mockAxiosInstance.delete.mockClear();
      }
    });

    it('debería manejar error 403 en DELETE', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 403,
          data: { message: 'Forbidden' },
        } as any,
        message: 'Forbidden',
      };

      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      const result = await client.delete('/items/1');

      expect(result).toEqual({
        success: false,
        status: 403,
        message: 'Forbidden',
        error: { message: 'Forbidden' },
      });
    });
  });

  describe('Error handling consistency', () => {
    it('debería manejar errores de manera consistente en todos los métodos', async () => {
      const axiosError: Partial<AxiosError> = {
        response: {
          status: 500,
          data: { message: 'Server Error' },
        } as any,
        message: 'Server Error',
      };

      const expectedError = {
        success: false,
        status: 500,
        message: 'Server Error',
        error: { message: 'Server Error' },
      };

      mockAxiosInstance.get.mockRejectedValue(axiosError);
      mockAxiosInstance.post.mockRejectedValue(axiosError);
      mockAxiosInstance.put.mockRejectedValue(axiosError);
      mockAxiosInstance.delete.mockRejectedValue(axiosError);

      const getResult = await client.get('/test');
      const postResult = await client.post('/test');
      const putResult = await client.put('/test');
      const deleteResult = await client.delete('/test');

      expect(getResult).toEqual(expectedError);
      expect(postResult).toEqual(expectedError);
      expect(putResult).toEqual(expectedError);
      expect(deleteResult).toEqual(expectedError);
    });

    it('debería manejar timeout de manera consistente', async () => {
      const timeoutError: Partial<AxiosError> = {
        request: {},
        message: 'Timeout Error',
      };

      mockAxiosInstance.get.mockRejectedValue(timeoutError);

      const result = await client.get('/slow-endpoint');

      expect(result.status).toBe(503);
      expect(result.success).toBe(false);
    });
  });
});
