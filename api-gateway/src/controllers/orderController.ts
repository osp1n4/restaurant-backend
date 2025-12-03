import { Request, Response } from 'express';
import { orderService } from '../services/httpClient';
import { OrderValidator } from '../validators/orderValidator';
import { HttpResponse } from '../utils/httpResponse';

/**
 * Controlador para crear un nuevo pedido
 * POST /orders
 */
export const createOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = OrderValidator.validateCreateOrder(req);
    if (!validation.valid) {
      HttpResponse.error(res, validation.message!, 400);
      return;
    }

    const result = await orderService.createOrder(req.body);

    if (result.success) {
      HttpResponse.success(res, result.data, 'Pedido creado exitosamente', 201);
    } else {
      HttpResponse.fromServiceResponse(res, result);
    }
  } catch (error) {
    console.error('Error en createOrder:', error);
    HttpResponse.error(res, 'Error interno del servidor al crear el pedido', 500);
  }
};

/**
 * Controlador para obtener un pedido por ID
 * GET /orders/:id
 */
export const getOrderById = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = OrderValidator.validateOrderId(req);
    if (!validation.valid) {
      HttpResponse.error(res, validation.message!, 400);
      return;
    }

    const orderId = req.params.id;
    const result = await orderService.getOrderById(orderId);

    if (result.success) {
      HttpResponse.success(res, result.data);
    } else {
      if (result.status === 404) {
        HttpResponse.error(res, `Pedido con ID ${orderId} no encontrado`, 404);
      } else {
        HttpResponse.fromServiceResponse(res, result);
      }
    }
  } catch (error) {
    console.error('Error en getOrderById:', error);
    HttpResponse.error(res, 'Error interno del servidor al obtener el pedido', 500);
  }
};

/**
 * Controlador para cancelar un pedido
 * POST /orders/:id/cancel
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason, cancelledBy } = req.body;

    if (!id) {
      HttpResponse.error(res, 'El ID del pedido es requerido', 400);
      return;
    }

    const result = await orderService.cancelOrder(id, reason, cancelledBy || 'customer');

    if (result.success) {
      HttpResponse.success(res, result.data, 'Pedido cancelado exitosamente', 200);
    } else {
      if (result.status === 404) {
        HttpResponse.error(res, `Pedido ${id} no encontrado`, 404);
      } else if (result.status === 400) {
        HttpResponse.error(res, (result.error as any)?.error || 'No se puede cancelar este pedido', 400);
      } else {
        HttpResponse.fromServiceResponse(res, result);
      }
    }
  } catch (error) {
    console.error('Error en cancelOrder:', error);
    HttpResponse.error(res, 'Error interno del servidor al cancelar el pedido', 500);
  }
};

/**
 * Controlador para obtener historial de cancelación
 * GET /orders/:id/cancellation
 */
export const getOrderCancellation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    if (!id) {
      HttpResponse.error(res, 'El ID del pedido es requerido', 400);
      return;
    }

    const result = await orderService.getOrderCancellation(id);

    if (result.success) {
      HttpResponse.success(res, result.data);
    } else {
      if (result.status === 404) {
        HttpResponse.error(res, 'No hay registro de cancelación para este pedido', 404);
      } else {
        HttpResponse.fromServiceResponse(res, result);
      }
    }
  } catch (error) {
    console.error('Error en getOrderCancellation:', error);
    HttpResponse.error(res, 'Error al obtener el historial de cancelación', 500);
  }
};

