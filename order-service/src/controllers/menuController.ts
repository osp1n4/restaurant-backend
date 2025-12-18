import { Request, Response } from 'express';
import { MenuItem } from '../models/MenuItem';

/**
 * Obtener menú con paginación y filtros
 * Cumple con US-001: Lazy loading para >20 productos
 */
export const getMenu = async (req: Request, res: Response): Promise<void> => {
  try {
    const {
      page = '1',
      limit = '20',
      category,
      available = 'true'
    } = req.query;

    const pageNum = parseInt(page as string);
    const limitNum = parseInt(limit as string);
    const skip = (pageNum - 1) * limitNum;

    // Construir filtros
    const filter: any = {};
    
    if (available === 'true') {
      filter.available = true;
    }
    
    if (category) {
      filter.category = category;
    }

    // Consulta con paginación
    const [items, total] = await Promise.all([
      MenuItem.find(filter)
        .select('name description price category imageUrl available')
        .skip(skip)
        .limit(limitNum)
        .sort({ category: 1, name: 1 })
        .lean(),
      MenuItem.countDocuments(filter),
    ]);

    const totalPages = Math.ceil(total / limitNum);
    const hasMore = pageNum < totalPages;

    res.status(200).json({
      success: true,
      data: {
        items,
        pagination: {
          page: pageNum,
          limit: limitNum,
          total,
          totalPages,
          hasMore,
        },
      },
    });
  } catch (error) {
    console.error('Error fetching menu:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el menú',
    });
  }
};

/**
 * Obtener un producto específico por ID
 */
export const getMenuItem = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;

    const item = await MenuItem.findById(id).lean();

    if (!item) {
      res.status(404).json({
        success: false,
        message: 'Producto no encontrado',
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: item,
    });
  } catch (error) {
    console.error('Error fetching menu item:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener el producto',
    });
  }
};

/**
 * Obtener categorías disponibles
 */
export const getCategories = async (req: Request, res: Response): Promise<void> => {
  try {
    const categories = await MenuItem.distinct('category', { available: true });

    res.status(200).json({
      success: true,
      data: categories.sort(),
    });
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({
      success: false,
      message: 'Error al obtener las categorías',
    });
  }
};
