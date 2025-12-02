# HU3: Visualizar y buscar usuarios existentes (Backend)

**Como** Administrador  
**Quiero** que el backend permita listar y buscar usuarios, integrando la información de Firebase Authentication  
**Para** gestionar y localizar fácilmente a los empleados registrados y que la administración sea flexible para terceros.

## Criterios de Aceptación
- El backend debe exponer un endpoint para listar todos los usuarios con sus datos clave (nombre, email, rol, estado), integrando la información de Firebase Authentication y la base de datos.
- Debe permitir filtrar/buscar usuarios por nombre, email o rol mediante parámetros de consulta.
- El endpoint debe soportar paginación para grandes volúmenes de usuarios.
- La información de usuarios puede ser consultada y gestionada también desde la consola de Firebase Authentication por un tercero autorizado.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.