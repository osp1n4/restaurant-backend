import { Request, Response } from 'express';
import admin from '../config/firebase';

class UserController {
    // Crear usuario
    async createUser(req: Request, res: Response) {
      try {
        const { name, email, password, role } = req.body;
        if (!name || !email || !password || !role) {
          return res.status(400).json({ success: false, message: 'Faltan datos requeridos (name, email, password, role)' });
        }
        // Crear usuario en Firebase Auth
        const userRecord = await admin.auth().createUser({
          displayName: name,
          email,
          password,
          emailVerified: false,
          disabled: false,
        });
        // Asignar custom claim de rol
        await admin.auth().setCustomUserClaims(userRecord.uid, { role });
        // TODO: Guardar en base de datos si aplica
        return res.status(201).json({ success: true, message: 'Usuario creado', uid: userRecord.uid });
      } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message || 'Error al crear usuario', error });
      }
    }

    // Editar usuario (nombre, rol)
    async editUser(req: Request, res: Response) {
      try {
        const { uid } = req.params;
        const { name, role } = req.body;
        if (!uid || (!name && !role)) {
          return res.status(400).json({ success: false, message: 'Faltan datos requeridos (uid, name o role)' });
        }
        if (name) {
          await admin.auth().updateUser(uid, { displayName: name });
        }
        if (role) {
          await admin.auth().setCustomUserClaims(uid, { role });
        }
        // TODO: Actualizar en base de datos si aplica
        return res.json({ success: true, message: 'Usuario actualizado' });
      } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message || 'Error al editar usuario', error });
      }
    }

    // Desactivar usuario
    async disableUser(req: Request, res: Response) {
      try {
        const { uid } = req.params;
        if (!uid) {
          return res.status(400).json({ success: false, message: 'Falta uid' });
        }
        // No permitir que un admin se desactive a sí mismo (ejemplo básico)
        // if (req.user.uid === uid) return res.status(403).json({ success: false, message: 'No puedes desactivar tu propia cuenta' });
        await admin.auth().updateUser(uid, { disabled: true });
        // TODO: Actualizar en base de datos si aplica
        return res.json({ success: true, message: 'Usuario desactivado' });
      } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message || 'Error al desactivar usuario', error });
      }
    }

    // Restablecer contraseña
    async resetPassword(req: Request, res: Response) {
      try {
        const { uid } = req.params;
        const { newPassword } = req.body;
        if (!uid || !newPassword) {
          return res.status(400).json({ success: false, message: 'Faltan datos requeridos (uid, newPassword)' });
        }
        await admin.auth().updateUser(uid, { password: newPassword });
        // TODO: Notificar al usuario si aplica
        return res.json({ success: true, message: 'Contraseña restablecida' });
      } catch (error: any) {
        return res.status(500).json({ success: false, message: error.message || 'Error al restablecer contraseña', error });
      }
    }
  // List and search users with filters and pagination
  async listUsers(req: Request, res: Response) {
    try {
      // Parámetros de filtro
      const { name, email, role } = req.query;
      // Obtiene hasta 1000 usuarios de Firebase Auth (paginación básica de Firebase)
      const listUsersResult = await admin.auth().listUsers(1000);
      let users = listUsersResult.users.map((userRecord: admin.auth.UserRecord) => ({
        uid: userRecord.uid,
        name: userRecord.displayName,
        email: userRecord.email,
        role: userRecord.customClaims?.role || 'empleado',
        status: userRecord.disabled ? 'desactivado' : 'activo',
      }));

      // Filtros
      if (name) {
        users = users.filter((u: any) => u.name && u.name.toLowerCase().includes(String(name).toLowerCase()));
      }
      if (email) {
        users = users.filter((u: any) => u.email && u.email.toLowerCase().includes(String(email).toLowerCase()));
      }
      if (role) {
        users = users.filter((u: any) => u.role && u.role.toLowerCase() === String(role).toLowerCase());
      }

      // Paginación
      const page = parseInt(String(req.query.page || 1), 10);
      const limit = parseInt(String(req.query.limit || 20), 10);
      const start = (page - 1) * limit;
      const paginatedUsers = users.slice(start, start + limit);

      res.json({
        success: true,
        data: paginatedUsers,
        pagination: {
          page,
          limit,
          total: users.length,
          totalPages: Math.ceil(users.length / limit),
        },
      });
    } catch (error) {
      res.status(500).json({ success: false, message: 'Error al obtener usuarios', error });
    }
  }
}

export default new UserController();
