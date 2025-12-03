# HU-1: Acceso seguro al Panel de Administración (Backend)

**Como** Administrador  
****Quiero**** que el backend valide el acceso a la sección de Gestión de Personal usando Firebase Authentication  
****Para**** asegurar que solo usuarios con rol Administrador puedan realizar acciones administrativas y que la gestión de usuarios sea administrable por terceros.

-## Criterios de Aceptación
- El backend debe implementar un middleware que valide el JWT emitido por Firebase en cada endpoint de gestión de usuarios.
- El middleware debe verificar que el usuario tenga el rol Administrador (almacenado como custom claim en Firebase o en la base de datos).
- Si el usuario no es administrador o el token es inválido, la solicitud debe ser rechazada con el código de error correspondiente (401/403).
- La gestión de usuarios (alta, baja, cambio de contraseña) debe ser posible desde la consola de Firebase Authentication por un tercero autorizado.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.

------------------------------------------------------------------------------------------------------------------------------

# HU-2: Crear un nuevo usuario del personal (Backend)

**Como** Administrador  
****Quiero**** que el backend permita crear usuarios del personal y delegar la administración a través de Firebase Authentication  
**Para** que la gestión de usuarios sea segura, centralizada y administrable por terceros.

## Criterios de Aceptación
- El backend debe exponer un endpoint para crear usuarios, recibiendo nombre, email, contraseña temporal y rol.
- Al crear un usuario, debe registrarlo en Firebase Authentication y guardar los datos en la base de datos.
- El backend debe validar los datos recibidos y retornar mensajes de error claros si hay datos inválidos.
- La gestión de usuarios (creación, desactivación, cambio de contraseña) puede realizarse también desde la consola de Firebase Authentication por un tercero autorizado.
- Debe retornar un mensaje de éxito o error tras el intento de creación.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.

------------------------------------------------------------------------------------------------------------------------------

# HU-3: Visualizar y buscar usuarios existentes (Backend)

**Como** Administrador  
****Quiero**** que el backend permita listar y buscar usuarios, integrando la información de Firebase Authentication  
**Para** gestionar y localizar fácilmente a los empleados registrados y que la administración sea flexible para terceros.

## Criterios de Aceptación
- El backend debe exponer un endpoint para listar todos los usuarios con sus datos clave (nombre, email, rol, estado), integrando la información de Firebase Authentication y la base de datos.
- Debe permitir filtrar/buscar usuarios por nombre, email o rol mediante parámetros de consulta.
- El endpoint debe soportar paginación para grandes volúmenes de usuarios.
- La información de usuarios puede ser consultada y gestionada también desde la consola de Firebase Authentication por un tercero autorizado.

## Recomendaciones de Implementación
- El código debe seguir los principios SOLID y Clean Code para asegurar mantenibilidad, escalabilidad y facilidad de pruebas.

------------------------------------------------------------------------------------------------------------------------------

# HU-4: Editar y desactivar usuarios (Backend)

**Como** Administrador  
****Quiero**** que el backend permita editar datos y desactivar cuentas de usuarios, y que la administración sea posible desde Firebase Authentication  
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

------------------------------------------------------------------------------------------------------------------------------
# HU — Dashboard de Analíticas de Ventas y Rendimiento


# HU-5: Visualización de métricas clave por rango de fechas

**Como** Manager o Administrador de la plataforma
**Quiero** visualizar métricas clave del negocio filtradas por un rango de fechas específico
**Para** analizar el rendimiento de ventas, ingresos y productos durante un periodo particular y tomar decisiones informadas

## Criterios de Aceptación

**Dado** que el usuario está autenticado como “manager” o “admin” y existen datos en el rango de fechas seleccionado
**Cuando** consultar el rendimiento del negocio dentro de un periodo definido
**Entonces** al acceder al Dashboard de Analíticas (/admin/analytics) y seleccionar un rango (ej. 2025-11-01 al 2025-11-30), el sistema muestra:

totalOrders

totalRevenue

productsSold (por producto)

topNProducts

avgPrepTime
presentados en gráficos (línea, barra) y una tabla paginada.

------------------------------------------------------------------------------------------------------------------------------
# HU-6: Filtrado y agrupación de métricas por periodos

**Como** Manager o Administrador de la plataforma
**Quiero** agrupar y visualizar métricas por periodos predefinidos (día, semana, mes, año)
**Para** analizar tendencias y variaciones del negocio en diferentes escalas temporales

## Criterios de Aceptación

**Dado** que el usuario está visualizando métricas ya filtradas en el Dashboard
**Cuando** agrupar los datos por un periodo definido (ej. “semana” o “mes”)
**Entonces** el sistema actualiza los gráficos y la tabla mostrando métricas agregadas por sub-periodo, incluyendo valores como dateFrom, dateTo y metrics correspondientes.

-----------------------------------------------------------------------------------------------------------------------------

# HU-7 : Exportación de datos del dashboard a CSV


**Como** Manager o Administrador de la plataforma
**Quiero** exportar en un archivo CSV los datos visibles del dashboard
**Para** realizar análisis externos, integrarlos en reportes o compartir información con otros equipos

## Criterios de Aceptación

**Dado** que el dashboard muestra métricas filtradas y agrupadas con base en parámetros seleccionados
**Cuando** descargar dicha información para su uso fuera de la plataforma
**Entonces** al pulsar “Exportar CSV” (POST a /admin/analytics/export), el sistema devuelve 200 con un archivo CSV que contiene columnas:
period, totalOrders, totalRevenue, productId, productName, quantity, avgPrepTime.

------------------------------------------------------------------------------------------------------------------------------

# HU-8 : Manejo de ausencia de datos

**Como** Manager o Administrador de la plataforma
**Quiero** ver una mensaje clara cuando no existan datos disponibles para un periodo seleccionado
**Para** evitar confusiones y entender que no hay registros asociados a ese rango temporal

## Criterios de Aceptación

**Dado** que el usuario está autenticado como “manager” o “admin”
**Cuando** consultar un rango de fechas sin datos registrados
**Entonces** el sistema muestra el mensaje:
“No hay datos disponibles para el período seleccionado”,
y los gráficos y tablas aparecen vacíos o con valores en cero.

------------------------------------------------------------------------------------------------------------------------------
## SISTEMA DE RESEÑAS (CUSTOMER REVIEWS) - HISTORIAS DE USUARIO

# HU-09: Dejar una Reseña (Como Cliente)

**Como** cliente que ha **recibido su pedido**,
**Quiero** **calificar mi experiencia** y la calidad de la comida,
**Para** **compartir mi opinión** y ayudar a otros clientes a tomar decisiones.

**Criterios de Aceptación:**
- El botón "Leave a Review" es visible solo en pedidos con **estado "delivered"**.
- El modal de reseña incluye un formulario con **validación en tiempo real**.
- La **Calificación General** (Overall Rating) de 1-5 estrellas es **obligatoria**.
- La **Calificación de Comida** (Food Quality) de 1-5 estrellas es **obligatoria**.
- El campo de comentario es opcional, con un límite de **500 caracteres**.
- El sistema previene el **envío de reseñas duplicadas** para un mismo pedido (usando orderId como índice único).

------------------------------------------------------------------------------------------------------------------------------

# HU-10: Ver Reseñas Públicas (Como Visitante/Cliente)

**Como** visitante de la plataforma,
**Quiero** **ver la lista de reseñas aprobadas** con calificaciones promedio,
**Para** **evaluar la calidad** del restaurante y decidir si comprar.

**Criterios de Aceptación:**
- Solo se muestran las reseñas con **estado "approved"**.
- La página de reseñas debe tener **paginación** para manejar grandes volúmenes de datos.
- Se debe mostrar la **Calificación General promedio** del restaurante.
- Debe incluir un botón "View Customer Reviews" en la página de inicio o del producto.

------------------------------------------------------------------------------------------------------------------------------

# HU-11: Moderar Reseñas (Como Administrador)

**Como** administrador del sistema,
**Quiero** **gestionar las reseñas entrantes** para cambiar su estado (aprobado/oculto),
**Para** **mantener la calidad del contenido** y evitar reseñas ofensivas o spam.

**Criterios de Aceptación:**
- El administrador puede filtrar reseñas por estado: **pendiente, aprobado y oculto**.
- Cada reseña muestra la calificación, el comentario y el orderId asociado.
- El administrador puede cambiar el estado de una reseña de "pending" a "approved" u "hidden".

-----------------------------------------------------------------------------------------------------------------------------
# HU-12: Visualizar Estadísticas (Como Administrador)

**Como** administrador,
**Quiero** **acceder a un resumen de métricas** de las reseñas,
**Para** **identificar rápidamente tendencias** y áreas específicas de mejora en el servicio.

**Criterios de Aceptación:**
- El panel muestra la **Calificación General promedio** y la **Calificación de Comida promedio**.
- Debe mostrar el **conteo total** de reseñas.
- Debe mostrar el número de reseñas por **rango de estrellas** (ej. cuántas 5 estrellas, cuántas 1 estrella).

------------------------------------------------------------------------------------------------------------------------------
