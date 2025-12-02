# HU2: Crear un nuevo usuario del personal (Backend)

**Como** Administrador  
**Quiero** que el backend permita crear usuarios del personal y delegar la administración a través de Firebase Authentication  
**Para** que la gestión de usuarios sea segura, centralizada y administrable por terceros.

## Criterios de Aceptación
- El backend debe exponer un endpoint para crear usuarios, recibiendo nombre, email, contraseña temporal y rol.
- Al crear un usuario, debe registrarlo en Firebase Authentication y guardar los datos en la base de datos.
- El backend debe validar los datos recibidos y retornar mensajes de error claros si hay datos inválidos.
- La gestión de usuarios (creación, desactivación, cambio de contraseña) puede realizarse también desde la consola de Firebase Authentication por un tercero autorizado.
- Debe retornar un mensaje de éxito o error tras el intento de creación.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.