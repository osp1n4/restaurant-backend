# HU4: Editar y desactivar usuarios (Backend)

**Como** Administrador  
**Quiero** que el backend permita editar datos y desactivar cuentas de usuarios, y que la administración sea posible desde Firebase Authentication  
**Para** mantener actualizada la información y controlar el acceso del personal, permitiendo la gestión por terceros.

## Criterios de Aceptación
- El backend debe exponer endpoints para editar nombre y rol de un usuario.
- Debe permitir restablecer la contraseña de un usuario, integrando la funcionalidad de Firebase Authentication.
- Debe permitir desactivar una cuenta (cambiar campo activo a false, sin eliminar el registro), y reflejar el estado en Firebase Authentication si es necesario.
- El backend debe impedir que un administrador desactive su propia cuenta.
- Todas las acciones deben estar protegidas por validación de rol y autenticación.
- La gestión de usuarios (edición, desactivación, cambio de contraseña) puede realizarse también desde la consola de Firebase Authentication por un tercero autorizado.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.