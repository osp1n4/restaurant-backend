# Instrucciones para Configurar Firebase Authentication como Administrador de Usuarios

## 1. Crear un Proyecto en Firebase
- Ve a https://console.firebase.google.com/
- Haz clic en "Agregar proyecto" y sigue los pasos.

## 2. Habilitar Firebase Authentication
- En el panel de tu proyecto, ve a "Authentication" > "Método de inicio de sesión".
- Habilita el método de correo electrónico/contraseña (y otros si lo deseas).

## 3. Crear Usuarios y Asignar Roles
- Desde la consola de Firebase, puedes crear usuarios manualmente o permitir el registro desde la app.
- Para roles personalizados (ej: ADMIN, MESERO), usa "Custom Claims":
  - En la consola, selecciona un usuario y usa la pestaña "Custom Claims" para asignar roles.
  - Ejemplo de custom claim: `{ "role": "ADMIN" }`

## 4. Configurar el Backend para Validar JWT de Firebase
- Instala el SDK de Firebase Admin en tu backend:
  ```bash
  npm install firebase-admin
  ```
- Descarga la clave privada del servicio desde "Configuración del proyecto" > "Cuentas de servicio" > "Generar nueva clave privada".
- Usa el SDK para validar tokens y leer custom claims en tus middlewares.

## 5. Delegar Administración a un Tercero
- Da acceso a la consola de Firebase solo a los administradores autorizados.
- Los administradores pueden:
  - Crear, editar y desactivar usuarios desde la consola.
  - Restablecer contraseñas.
  - Asignar roles mediante custom claims.

## 6. Seguridad
- Nunca expongas la clave privada del servicio en el frontend.
- Limita el acceso a la consola de Firebase solo a personal autorizado.

## 7. Recursos
- [Documentación oficial Firebase Authentication](https://firebase.google.com/docs/auth)
- [Custom Claims y roles](https://firebase.google.com/docs/auth/admin/custom-claims)

---
¿Necesitas ejemplos de código para la integración backend?