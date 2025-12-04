import { Request, Response } from 'express';
import { KitchenService } from '../services/kitchenService';
import { ResponseBuilder } from '../utils/ResponseBuilder';

export class KitchenController {
  constructor(private kitchenService: KitchenService) {}

  /**
   * POST /orders/:orderId/start-preparing
   * Endpoint 5: Cocinero inicia preparación
   */
  startPreparing = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return ResponseBuilder.badRequest(res, 'Order ID is required');
      }

      const order = await this.kitchenService.startPreparing(orderId);

      return ResponseBuilder.success(res, 200, `Order ${orderId} is now being prepared`, {
        orderId: order.orderId,
        status: order.status,
        preparingAt: order.preparingAt,
        estimatedTime: order.estimatedTime,
        items: order.items
      });

    } catch (error: any) {
      console.error('❌ Error in startPreparing:', error);

      if (error.message.includes('not found')) {
        return ResponseBuilder.notFound(res, error.message);
      }

      if (error.message.includes('cannot start preparing')) {
        return ResponseBuilder.badRequest(res, error.message);
      }

      return ResponseBuilder.serverError(res, 'Internal server error', error.message);
    }
  };

  /**
   * POST /orders/:orderId/ready
   * Endpoint 8: Cocinero marca como listo
   */
  markAsReady = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return ResponseBuilder.badRequest(res, 'Order ID is required');
      }

      const order = await this.kitchenService.markAsReady(orderId);

      return ResponseBuilder.success(res, 200, `Order ${orderId} is ready for pickup`, {
        orderId: order.orderId,
        status: order.status,
        readyAt: order.readyAt,
        preparingAt: order.preparingAt,
        receivedAt: order.receivedAt,
        items: order.items
      });

    } catch (error: any) {
      console.error('❌ Error in markAsReady:', error);

      if (error.message.includes('not found')) {
        return ResponseBuilder.notFound(res, error.message);
      }

      if (error.message.includes('cannot be marked as ready')) {
        return ResponseBuilder.badRequest(res, error.message);
      }

      return ResponseBuilder.serverError(res, 'Internal server error', error.message);
    }
  };

  /**
   * GET /orders
   * Obtiene todos los pedidos en cocina (con filtro opcional por status)
   */
  getAllOrders = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { status } = req.query;

      const orders = await this.kitchenService.getAllOrders(status as string);

      return ResponseBuilder.success(res, 200, 'Orders retrieved successfully', {
        count: orders.length,
        data: orders
      });

    } catch (error: any) {
      console.error('❌ Error in getAllOrders:', error);

      return ResponseBuilder.serverError(res, 'Internal server error', error.message);
    }
  };

  /**
   * GET /orders/:orderId
   * Obtiene un pedido específico
   */
  getOrderById = async (req: Request, res: Response): Promise<Response> => {
    try {
      const { orderId } = req.params;

      if (!orderId) {
        return ResponseBuilder.badRequest(res, 'Order ID is required');
      }

      const order = await this.kitchenService.getOrderById(orderId);

      if (!order) {
        return ResponseBuilder.notFound(res, `Order ${orderId} not found`);
      }

      return ResponseBuilder.success(res, 200, 'Order retrieved successfully', order);

    } catch (error: any) {
      console.error('❌ Error in getOrderById:', error);

      return ResponseBuilder.serverError(res, 'Internal server error', error.message);
    }
  };
}
