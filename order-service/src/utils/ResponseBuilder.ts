import { Response } from 'express';

/**
 * Builder para respuestas HTTP estandarizadas
 * Patrón de Diseño: Builder Pattern + Factory Pattern
 *
 * Objetivo: Centralizar la construcción de respuestas HTTP para garantizar
 * consistencia en toda la aplicación y cumplir con el principio DRY.
 *
 * Principio SOLID: Single Responsibility Principle (SRP)
 * Esta clase solo tiene una responsabilidad: construir respuestas HTTP.
 *
 * Principio SOLID: Open/Closed Principle (OCP)
 * Cerrado a modificación (la interfaz es estable), abierto a extensión
 * (se pueden agregar nuevos métodos factory sin modificar los existentes).
 */
export class ResponseBuilder {
  /**
   * Construye una respuesta de éxito con datos opcionales
   * Factory method para respuestas exitosas (2xx)
   *
   * @param res - Objeto Response de Express
   * @param statusCode - Código HTTP (200, 201, etc.)
   * @param message - Mensaje descriptivo del éxito
   * @param data - Datos opcionales a incluir en la respuesta
   * @returns Response object (para chaining)
   */
  static success(res: Response, statusCode: number, message: string, data?: any): Response {
    const response: any = {
      success: true,
      message
    };

    if (data !== undefined) {
      // Si data es un objeto con propiedades específicas, incluirlas
      if (typeof data === 'object' && data !== null) {
        Object.assign(response, data);
      } else {
        response.data = data;
      }
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Construye una respuesta de error del cliente (4xx)
   * Factory method para errores de validación o solicitud incorrecta
   *
   * @param res - Objeto Response de Express
   * @param statusCode - Código HTTP 4xx (400, 404, etc.)
   * @param error - Mensaje de error
   * @returns Response object (para chaining)
   */
  static clientError(res: Response, statusCode: number, error: string): Response {
    return res.status(statusCode).json({
      success: false,
      error
    });
  }

  /**
   * Construye una respuesta de error del servidor (5xx)
   * Factory method para errores internos del servidor
   *
   * @param res - Objeto Response de Express
   * @param error - Mensaje de error principal
   * @param details - Detalles adicionales del error (opcional)
   * @returns Response object (para chaining)
   */
  static serverError(res: Response, error: string, details?: string): Response {
    const response: any = {
      success: false,
      error
    };

    if (details) {
      response.details = details;
    }

    return res.status(500).json(response);
  }

  /**
   * Construye una respuesta 400 Bad Request
   * Método conveniente para errores de validación
   *
   * @param res - Objeto Response de Express
   * @param error - Mensaje de error
   * @returns Response object (para chaining)
   */
  static badRequest(res: Response, error: string): Response {
    return ResponseBuilder.clientError(res, 400, error);
  }

  /**
   * Construye una respuesta 404 Not Found
   * Método conveniente para recursos no encontrados
   *
   * @param res - Objeto Response de Express
   * @param error - Mensaje de error
   * @returns Response object (para chaining)
   */
  static notFound(res: Response, error: string): Response {
    return ResponseBuilder.clientError(res, 404, error);
  }

  /**
   * Construye una respuesta 201 Created con datos del recurso creado
   * Método conveniente para creación exitosa de recursos
   *
   * @param res - Objeto Response de Express
   * @param message - Mensaje de éxito
   * @param data - Datos del recurso creado
   * @returns Response object (para chaining)
   */
  static created(res: Response, message: string, data: any): Response {
    return ResponseBuilder.success(res, 201, message, data);
  }

  /**
   * Construye una respuesta 200 OK con datos opcionales
   * Método conveniente para respuestas exitosas estándar
   *
   * @param res - Objeto Response de Express
   * @param data - Datos a retornar (puede ser objeto plano o con estructura específica)
   * @returns Response object (para chaining)
   */
  static ok(res: Response, data: any): Response {
    // Si data ya tiene estructura con propiedades específicas, retornarla directamente
    return res.json(data);
  }
}
