import { Response } from 'express';
import { HttpResponse } from '../utils/httpResponse';
import { ServiceResponse } from '../types';

describe('HttpResponse - Principios FIRST', () => {
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Reset mocks (Independent)
    jest.clearAllMocks();

    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnThis();
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };
  });

  describe('success method', () => {
    // Fast: Sin dependencias externas
    it('debería enviar respuesta exitosa con status 200 por defecto', () => {
      const data = { id: 1, name: 'Test' };

      HttpResponse.success(mockResponse as Response, data);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data,
      });
    });

    it('debería enviar respuesta exitosa con mensaje opcional', () => {
      const data = { id: 2, name: 'Test 2' };
      const message = 'Operación exitosa';

      HttpResponse.success(mockResponse as Response, data, message);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message,
        data,
      });
    });

    it('debería enviar respuesta con status code personalizado', () => {
      const data = { id: 3, created: true };

      HttpResponse.success(mockResponse as Response, data, 'Creado', 201);

      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        message: 'Creado',
        data,
      });
    });

    // Repeatable: Mismo resultado siempre
    it('debería manejar diferentes tipos de datos', () => {
      const testCases = [
        { id: 1, name: 'Object' },
        [1, 2, 3],
        'string data',
        123,
        true,
        null,
      ];

      testCases.forEach((data) => {
        mockStatus.mockClear();
        mockJson.mockClear();

        HttpResponse.success(mockResponse as Response, data);

        expect(mockJson).toHaveBeenCalledWith({
          success: true,
          data,
        });
      });
    });

    it('debería manejar status codes exitosos diferentes', () => {
      const successCodes = [200, 201, 202, 204];

      successCodes.forEach((code) => {
        mockStatus.mockClear();
        HttpResponse.success(mockResponse as Response, {}, undefined, code);
        expect(mockStatus).toHaveBeenCalledWith(code);
      });
    });

    it('debería NO incluir mensaje si no se proporciona', () => {
      HttpResponse.success(mockResponse as Response, { test: true });

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { test: true },
      });
      expect(mockJson).not.toHaveBeenCalledWith(
        expect.objectContaining({ message: expect.anything() })
      );
    });

    it('debería manejar objetos complejos como data', () => {
      const complexData = {
        users: [{ id: 1, name: 'User 1' }, { id: 2, name: 'User 2' }],
        pagination: { page: 1, limit: 10, total: 100 },
        metadata: { timestamp: '2025-12-02', version: '1.0' },
      };

      HttpResponse.success(mockResponse as Response, complexData);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: complexData,
      });
    });
  });

  describe('error method', () => {
    // Self-validating: Aserciones claras
    it('debería enviar respuesta de error con status 500 por defecto', () => {
      const message = 'Error en el servidor';

      HttpResponse.error(mockResponse as Response, message);

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });

    it('debería enviar respuesta de error con status personalizado', () => {
      const message = 'Recurso no encontrado';

      HttpResponse.error(mockResponse as Response, message, 404);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message,
      });
    });

    it('debería incluir detalles de error si se proporcionan', () => {
      const message = 'Error de validación';
      const errorDetails = {
        field: 'email',
        reason: 'formato inválido',
      };

      HttpResponse.error(mockResponse as Response, message, 400, errorDetails);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message,
        error: errorDetails,
      });
    });

    it('debería manejar diferentes códigos de error HTTP', () => {
      const errorCodes = [400, 401, 403, 404, 500, 503];

      errorCodes.forEach((code) => {
        mockStatus.mockClear();
        HttpResponse.error(mockResponse as Response, 'Error', code);
        expect(mockStatus).toHaveBeenCalledWith(code);
      });
    });

    it('debería NO incluir error si no se proporciona', () => {
      HttpResponse.error(mockResponse as Response, 'Error message', 400);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Error message',
      });
      expect(mockJson).not.toHaveBeenCalledWith(
        expect.objectContaining({ error: expect.anything() })
      );
    });

    it('debería manejar diferentes tipos de detalles de error', () => {
      const errorTypes = [
        { code: 'ERR_001', details: 'Database error' },
        ['error1', 'error2', 'error3'],
        'Simple error string',
        { stack: 'Error stack trace...' },
      ];

      errorTypes.forEach((errorDetail) => {
        mockJson.mockClear();
        HttpResponse.error(mockResponse as Response, 'Error', 500, errorDetail);
        expect(mockJson).toHaveBeenCalledWith({
          success: false,
          message: 'Error',
          error: errorDetail,
        });
      });
    });
  });

  describe('fromServiceResponse method', () => {
    it('debería llamar a success cuando serviceResponse es exitoso', () => {
      const serviceResponse: ServiceResponse = {
        success: true,
        data: { id: 1, name: 'Test' },
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: { id: 1, name: 'Test' },
      });
    });

    it('debería usar status del servicio si está disponible (success)', () => {
      const serviceResponse: ServiceResponse = {
        success: true,
        data: { created: true },
        status: 201,
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockStatus).toHaveBeenCalledWith(201);
    });

    it('debería llamar a error cuando serviceResponse falla', () => {
      const serviceResponse: ServiceResponse = {
        success: false,
        message: 'Error del servicio',
        status: 404,
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Error del servicio',
      });
    });

    it('debería usar mensaje por defecto si no hay mensaje en error', () => {
      const serviceResponse: ServiceResponse = {
        success: false,
        status: 500,
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Error en el servicio',
      });
    });

    it('debería usar status 500 por defecto si no se proporciona en error', () => {
      const serviceResponse: ServiceResponse = {
        success: false,
        message: 'Error sin status',
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockStatus).toHaveBeenCalledWith(500);
    });

    it('debería incluir detalles de error del servicio', () => {
      const serviceResponse: ServiceResponse = {
        success: false,
        message: 'Error de validación',
        status: 400,
        error: { field: 'email', reason: 'inválido' },
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: false,
        message: 'Error de validación',
        error: { field: 'email', reason: 'inválido' },
      });
    });

    it('debería manejar respuestas exitosas con diferentes status codes', () => {
      const statusCodes = [200, 201, 202];

      statusCodes.forEach((status) => {
        mockStatus.mockClear();
        const serviceResponse: ServiceResponse = {
          success: true,
          data: {},
          status,
        };

        HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);
        expect(mockStatus).toHaveBeenCalledWith(status);
      });
    });

    it('debería manejar respuestas de error con diferentes status codes', () => {
      const statusCodes = [400, 401, 404, 500, 503];

      statusCodes.forEach((status) => {
        mockStatus.mockClear();
        const serviceResponse: ServiceResponse = {
          success: false,
          message: 'Error',
          status,
        };

        HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);
        expect(mockStatus).toHaveBeenCalledWith(status);
      });
    });

    it('debería manejar datos complejos en respuestas exitosas', () => {
      const complexData = {
        users: [{ id: 1 }, { id: 2 }],
        total: 2,
        page: 1,
      };

      const serviceResponse: ServiceResponse = {
        success: true,
        data: complexData,
        status: 200,
      };

      HttpResponse.fromServiceResponse(mockResponse as Response, serviceResponse);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: complexData,
      });
    });
  });

  describe('Edge cases and consistency', () => {
    it('debería manejar respuesta con data undefined', () => {
      HttpResponse.success(mockResponse as Response, undefined);

      expect(mockJson).toHaveBeenCalledWith({
        success: true,
        data: undefined,
      });
    });

    it('debería encadenar status y json correctamente', () => {
      HttpResponse.success(mockResponse as Response, { test: true });

      expect(mockStatus).toHaveBeenCalled();
      expect(mockJson).toHaveBeenCalled();
    });

    it('debería mantener consistencia en estructura de respuestas exitosas', () => {
      HttpResponse.success(mockResponse as Response, { data: 'test' }, 'mensaje');

      const call = mockJson.mock.calls[0][0];
      expect(call).toHaveProperty('success', true);
      expect(call).toHaveProperty('data');
      expect(call).toHaveProperty('message');
    });

    it('debería mantener consistencia en estructura de respuestas de error', () => {
      HttpResponse.error(mockResponse as Response, 'error', 400, { detail: 'info' });

      const call = mockJson.mock.calls[0][0];
      expect(call).toHaveProperty('success', false);
      expect(call).toHaveProperty('message');
      expect(call).toHaveProperty('error');
    });
  });
});
