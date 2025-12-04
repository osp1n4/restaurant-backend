import { Review, IReview } from '../models/Review';

/**
 * Interface que define el contrato del Repository
 * Principio SOLID: Dependency Inversion - Los servicios dependen de esta abstracción
 * Principio SOLID: Interface Segregation - Métodos específicos y cohesivos
 *
 * Patrón de Diseño: Repository Pattern
 * Objetivo: Abstraer la lógica de acceso a datos, desacoplando la persistencia
 */
export interface IReviewRepository {
  create(reviewData: CreateReviewDTO): Promise<IReview>;
  findById(id: string): Promise<IReview | null>;
  findApproved(page: number, limit: number): Promise<IReview[]>;
  findAll(page: number, limit: number): Promise<IReview[]>;
  updateStatus(id: string, status: 'pending' | 'approved' | 'hidden'): Promise<IReview | null>;
  countApproved(): Promise<number>;
  countAll(): Promise<number>;
  hasReviewForOrder(orderId: string): Promise<boolean>;
}

/**
 * DTO (Data Transfer Object) para creación de reseñas
 * Principio SOLID: Single Responsibility - Define estructura de datos de entrada
 */
export interface CreateReviewDTO {
  orderId: string;
  customerName: string;
  customerEmail: string;
  ratings: {
    overall: number;
    food: number;
  };
  comment?: string;
}

/**
 * Implementación concreta del Repository usando Mongoose
 * Principio SOLID: Single Responsibility - Solo maneja persistencia de datos
 * Principio SOLID: Open/Closed - Abierto a extensión (nuevos métodos), cerrado a modificación
 *
 * Patrón de Diseño: Repository Pattern
 */
export class ReviewRepository implements IReviewRepository {
  /**
   * Crea una nueva reseña en la base de datos
   * @param reviewData - Datos de la reseña
   * @returns Reseña creada con estado "pending" (requiere aprobación manual)
   * @throws Error si el orderId ya tiene una reseña o si fallan validaciones
   */
  async create(reviewData: CreateReviewDTO): Promise<IReview> {
    try {
      const review = new Review({
        ...reviewData,
        status: 'pending' // Reviews requieren aprobación del administrador antes de ser visibles
      });

      await review.save();
      return review;
    } catch (error: any) {
      // Manejo específico de errores de duplicado (código 11000 de MongoDB)
      if (error.code === 11000) {
        throw new Error('A review already exists for this order');
      }

      // Manejo de errores de validación de Mongoose
      if (error.name === 'ValidationError') {
        const messages = Object.values(error.errors)
          .map((err: any) => err.message)
          .join(', ');
        throw new Error(`Validation error: ${messages}`);
      }

      throw error;
    }
  }

  /**
   * Busca una reseña por su ID
   * @param id - ID de la reseña
   * @returns Reseña encontrada o null
   */
  async findById(id: string): Promise<IReview | null> {
    try {
      return await Review.findById(id);
    } catch (error) {
      // Si el ID no es válido, retorna null en lugar de error
      return null;
    }
  }

  /**
   * Obtiene reseñas aprobadas con paginación
   * Principio SOLID: Single Responsibility - Solo consulta datos aprobados
   * @param page - Número de página (comienza en 1)
   * @param limit - Cantidad de resultados por página
   * @returns Array de reseñas aprobadas ordenadas por fecha descendente
   */
  async findApproved(page: number = 1, limit: number = 10): Promise<IReview[]> {
    const skip = (page - 1) * limit;

    return await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 }) // Más recientes primero
      .skip(skip)
      .limit(limit);
  }

  /**
   * Obtiene todas las reseñas (incluye pending, hidden) con paginación
   * Usado por administradores para moderación
   * @param page - Número de página
   * @param limit - Cantidad de resultados por página
   * @returns Array de todas las reseñas ordenadas por fecha descendente
   */
  async findAll(page: number = 1, limit: number = 10): Promise<IReview[]> {
    const skip = (page - 1) * limit;

    return await Review.find()
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);
  }

  /**
   * Actualiza el estado de una reseña (pending → approved/hidden)
   * Principio SOLID: Single Responsibility - Solo actualiza estado
   * @param id - ID de la reseña
   * @param status - Nuevo estado
   * @returns Reseña actualizada o null si no existe
   */
  async updateStatus(
    id: string,
    status: 'pending' | 'approved' | 'hidden'
  ): Promise<IReview | null> {
    try {
      return await Review.findByIdAndUpdate(
        id,
        { status },
        { new: true, runValidators: true } // Retorna documento actualizado y valida
      );
    } catch (error) {
      return null;
    }
  }

  /**
   * Cuenta el total de reseñas aprobadas
   * Usado para paginación en vista pública
   * @returns Número total de reseñas aprobadas
   */
  async countApproved(): Promise<number> {
    return await Review.countDocuments({ status: 'approved' });
  }

  /**
   * Cuenta el total de reseñas (todos los estados)
   * Usado para paginación en panel admin
   * @returns Número total de reseñas
   */
  async countAll(): Promise<number> {
    return await Review.countDocuments();
  }

  /**
   * Verifica si un pedido ya tiene una reseña
   * Previene reseñas duplicadas del mismo pedido
   * @param orderId - ID del pedido
   * @returns true si ya existe reseña, false si no
   */
  async hasReviewForOrder(orderId: string): Promise<boolean> {
    const count = await Review.countDocuments({ orderId });
    return count > 0;
  }
}

/**
 * Instancia singleton del repository
 * Patrón de Diseño: Singleton (instancia única compartida)
 *
 * Nota: Para testing, se puede inyectar un mock en lugar de esta instancia
 */
export const reviewRepository = new ReviewRepository();
