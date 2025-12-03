import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { OrderItem } from '../models/Order';
import { ResponseBuilder } from '../utils/ResponseBuilder';

export class OrderController {
  /**
   * POST /orders - Crear un nuevo pedido
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { customerName, customerEmail, items } = req.body;
      if (customerEmail && typeof customerEmail !== 'string') {
        return ResponseBuilder.badRequest(res, 'El email del cliente debe ser una cadena de texto válida');
      }


      // Validaciones
      if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
        return ResponseBuilder.badRequest(res, 'El nombre del cliente es requerido');
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        return ResponseBuilder.badRequest(res, 'El pedido debe tener al menos un item');
      }

      // Validar items
      for (const item of items) {
        if (!item.name || !item.quantity || !item.price) {
          return ResponseBuilder.badRequest(res, 'Cada item debe tener name, quantity y price');
        }
        if (item.quantity < 1 || item.price < 0) {
          return ResponseBuilder.badRequest(res, 'Quantity debe ser mayor a 0 y price debe ser mayor o igual a 0');
        }
      }

      const order = await orderService.createOrder(
        customerName.trim(),
        items as OrderItem[],
        typeof customerEmail === 'string' ? customerEmail.trim() : undefined
      );

      return ResponseBuilder.created(res, 'Pedido creado exitosamente', {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt
        }
      });
    } catch (error: any) {
      console.error('Error en createOrder:', error);
      return ResponseBuilder.serverError(res, 'Error al crear el pedido', error.message);
    }
  }

  /**
   * GET /orders/:id - Obtener un pedido por ID
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const order = await orderService.getOrderById(id);

      if (!order) {
        return ResponseBuilder.notFound(res, 'Pedido no encontrado');
      }

      return ResponseBuilder.ok(res, {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Error en getOrderById:', error);
      return ResponseBuilder.serverError(res, 'Error al obtener el pedido', error.message);
    }
  }

  /**
   * GET /orders/:id/status - Consultar estado de un pedido
   */
  async getOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const orderStatus = await orderService.getOrderStatus(id);

      if (!orderStatus) {
        return ResponseBuilder.notFound(res, 'Pedido no encontrado');
      }

      return ResponseBuilder.ok(res, {
        orderNumber: orderStatus.orderNumber,
        status: orderStatus.status
      });
    } catch (error: any) {
      console.error('Error en getOrderStatus:', error);
      return ResponseBuilder.serverError(res, 'Error al consultar el estado del pedido', error.message);
    }
  }

  /**
   * GET /orders - Obtener todos los pedidos
   */
  async getAllOrders(req: Request, res: Response): Promise<void> {
    try {
      const limit = parseInt(req.query.limit as string) || 50;
      const skip = parseInt(req.query.skip as string) || 0;

      const orders = await orderService.getAllOrders(limit, skip);

      return ResponseBuilder.ok(res, {
        count: orders.length,
        orders: orders.map(order => ({
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          items: order.items,
          total: order.total,
          status: order.status,
          createdAt: order.createdAt,
          updatedAt: order.updatedAt
        }))
      });
    } catch (error: any) {
      console.error('Error en getAllOrders:', error);
      return ResponseBuilder.serverError(res, 'Error al obtener los pedidos', error.message);
    }
  }

  /**
   * POST /orders/:id/cancel - Cancelar un pedido
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { reason, cancelledBy } = req.body;

      // Validaciones
      if (!id) {
        return ResponseBuilder.badRequest(res, 'El ID del pedido es requerido');
      }

      const cancelledByValue = cancelledBy || 'customer';
      if (!['customer', 'admin'].includes(cancelledByValue)) {
        return ResponseBuilder.badRequest(res, 'cancelledBy debe ser "customer" o "admin"');
      }

      // Cancelar el pedido
      const order = await orderService.cancelOrder(
        id,
        reason,
        cancelledByValue
      );

      return ResponseBuilder.success(res, 200, 'Pedido cancelado exitosamente', {
        order: {
          id: order._id,
          orderNumber: order.orderNumber,
          customerName: order.customerName,
          status: order.status,
          previousStatus: order.status,
          cancelledAt: order.updatedAt,
          items: order.items,
          total: order.total
        }
      });
    } catch (error: any) {
      console.error('❌ Error en cancelOrder:', error);

      // Validar si es error por estado inválido
      if (error.message.includes('No se puede cancelar')) {
        return ResponseBuilder.badRequest(res, error.message);
      }

      // Validar si el pedido no existe
      if (error.message.includes('no encontrado')) {
        return ResponseBuilder.notFound(res, error.message);
      }

      return ResponseBuilder.serverError(res, 'Error al cancelar el pedido', error.message);
    }
  }

  /**
   * GET /orders/:id/cancellation - Obtener historial de cancelación
   */
  async getOrderCancellation(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cancellation = await orderService.getOrderCancellationHistory(id);

      if (!cancellation) {
        return ResponseBuilder.notFound(res, 'No hay registro de cancelación para este pedido');
      }

      return ResponseBuilder.ok(res, {
        cancellation: {
          orderId: cancellation.orderId,
          orderNumber: cancellation.orderNumber,
          reason: cancellation.reason,
          previousStatus: cancellation.previousStatus,
          cancelledAt: cancellation.cancelledAt,
          cancelledBy: cancellation.cancelledBy
        }
      });
    } catch (error: any) {
      console.error('❌ Error en getOrderCancellation:', error);
      return ResponseBuilder.serverError(res, 'Error al obtener historial de cancelación', error.message);
    }
  }
}

export const orderController = new OrderController();
