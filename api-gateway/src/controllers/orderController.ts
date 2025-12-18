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
 * Controlador para actualizar un pedido
 * PUT /orders/:id
 */
export const updateOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = OrderValidator.validateOrderId(req);
    if (!validation.valid) {
      HttpResponse.error(res, validation.message!, 400);
      return;
    }

    const orderId = req.params.id;
    const result = await orderService.updateOrder(orderId, req.body);

    if (result.success) {
      HttpResponse.success(res, result.data, 'Pedido actualizado exitosamente');
    } else {
      HttpResponse.fromServiceResponse(res, result);
    }
  } catch (error) {
    console.error('Error en updateOrder:', error);
    HttpResponse.error(res, 'Error interno del servidor al actualizar el pedido', 500);
  }
};

/**
 * Controlador para cancelar un pedido
 * POST /orders/:id/cancel
 */
export const cancelOrder = async (req: Request, res: Response): Promise<void> => {
  try {
    const validation = OrderValidator.validateOrderId(req);
    if (!validation.valid) {
      HttpResponse.error(res, validation.message!, 400);
      return;
    }

    const orderId = req.params.id;
    const result = await orderService.cancelOrder(orderId);

    if (result.success) {
      HttpResponse.success(res, result.data, 'Pedido cancelado exitosamente');
    } else {
      HttpResponse.fromServiceResponse(res, result);
    }
  } catch (error) {
    console.error('Error en cancelOrder:', error);
    HttpResponse.error(res, 'Error interno del servidor al cancelar el pedido', 500);
  }
};

