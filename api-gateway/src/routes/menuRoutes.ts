import { Router, Request, Response } from 'express';
import axios from 'axios';
import { config } from '../config';

const router = Router();

/**
 * GET /menu - Obtener menú con paginación
 * Query params: page, limit, category
 */
router.get('/', async (req: Request, res: Response) => {
  try {
    const { page, limit, category } = req.query;
    
    const params = new URLSearchParams();
    if (page) params.append('page', page as string);
    if (limit) params.append('limit', limit as string);
    if (category) params.append('category', category as string);

    const response = await axios.get(
      `${config.services.orderService.url}/menu?${params.toString()}`
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error al obtener menú:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Error al obtener el menú',
      details: error.message
    });
  }
});

/**
 * GET /menu/categories - Obtener categorías disponibles
 */
router.get('/categories', async (req: Request, res: Response) => {
  try {
    const response = await axios.get(
      `${config.services.orderService.url}/menu/categories`
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error al obtener categorías:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Error al obtener las categorías',
      details: error.message
    });
  }
});

/**
 * GET /menu/:id - Obtener producto específico
 */
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    
    const response = await axios.get(
      `${config.services.orderService.url}/menu/${id}`
    );
    
    res.json(response.data);
  } catch (error: any) {
    console.error('Error al obtener producto:', error.message);
    res.status(error.response?.status || 500).json({
      error: 'Error al obtener el producto',
      details: error.message
    });
  }
});

export default router;
