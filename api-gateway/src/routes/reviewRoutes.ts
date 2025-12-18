import express, { Request, Response } from 'express';
import axios from 'axios';

const router = express.Router();
const REVIEW_SERVICE_URL = process.env.REVIEW_SERVICE_URL || 'http://localhost:3004';

// Proxy para crear reseña
router.post('/', async (req: Request, res: Response) => {
  try {
    const response = await axios.post(`${REVIEW_SERVICE_URL}/reviews`, req.body);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error creating review:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error al crear reseña' }
    );
  }
});

// Proxy para obtener reseñas públicas
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit } = req.query;
    const response = await axios.get(`${REVIEW_SERVICE_URL}/reviews`, {
      params: { page, limit },
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error fetching reviews:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error al obtener reseñas' }
    );
  }
});

// ========== RUTAS DE ADMINISTRACIÓN (deben ir primero para evitar conflictos) ==========

// Proxy para obtener todas las reseñas (admin)
router.get('/admin/reviews', async (req: Request, res: Response) => {
  try {
    const { status, page, limit } = req.query;
    const response = await axios.get(`${REVIEW_SERVICE_URL}/reviews/admin/reviews`, {
      params: { status, page, limit },
    });
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error fetching admin reviews:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error al obtener reseñas' }
    );
  }
});

// Proxy para actualizar estado de reseña (debe incluir /admin/ en la ruta)
router.patch('/admin/:id/status', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.patch(
      `${REVIEW_SERVICE_URL}/reviews/admin/${id}/status`,
      req.body
    );
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error updating review status:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error al actualizar estado' }
    );
  }
});

// Proxy para eliminar reseña
router.delete('/admin/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.delete(`${REVIEW_SERVICE_URL}/reviews/admin/${id}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error deleting review:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error al eliminar reseña' }
    );
  }
});

// ========== RUTAS PÚBLICAS ==========

// Proxy para obtener reseña por ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const response = await axios.get(`${REVIEW_SERVICE_URL}/reviews/${id}`);
    res.status(response.status).json(response.data);
  } catch (error: any) {
    console.error('Error fetching review:', error.message);
    res.status(error.response?.status || 500).json(
      error.response?.data || { success: false, message: 'Error al obtener reseña' }
    );
  }
});

export default router;
