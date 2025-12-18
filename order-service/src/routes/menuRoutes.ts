import { Router } from 'express';
import { getMenu, getMenuItem, getCategories } from '../controllers/menuController';

const router = Router();

/**
 * Rutas del menú
 * GET /menu - Obtener menú con paginación
 * GET /menu/categories - Obtener categorías disponibles
 * GET /menu/:id - Obtener producto específico
 */
router.get('/menu', getMenu);
router.get('/menu/categories', getCategories);
router.get('/menu/:id', getMenuItem);

export default router;
