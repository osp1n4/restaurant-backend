import { Router } from 'express';
import userController from '../controllers/userController';

const router = Router();


// GET /users?name=&email=&role=&page=&limit=
router.get('/', userController.listUsers);

// POST /users - Crear usuario
router.post('/', userController.createUser);

// PUT /users/:uid - Editar usuario (nombre, rol)
router.put('/:uid', userController.editUser);

// PATCH /users/:uid/disable - Desactivar usuario
router.patch('/:uid/disable', userController.disableUser);

// POST /users/:uid/reset-password - Restablecer contraseña
router.post('/:uid/reset-password', userController.resetPassword);

export default router;
