
import { Router } from 'express';



const router = Router();



// POST /reviews - Crear reseña

router.post('/', (req, res) => {

  res.status(501).json({ message: 'Not implemented yet' });

});



// GET /reviews - Listar reseñas aprobadas

router.get('/', (req, res) => {

  res.status(501).json({ message: 'Not implemented yet' });

});



// GET /reviews/:id - Obtener reseña

router.get('/:id', (req, res) => {

  res.status(501).json({ message: 'Not implemented yet' });

});



// PATCH /reviews/:id/status - Cambiar estado (admin)

router.patch('/:id/status', (req, res) => {

  res.status(501).json({ message: 'Not implemented yet' });

});



export default router;

