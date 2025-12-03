import { Request, Response } from 'express';
import { ReviewService } from '../services/ReviewService';
import { reviewRepository } from '../repositories/ReviewRepository';

/**
 * Controller para endpoints de reseñas
 * Principio SOLID: Single Responsibility - Solo maneja HTTP requests/responses
 * Principio SOLID: Dependency Inversion - Depende de ReviewService (abstracción)
 *
 * Patrón de Diseño: MVC (Model-View-Controller)
 * Objetivo: Capa delgada que traduce HTTP a lógica de negocio
 */
export class ReviewController {
  /**
   * Constructor con Dependency Injection
   * @param reviewService - Servicio con lógica de negocio
   */
  constructor(private readonly reviewService: ReviewService) {}

  /**
   * POST /reviews - Crear una nueva reseña
   *
   * Body esperado:
   * {
   *   orderId: string,
   *   customerName: string,
   *   customerEmail: string,
   *   ratings: { overall: number, food: number },
   *   comment?: string
   * }
   *
   * Respuestas:
   * - 201: Reseña creada exitosamente
   * - 400: Validación fallida
   * - 409: El pedido ya tiene una reseña
   * - 500: Error del servidor
   */
  async createReview(req: Request, res: Response): Promise<void> {
    try {
      const { orderId, customerName, customerEmail, ratings, comment } = req.body;

      // Validación básica de estructura
      if (!orderId || !customerName || !customerEmail || !ratings) {
        res.status(400).json({
          success: false,
          message: 'Missing required fields: orderId, customerName, customerEmail, ratings'
        });
        return;
      }

      // Crear reseña (las validaciones detalladas están en el Service)
      const review = await this.reviewService.createReview({
        orderId,
        customerName,
        customerEmail,
        ratings,
        comment: comment || ''
      });

      res.status(201).json({
        success: true,
        message: 'Review created successfully',
        data: review
      });
    } catch (error: any) {
      // Manejo de errores específicos
      if (error.message.includes('already has a review')) {
        res.status(409).json({
          success: false,
          message: error.message
        });
        return;
      }

      if (error.message.includes('required') ||
          error.message.includes('must be') ||
          error.message.includes('exceed')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      console.error('Error creating review:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while creating review'
      });
    }
  }

  /**
   * GET /reviews - Obtener reseñas aprobadas (público)
   *
   * Query params:
   * - page?: number (default: 1)
   * - limit?: number (default: 10, max: 50)
   *
   * Respuestas:
   * - 200: Lista de reseñas aprobadas con paginación
   * - 500: Error del servidor
   */
  async getPublicReviews(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.reviewService.getPublicReviews(page, limit);

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching public reviews:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching reviews'
      });
    }
  }

  /**
   * GET /reviews/:id - Obtener una reseña específica
   *
   * Respuestas:
   * - 200: Reseña encontrada
   * - 404: Reseña no encontrada
   * - 500: Error del servidor
   */
  async getReviewById(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;

      const review = await this.reviewService.getReviewById(id);

      res.status(200).json({
        success: true,
        data: review
      });
    } catch (error: any) {
      if (error.message === 'Review not found') {
        res.status(404).json({
          success: false,
          message: 'Review not found'
        });
        return;
      }

      console.error('Error fetching review by ID:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching review'
      });
    }
  }

  /**
   * GET /admin/reviews - Obtener todas las reseñas (admin)
   *
   * Query params:
   * - page?: number (default: 1)
   * - limit?: number (default: 10, max: 50)
   *
   * Respuestas:
   * - 200: Lista de todas las reseñas con paginación
   * - 500: Error del servidor
   */
  async getAllReviews(req: Request, res: Response): Promise<void> {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 10;

      const result = await this.reviewService.getAllReviews(page, limit);

      res.status(200).json({
        success: true,
        data: result.reviews,
        pagination: {
          page: result.page,
          limit: result.limit,
          total: result.total,
          totalPages: result.totalPages
        }
      });
    } catch (error) {
      console.error('Error fetching all reviews (admin):', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while fetching reviews'
      });
    }
  }

  /**
   * PATCH /reviews/:id/status - Cambiar estado de una reseña (admin)
   *
   * Body esperado:
   * {
   *   status: 'pending' | 'approved' | 'hidden'
   * }
   *
   * Respuestas:
   * - 200: Estado actualizado exitosamente
   * - 400: Estado inválido
   * - 404: Reseña no encontrada
   * - 500: Error del servidor
   */
  async changeReviewStatus(req: Request, res: Response): Promise<void> {
    try {
      const { id } = req.params;
      const { status } = req.body;

      // Validar que el status esté presente
      if (!status) {
        res.status(400).json({
          success: false,
          message: 'Status is required'
        });
        return;
      }

      // Cambiar estado (validaciones en Service)
      const updatedReview = await this.reviewService.changeReviewStatus(id, status);

      res.status(200).json({
        success: true,
        message: `Review ${status} successfully`,
        data: updatedReview
      });
    } catch (error: any) {
      if (error.message === 'Review not found') {
        res.status(404).json({
          success: false,
          message: 'Review not found'
        });
        return;
      }

      if (error.message.includes('Invalid status')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
        return;
      }

      console.error('Error changing review status:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error while updating review status'
      });
    }
  }
}

/**
 * Instancia del controller con dependency injection
 * Se inyecta ReviewService que a su vez tiene inyectado ReviewRepository
 * Facilita testing y cumple Dependency Inversion Principle
 */
const reviewService = new ReviewService(reviewRepository);
export const reviewController = new ReviewController(reviewService);
