import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

/**
 * Clase de error personalizada para errores de aplicación
 */
export class AppError extends Error {
  public statusCode: number;
  public isOperational: boolean;
  public code?: string;

  constructor(message: string, statusCode: number = 500, code?: string) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Middleware centralizado de manejo de errores
 * Captura todos los errores propagados por los controladores y rutas
 */
export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  _next: NextFunction
): void => {
  // Determinar código de estado
  const statusCode = (err as AppError).statusCode || 500;
  const isOperational = (err as AppError).isOperational || false;

  // Log del error con contexto
  const errorContext = {
    message: err.message,
    statusCode,
    isOperational,
    code: (err as AppError).code,
    method: req.method,
    path: req.path,
    ip: req.ip,
    userAgent: req.get('user-agent'),
    timestamp: new Date().toISOString(),
  };

  // Log según severidad
  if (statusCode >= 500) {
    logger.error('Error interno del servidor', { 
      ...errorContext, 
      stack: err.stack 
    });
  } else if (statusCode >= 400) {
    logger.warn('Error del cliente', errorContext);
  } else {
    logger.info('Error manejado', errorContext);
  }

  // Respuesta al cliente
  const errorResponse: any = {
    success: false,
    message: err.message || 'Error interno del servidor',
    timestamp: new Date().toISOString(),
  };

  // En desarrollo, incluir más detalles
  if (process.env.NODE_ENV === 'development') {
    errorResponse.stack = err.stack;
    errorResponse.code = (err as AppError).code;
  }

  // Solo incluir código de error si está definido
  if ((err as AppError).code) {
    errorResponse.code = (err as AppError).code;
  }

  res.status(statusCode).json(errorResponse);
};

/**
 * Middleware para capturar errores asíncronos
 * Envuelve funciones async para manejar excepciones sin try-catch explícito
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void> | void
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * Middleware para manejar rutas no encontradas (404)
 */
export const notFoundHandler = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(
    `Ruta ${req.method} ${req.path} no encontrada`,
    404,
    'ROUTE_NOT_FOUND'
  );
  next(error);
};
