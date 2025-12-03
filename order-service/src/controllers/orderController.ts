import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { OrderItem } from '../models/Order';

export class OrderController {
  /**
   * POST /orders - Crear un nuevo pedido
   */
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { customerName, customerEmail, items } = req.body;
      if (customerEmail && typeof customerEmail !== 'string') {
        res.status(400).json({
          error: 'El email del cliente debe ser una cadena de texto válida'
        });
        return;
      }


      // Validaciones
      if (!customerName || typeof customerName !== 'string' || customerName.trim() === '') {
        res.status(400).json({ 
          error: 'El nombre del cliente es requerido' 
        });
        return;
      }

      if (!items || !Array.isArray(items) || items.length === 0) {
        res.status(400).json({ 
          error: 'El pedido debe tener al menos un item' 
        });
        return;
      }

      // Validar items
      for (const item of items) {
        if (!item.name || !item.quantity || !item.price) {
          res.status(400).json({ 
            error: 'Cada item debe tener name, quantity y price' 
          });
          return;
        }
        if (item.quantity < 1 || item.price < 0) {
          res.status(400).json({ 
            error: 'Quantity debe ser mayor a 0 y price debe ser mayor o igual a 0' 
          });
          return;
        }
      }

      const order = await orderService.createOrder(
        customerName.trim(),
        items as OrderItem[],
        typeof customerEmail === 'string' ? customerEmail.trim() : undefined
      );

      res.status(201).json({
        message: 'Pedido creado exitosamente',
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
      res.status(500).json({ 
        error: 'Error al crear el pedido',
        details: error.message 
      });
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
        res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
        return;
      }

      res.json({
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
      res.status(500).json({ 
        error: 'Error al obtener el pedido',
        details: error.message 
      });
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
        res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
        return;
      }

      res.json({
        orderNumber: orderStatus.orderNumber,
        status: orderStatus.status
      });
    } catch (error: any) {
      console.error('Error en getOrderStatus:', error);
      res.status(500).json({ 
        error: 'Error al consultar el estado del pedido',
        details: error.message 
      });
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

      res.json({
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
      res.status(500).json({ 
        error: 'Error al obtener los pedidos',
        details: error.message 
      });
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
        res.status(400).json({ 
          error: 'El ID del pedido es requerido' 
        });
        return;
      }

      const cancelledByValue = cancelledBy || 'customer';
      if (!['customer', 'admin'].includes(cancelledByValue)) {
        res.status(400).json({ 
          error: 'cancelledBy debe ser "customer" o "admin"' 
        });
        return;
      }

      // Cancelar el pedido
      const order = await orderService.cancelOrder(
        id,
        reason,
        cancelledByValue
      );

      res.status(200).json({
        message: 'Pedido cancelado exitosamente',
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
        res.status(400).json({ 
          error: error.message
        });
        return;
      }

      // Validar si el pedido no existe
      if (error.message.includes('no encontrado')) {
        res.status(404).json({ 
          error: error.message
        });
        return;
      }

      res.status(500).json({ 
        error: 'Error al cancelar el pedido',
        details: error.message 
      });
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
        res.status(404).json({ 
          error: 'No hay registro de cancelación para este pedido' 
        });
        return;
      }

      res.json({
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
      res.status(500).json({ 
        error: 'Error al obtener historial de cancelación',
        details: error.message 
      });
    }
  }
}

export const orderController = new OrderController();

