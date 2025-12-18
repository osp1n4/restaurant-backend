import { Request, Response } from 'express';
import Review from '../models/Review';

// Crear nueva reseña
export const createReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { orderId, userName, userEmail, rating, foodQuality, comment } = req.body;

    // Validaciones básicas
    if (!orderId || !userName || !userEmail || !rating) {
      res.status(400).json({
        success: false,
        message: 'Faltan campos requeridos',
      });
      return;
    }

    if (rating < 1 || rating > 5) {
      res.status(400).json({
        success: false,
        message: 'La calificación debe estar entre 1 y 5',
      });
      return;
    }

    // Verificar si ya existe una reseña para esta orden
    const existingReview = await Review.findOne({ orderId });
    if (existingReview) {
      res.status(409).json({
        success: false,
        message: 'Ya existe una reseña para esta orden',
      });
      return;
    }

    const review = new Review({
      orderId,
      userName,
      userEmail,
      rating,
      foodQuality,
      comment,
      status: 'pending', // Por defecto, las reseñas están pendientes de aprobación
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Reseña creada exitosamente',
      data: review,
    });
  } catch (error) {
    console.error('Error creating review:', error);
    res.status(500).json({
      success: false,
      message: 'Error al crear la reseña',
    });
  }
};

// Obtener reseñas públicas (solo aprobadas)
export const getPublicReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 10;
    const skip = (page - 1) * limit;

    const reviews = await Review.find({ status: 'approved' })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments({ status: 'approved' });

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching public reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas',
    });
  }
};

// Obtener todas las reseñas (admin)
export const getAllReviews = async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string;
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const skip = (page - 1) * limit;

    const filter: any = {};
    if (status) {
      filter.status = status;
    }

    const reviews = await Review.find(filter)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Review.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: reviews,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching all reviews:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener reseñas',
    });
  }
};

// Obtener reseña por ID
export const getReviewById = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Reseña no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: review,
    });
  } catch (error) {
    console.error('Error fetching review:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener la reseña',
    });
  }
};

// Actualizar estado de reseña (aprobar/ocultar)
export const updateReviewStatus = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    if (!['approved', 'hidden', 'pending'].includes(status)) {
      res.status(400).json({
        success: false,
        message: 'Estado inválido',
      });
      return;
    }

    const review = await Review.findByIdAndUpdate(
      id,
      { status },
      { new: true }
    );

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Reseña no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: `Reseña ${status === 'approved' ? 'aprobada' : 'ocultada'} exitosamente`,
      data: review,
    });
  } catch (error) {
    console.error('Error updating review status:', error);
    res.status(500).json({
      success: false,
      message: 'Error al actualizar el estado de la reseña',
    });
  }
};

// Eliminar reseña
export const deleteReview = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndDelete(id);

    if (!review) {
      res.status(404).json({
        success: false,
        message: 'Reseña no encontrada',
      });
      return;
    }

    res.status(200).json({
      success: true,
      message: 'Reseña eliminada exitosamente',
    });
  } catch (error) {
    console.error('Error deleting review:', error);
    res.status(500).json({
      success: false,
      message: 'Error al eliminar la reseña',
    });
  }
};
