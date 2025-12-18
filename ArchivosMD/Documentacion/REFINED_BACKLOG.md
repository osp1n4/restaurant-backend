
# REFINED_BACKLOG
**Documento de Historias de Usuario Refinadas**
**Proyecto:** Delicious Kitchen

---

## US-001: Visualizar menú y tiempos de carga
**Descripción:** Como Cliente, quiero ver el menú con las categorías cargadas de forma prioritaria, para minimizar mi tiempo de espera antes de poder seleccionar un producto.

**Criterios de Aceptación:**
1. **Rendimiento (LCP):** El renderizado del listado no debe exceder los 2.5 segundos en red 4G simulada.
2. **Paginación:** Implementar Lazy Loading para categorías con >20 productos; payload inicial <500KB.
3. **UI:** Cada tarjeta muestra obligatoriamente: Título, Precio ($0.00) y Botón "Añadir".

---

## US-002: Añadir productos al pedido
**Descripción:** Como Cliente, quiero añadir múltiples unidades de un mismo producto o diferentes productos a mi pedido, para personalizar la cantidad y variedad de mi orden.

**Criterios de Aceptación:**
1. Al hacer clic en "añadir" varias veces, la cantidad del producto en el carrito se incrementa.
2. Al añadir diferentes productos, ambos se muestran con sus respectivas cantidades.
3. Al revisar el carrito, se muestra el subtotal correcto de los productos seleccionados.

---

## US-003: Añadir notas personalizadas al pedido
**Descripción:** Como Cliente, quiero tener la opción de añadir notas específicas a mi pedido, para comunicar preferencias o restricciones dietéticas.

**Criterios de Aceptación:**
1. El cliente puede introducir texto libre en el campo de notas.
2. Las notas se guardan y asocian al pedido al confirmar.
3. El personal de cocina visualiza las notas en los detalles del pedido.

---

## US-004: Confirmar y enviar pedido
**Descripción:** Como Cliente, quiero confirmar mi pedido y enviarlo a la cocina, para iniciar el proceso de preparación[cite: 2083].

**Criterios de Aceptación:**
1. Al hacer clic en "Confirmar Pedido", el pedido se registra en el sistema.
2. El Order Service recibe el pedido procesado.
3. El Kitchen Service recibe una notificación de nuevo pedido.

---

## US-005: Modificar pedido antes de preparación
**Descripción:** Como Cliente, quiero poder modificar mi pedido antes de que la cocina comience a prepararlo, para corregir errores a tiempo.

**Criterios de Aceptación:**
1. La opción "Modificar Pedido" es visible solo si el pedido no está en estado "Comenzar a cocinar".
2. El Order Service actualiza el pedido tras guardar cambios.
3. La cocina recibe notificación con los detalles actualizados.

---

## US-006: Visualizar pedidos pendientes en panel de cocina
**Descripción:** Como Personal de Cocina, quiero ver una lista clara de todos los pedidos pendientes, para saber qué debo cocinar.

**Criterios de Aceptación:**
1. Visualización de lista filtrada por estado "Pendiente".
2. Nuevos pedidos aparecen en la lista al actualizar la vista.
3. Pedidos marcados como "En preparación" desaparecen de esta lista.

---

## US-007: Marcar pedido como "Comenzar a cocinar"
**Descripción:** Como Personal de Cocina, quiero marcar un pedido como "Comenzar a cocinar", para indicar el inicio y notificar al cliente.

**Criterios de Aceptación:**
1. El estado del pedido cambia a "En preparación" al hacer clic en el botón.
2. El cliente recibe notificación de que su pedido está siendo preparado.
3. La opción de "Modificar Pedido" se bloquea para el cliente.

---

## US-008: Marcar pedido como "Listo"
**Descripción:** Como Personal de Cocina, quiero marcar un pedido como "Listo", para indicar que la comida está preparada para recogida.

**Criterios de Aceptación:**
1. El estado cambia a "Listo" al hacer clic en el botón.
2. El cliente recibe notificación para recoger su pedido.
3. El estado no puede revertirse a "En preparación" o "Pendiente".

---

## US-009: Recibir notificación de pedido en preparación
**Descripción:** Como Cliente, quiero recibir una notificación automática cuando mi pedido comienza a prepararse.

**Criterios de Aceptación:**
1. Recepción de notificación (pop-up/email) cuando cocina marca "Comenzar a cocinar".
2. El mensaje de la notificación es claro y conciso.
---

## US-010: Recibir notificación de pedido listo
**Descripción:** Como Cliente, quiero recibir una notificación automática cuando mi pedido está listo para recoger.

**Criterios de Aceptación:**
1. Recepción de notificación cuando cocina marca el pedido como "Listo".

---

## US-011: Kitchen Service recibe notificación de nuevo pedido
**Descripción:** Como Kitchen Service, quiero recibir una notificación de nuevos pedidos, para que el personal pueda verlos.

**Criterios de Aceptación:**
1. Recepción de mensaje vía RabbitMQ cuando Order Service registra un pedido.
2. El nuevo pedido aparece en el panel de pendientes tras procesar el mensaje.

---

## US-012: Kitchen Service recibe notificación de pedido cancelado
**Descripción:** Como Kitchen Service, quiero recibir notificación de cancelaciones, para optimizar recursos.

**Criterios de Aceptación:**
1. Recepción de mensaje vía RabbitMQ tras cancelación en Order Service.
2. El pedido se elimina o marca como "Cancelado" en el panel de cocina.
3. El personal no puede iniciar preparación de un pedido cancelado.

---

## US-013: Cancelar un pedido
**Descripción:** Como Cliente, quiero cancelar mi pedido si aún no ha comenzado a cocinarse, para anular errores.

**Criterios de Aceptación:**
1. Opción "Cancelar" visible solo si no se ha marcado "Comenzar a cocinar".
2. Order Service procesa la cancelación tras confirmación.
3. Kitchen Service recibe la notificación y actualiza el panel.

---

## US-014: Recibir confirmación de cancelación
**Descripción:** Como Cliente, quiero recibir notificación de cancelación exitosa.

**Criterios de Aceptación:**
1. Recepción de notificación confirmando la cancelación y anulación de proceso.

---

## US-015: Registrarse en la plataforma
**Descripción:** Como Administrador, quiero registrar usuarios para que puedan acceder a las funcionalidades.

**Criterios de Aceptación:**
1. Creación de cuenta en Firebase con email y contraseña válidos.
2. Asignación de rol por defecto "kitchen" al nuevo usuario.

---

## US-016: Iniciar sesión con credenciales
**Descripción:** Como Usuario, quiero iniciar sesión para acceder a mi rol.

**Criterios de Aceptación:**
1. Autenticación exitosa con Firebase redirige a la interfaz correspondiente al rol.
2. Mensaje de error claro ante credenciales incorrectas.

---

## US-017: Crear nuevos usuarios (Admin)
**Descripción:** Como Administrador, quiero crear cuentas para personal, para gestionar accesos centralizados.

**Criterios de Aceptación:**
1. Opción "Crear Nuevo Usuario" disponible en gestión de usuarios.
2. Creación de cuenta en Firebase con el rol especificado por el admin.
3. El nuevo usuario puede acceder inmediatamente con esas credenciales.

---

## US-018: Editar roles de usuarios (Admin)
**Descripción:** Como Administrador, quiero modificar roles de usuarios existentes para ajustar permisos.

**Criterios de Aceptación:**
1. Capacidad de cambiar rol (Cliente, Cocina, Admin) desde editar perfil.
2. Los permisos se actualizan al siguiente inicio de sesión del usuario.
3. Error al intentar asignar roles inválidos.

---

## US-019: Activar/desactivar cuentas (Admin)
**Descripción:** Como Administrador, quiero activar o desactivar cuentas para controlar el acceso sin borrar datos.

**Criterios de Aceptación:**
1. Usuario desactivado no puede iniciar sesión.
2. Usuario reactivado recupera el acceso.
3. Mensaje de "cuenta inactiva" al intentar loguearse.

---

## US-020: Visualizar roles correctamente (Admin)
**Descripción:** Como Administrador, quiero que los roles se muestren correctamente en el panel para evitar confusiones.

**Criterios de Aceptación:**
1. Visualización clara del rol actual de cada usuario en la lista.
2. Traducción correcta de nombres de roles según idioma.
3. Reflejo inmediato en la lista tras editar un rol.

---

## US-021: Mantener sesión activa
**Descripción:** Como Usuario, quiero que mi sesión no expire en corto tiempo para uso fluido.

**Criterios de Aceptación:**
1. Sesión activa por 10 minutos de inactividad.
2. Solicitud de login clara al expirar token.
3. Configuración de token superior a 3 minutos confirmada.

---

## US-022: Dejar una reseña estructurada
**Descripción:** Como Cliente, quiero calificar y comentar un pedido finalizado, para compartir mi experiencia con la comunidad.

**Criterios de Aceptación:**
1. **Estado:** Habilitado solo si el pedido está ENTREGADO o RECOGIDO.
2. **Seguridad:** Campo de texto sanitizado (sin scripts) y limitado a 280 caracteres.
3. **Datos:** Calificación obligatoria numérica entera entre 1 y 5.

---

## US-023: Ver reseñas pendientes (Admin)
**Descripción:** Como Administrador, quiero ver reseñas pendientes para moderarlas.

**Criterios de Aceptación:**
1. Lista de reseñas con estado "Pendiente" visible en sección de gestión.
2. Visualización de contenido completo y detalles del cliente al abrir.

---

## US-024: Aprobar u ocultar reseñas (Admin)
**Descripción:** Como Administrador, quiero aprobar u ocultar reseñas para controlar el contenido público.

**Criterios de Aceptación:**
1. Acción "Aprobar" hace visible la reseña públicamente.
2. Acción "Ocultar" retira la reseña de la vista pública.
3. Actualización correcta del estado en la lista tras la acción.

---

## US-025: Ver reseñas aprobadas
**Descripción:** Como Cliente, quiero ver reseñas aprobadas para informarme sobre productos.

**Criterios de Aceptación:**
1. Solo se visualizan reseñas con estado "Aprobada".
2. Se muestra comentario, calificación y nombre/alias.
3. Reseñas ocultas desaparecen de la vista al actualizar.

---

## US-026: Acceder a panel de reportes (Admin)
**Descripción:** Como Administrador, quiero visualizar estadísticas clave del negocio en un panel central.

**Criterios de Aceptación:**
1. Visualización de gráficos y métricas al entrar a "Reportes".
2. Carga de datos por defecto (ej. último mes).
3. Acceso denegado a usuarios sin rol de administrador.

---

## US-027: Filtrar reportes por fecha (Admin)
**Descripción:** Como Administrador, quiero filtrar reportes por rango de fechas para análisis específico.

**Criterios de Aceptación:**
1. Selección de "Fecha Desde" y "Fecha Hasta".
2. Actualización de métricas acorde al período seleccionado.
3. Mensaje de error ante rangos inválidos.

---

## US-028: Visualizar métricas financieras brutas
**Descripción:** Como Administrador, quiero ver el "Ingreso Total" en el dashboard, para monitorear el flujo de caja diario operativo.

**Criterios de Aceptación:**
1. **Fórmula:** Ingreso Total = $\sum (PrecioUnitario \times Cantidad)$ (Excluyendo impuestos/envío).
2. **Datos:** Mostrar $0.00 si no hay ventas (no mostrar vacío/error).
3. **Rendimiento:** Recálculo en $\le 1000ms$ al filtrar.

---

## US-029: Ver producto más destacado (Admin)
**Descripción:** Como Administrador, quiero identificar el producto más vendido para optimizar el menú.

**Criterios de Aceptación:**
1. Visualización del "Producto Más Destacado" por cantidad de unidades.
2. Actualización dinámica según el filtro de fechas.
3. Indicación "Ninguno" o "N/A" si no hay ventas.

---

## US-030: Exportar reportes a XLSX estandarizado
**Descripción:** Como Administrador, quiero descargar los datos de ventas en XLSX, para importarlos en herramientas externas sin errores.

**Criterios de Aceptación:**
1. **Archivo:** Nombre automático `reporte_ventas_YYYY-MM-DD.xlsx`.

---

## US-031: Ver tiempo de preparación en reportes (Admin)
**Descripción:** Como Administrador, quiero ver el tiempo promedio de preparación para identificar cuellos de botella.

**Criterios de Aceptación:**
1. Métrica de "Tiempo Promedio de Preparación" visible.
2. Cálculo actualizado según rango de fechas.
3. Indicación "N/A" si no hay pedidos completados.

---

## US-032: Visualizar nombres de productos completos (Admin)
**Descripción:** Como Administrador, quiero ver nombres completos en reportes para lectura clara.

**Criterios de Aceptación:**
1. Ajuste de columnas o tooltips para nombres largos.
2. Exportación a XLSX incluye nombres completos sin truncar.

---

## US-033: Cambiar idioma de la interfaz
**Descripción:** Como Usuario, quiero cambiar entre español e inglés para usar la app en mi idioma.

**Criterios de Aceptación:**
1. Selector de idioma permite elegir "Español" o "Inglés".
2. Textos, etiquetas y mensajes se actualizan al idioma elegido.
3. Persistencia de la selección al navegar.

---

## US-034: Contenerizar aplicación con Docker
**Descripción:** Como Desarrollador, quiero que microservicios y frontend usen Docker para facilitar despliegue.

**Criterios de Aceptación:**
1. `docker-compose up` levanta todos los servicios correctamente.
2. Servicios funcionan en nuevos entornos sin problemas de dependencias.
3. Reconstrucción aislada de imágenes por servicio.

---

## US-035: Comunicación asíncrona con RabbitMQ
**Descripción:** Como Desarrollador, quiero usar RabbitMQ entre microservicios para escalabilidad.

**Criterios de Aceptación:**
1. Microservicios suscritos reciben eventos publicados (ej. nuevo pedido).
2. Recuperación y procesamiento de mensajes tras fallo temporal.
3. Manejo de alto volumen sin degradación de comunicación.

---

## US-036: Mantener estándares de calidad de código
**Descripción:** Como Desarrollador, quiero que el pipeline de CI/CD valide el estilo de código, para prevenir deuda técnica.

**Criterios de Aceptación:**
1. **Linter:** Build falla si hay errores de ESLint (Standard/Airbnb).
2. **Complejidad:** Ninguna función con Complejidad Ciclomática > 10.
3. **Duplicidad:** Rechazo de cambios con >5% de código duplicado.

---

## US-037: Proteger contraseñas de usuario
**Descripción:** Como Usuario, quiero que mis contraseñas estén protegidas para garantizar seguridad.

**Criterios de Aceptación:**
1. Transmisión segura vía HTTPS.
2. Almacenamiento cifrado/hasheado en Firebase.
3. Contraseñas no visibles en texto plano para administradores.

---

## US-038: Alta cobertura de pruebas unitarias
**Descripción:** Como Desarrollador, quiero una alta cobertura de pruebas (mínimo 85%) para asegurar calidad.

**Criterios de Aceptación:**
1. Informe de cobertura muestra al menos 85%.
2. Detección de regresiones al ejecutar pruebas.
3. Nuevas funcionalidades incluyen sus respectivas pruebas.

---

## US-039: Manejo de errores centralizado
**Descripción:** Como Desarrollador, quiero manejo de errores centralizado para facilitar depuración.

**Criterios de Aceptación:**
1. Captura de errores propagados por manejador central.
2. Formato de respuesta de error consistente en frontend.
3. Logs claros y útiles registrados.

---

## US-040: Kitchen Service recibe notificación de modificación
**Descripción:** Como Kitchen Service, quiero notificación de modificaciones para evitar errores en cocina.

**Criterios de Aceptación:**
1. Recepción de mensaje RabbitMQ con detalles actualizados.
2. Actualización automática del pedido en panel de cocina.
3. Visualización clara de cambios para el personal.