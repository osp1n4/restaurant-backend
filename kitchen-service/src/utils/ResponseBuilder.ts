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
      response.data = data;
    }

    return res.status(statusCode).json(response);
  }

  /**
   * Construye una respuesta de error del cliente (4xx)
   * Factory method para errores de validación o solicitud incorrecta
   *
   * @param res - Objeto Response de Express
   * @param statusCode - Código HTTP 4xx (400, 404, etc.)
   * @param message - Mensaje de error
   * @returns Response object (para chaining)
   */
  static clientError(res: Response, statusCode: number, message: string): Response {
    return res.status(statusCode).json({
      success: false,
      message
    });
  }

  /**
   * Construye una respuesta de error del servidor (5xx)
   * Factory method para errores internos del servidor
   *
   * @param res - Objeto Response de Express
   * @param message - Mensaje de error principal
   * @param error - Detalles adicionales del error (opcional)
   * @returns Response object (para chaining)
   */
  static serverError(res: Response, message: string, error?: string): Response {
    const response: any = {
      success: false,
      message
    };

    if (error) {
      response.error = error;
    }

    return res.status(500).json(response);
  }

  /**
   * Construye una respuesta 400 Bad Request
   * Método conveniente para errores de validación
   *
   * @param res - Objeto Response de Express
   * @param message - Mensaje de error
   * @returns Response object (para chaining)
   */
  static badRequest(res: Response, message: string): Response {
    return ResponseBuilder.clientError(res, 400, message);
  }

  /**
   * Construye una respuesta 404 Not Found
   * Método conveniente para recursos no encontrados
   *
   * @param res - Objeto Response de Express
   * @param message - Mensaje de error
   * @returns Response object (para chaining)
   */
  static notFound(res: Response, message: string): Response {
    return ResponseBuilder.clientError(res, 404, message);
  }
}
