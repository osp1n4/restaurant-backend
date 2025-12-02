# HU1: Acceso seguro al Panel de Administración (Backend)

**Como** Administrador  
**Quiero** que el backend valide el acceso a la sección de Gestión de Personal usando Firebase Authentication  
**Para** asegurar que solo usuarios con rol Administrador puedan realizar acciones administrativas y que la gestión de usuarios sea administrable por terceros.

-## Criterios de Aceptación
- El backend debe implementar un middleware que valide el JWT emitido por Firebase en cada endpoint de gestión de usuarios.
- El middleware debe verificar que el usuario tenga el rol Administrador (almacenado como custom claim en Firebase o en la base de datos).
- Si el usuario no es administrador o el token es inválido, la solicitud debe ser rechazada con el código de error correspondiente (401/403).
- La gestión de usuarios (alta, baja, cambio de contraseña) debe ser posible desde la consola de Firebase Authentication por un tercero autorizado.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.