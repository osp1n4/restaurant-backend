import { Request, Response } from 'express';
import { orderService } from '../services/orderService';
import { OrderItem } from '../models/Order';

export class OrderController {
  /**
   * POST /orders - Crear un nuevo pedido
   */
  // eslint-disable-next-line complexity
  async createOrder(req: Request, res: Response): Promise<void> {
    try {
      const { customerName, customerEmail, items, notes } = req.body;
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
        typeof customerEmail === 'string' ? customerEmail.trim() : undefined,
        typeof notes === 'string' ? notes.trim() : undefined
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
   * GET /orders/:id - Obtener un pedido por ID o por orderNumber
   */
  async getOrderById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      let order = null;
      // Intentar buscar por orderNumber si empieza con ORD-, sino validar ObjectId
      if (id.startsWith('ORD-')) {
        order = await orderService.getOrderByNumber(id);
      } else if (/^[a-fA-F0-9]{24}$/.test(id)) {
        order = await orderService.getOrderById(id);
      } else {
        order = await orderService.getOrderByNumber(id);
      }

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
   * GET /orders/:id/status - Consultar estado de un pedido por ID o orderNumber
   */
  async getOrderStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      // Intentar buscar por orderNumber si empieza con ORD-, sino por _id
      let order = null;
      if (id.startsWith('ORD-')) {
        order = await orderService.getOrderByNumber(id);
      } else if (/^[a-fA-F0-9]{24}$/.test(id)) {
        order = await orderService.getOrderById(id);
      } else {
        order = await orderService.getOrderByNumber(id);
      }

      if (!order) {
        res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
        return;
      }
      res.json({
        orderNumber: order.orderNumber,
        status: order.status
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
   * PUT /orders/:id - Actualizar un pedido (items, notas)
   * Solo se puede actualizar si el pedido está en estado PENDING
   */
  async updateOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { items, notes, customerEmail } = req.body;

      // Validar que se está actualizando algo
      if (!items && !notes && !customerEmail) {
        res.status(400).json({ 
          error: 'Debe proporcionar al menos un campo para actualizar (items, notes, customerEmail)' 
        });
        return;
      }

      // Validar items si se proporcionan
      if (items) {
        if (!Array.isArray(items) || items.length === 0) {
          res.status(400).json({ 
            error: 'Items debe ser un array con al menos un elemento' 
          });
          return;
        }

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
      }

      const updateData: any = {};
      if (items) updateData.items = items;
      if (notes !== undefined) updateData.notes = typeof notes === 'string' ? notes.trim() : notes;
      if (customerEmail) updateData.customerEmail = customerEmail.trim();

      const updatedOrder = await orderService.updateOrder(id, updateData);

      if (!updatedOrder) {
        res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Pedido actualizado exitosamente',
        order: {
          id: updatedOrder._id,
          orderNumber: updatedOrder.orderNumber,
          customerName: updatedOrder.customerName,
          customerEmail: updatedOrder.customerEmail,
          items: updatedOrder.items,
          notes: updatedOrder.notes,
          total: updatedOrder.total,
          status: updatedOrder.status,
          createdAt: updatedOrder.createdAt,
          updatedAt: updatedOrder.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Error en updateOrder:', error);
      
      // Error específico si el pedido no se puede modificar
      if (error.message.includes('no se puede modificar')) {
        res.status(400).json({ 
          error: error.message 
        });
        return;
      }

      res.status(500).json({ 
        error: 'Error al actualizar el pedido',
        details: error.message 
      });
    }
  }

  /**
   * POST /orders/:id/cancel - Cancelar un pedido
   * Solo se puede cancelar si el pedido está en estado PENDING
   */
  async cancelOrder(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const cancelledOrder = await orderService.cancelOrder(id);

      if (!cancelledOrder) {
        res.status(404).json({ 
          error: 'Pedido no encontrado' 
        });
        return;
      }

      res.json({
        success: true,
        message: 'Pedido cancelado exitosamente',
        data: {
          id: cancelledOrder._id,
          orderNumber: cancelledOrder.orderNumber,
          customerName: cancelledOrder.customerName,
          status: cancelledOrder.status,
          updatedAt: cancelledOrder.updatedAt
        }
      });
    } catch (error: any) {
      console.error('Error en cancelOrder:', error);
      
      // Error específico si el pedido no se puede cancelar
      if (error.message.includes('no se puede cancelar')) {
        res.status(400).json({ 
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
}

export const orderController = new OrderController();

