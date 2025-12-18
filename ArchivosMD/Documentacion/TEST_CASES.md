**Documento Maestro de Pruebas: Delicious Kitchen**

**Fecha:** 2025-12-18
**Versión:** 2.0 - Actualizado con Mejoras Implementadas
**Estado:** Alineado con REFINED_BACKLOG.md (Principios INVEST)

**1. Alcance de las Pruebas**

Este documento define el alcance de las pruebas para la aplicación "Delicious Kitchen", cubriendo las funcionalidades descritas en las historias de usuario (US-001 a US-040) del REFINED_BACKLOG.md.

**Mejoras Implementadas en esta Versión:**
- ✅ Sincronización de estados entre microservicios vía RabbitMQ
- ✅ Sistema de notificaciones SSE completamente funcional
- ✅ Flujo de reseñas con validación de estados
- ✅ Iconos de timeline alineados con estados reales del proceso
- ✅ Manejo robusto de errores en API Gateway
- ✅ Consumers de eventos activados en Order Service

**1.1. Qué se va a Probar**

Las pruebas se enfocarán en verificar la correcta implementación y funcionamiento de las siguientes áreas y funcionalidades:

*   **Gestión de Pedidos del Cliente (FT-001):**
    *   Visualización del menú, productos, descripciones, precios e imágenes (US-001).
    *   Rendimiento de carga del menú (US-001).
    *   Añadir múltiples unidades del mismo producto y diferentes productos al carrito (US-002).
    *   Añadir notas personalizadas al pedido (US-003).
    *   Confirmación y envío de pedidos (US-004).
    *   Modificación de pedidos por parte del cliente antes de que la cocina comience a prepararlos (US-005).
    *   Cancelación de pedidos por parte del cliente antes de que la cocina comience a prepararlos (US-013).
    *   Recepción de confirmación de cancelación (US-014).

*   **Procesamiento de Pedidos en Cocina (FT-002):**
    *   Visualización de pedidos pendientes en el panel de cocina (US-006).
    *   Marcaje de pedidos como "Comenzar a cocinar" (US-007).
    *   Marcaje de pedidos como "Listo" (US-008).
    *   Recepción de notificaciones de nuevos pedidos vía RabbitMQ (US-011).
    *   Recepción de notificaciones de pedidos cancelados vía RabbitMQ (US-012).
    *   Recepción de notificaciones de modificaciones de pedidos vía RabbitMQ (US-040).
    *   **✅ MEJORA IMPLEMENTADA:** Kitchen Service publica eventos `order.preparing` y `order.ready` correctamente
    *   **✅ MEJORA IMPLEMENTADA:** Order Service consume eventos y actualiza estados en MongoDB
    *   **✅ MEJORA IMPLEMENTADA:** Sincronización completa: Kitchen (PREPARING/READY) → Order Service (preparing/ready)

*   **Notificaciones en Tiempo Real (FT-003):**
    *   Recepción de notificaciones para el cliente cuando el pedido está "En preparación" (US-009).
    *   Recepción de notificaciones para el cliente cuando el pedido está "Listo" (US-010).
    *   **✅ MEJORA IMPLEMENTADA:** Proxy SSE configurado en API Gateway (`notificationRoutes.ts`)
    *   **✅ MEJORA IMPLEMENTADA:** Frontend conectado vía `useNotification.js` hook
    *   **✅ MEJORA IMPLEMENTADA:** Manejo de eventos `order.preparing`, `order.ready`, `order.updated` en `OrderStatus.jsx`
    *   **✅ MEJORA IMPLEMENTADA:** Timeline de estados sincronizado con notificaciones SSE

*   **Autenticación y Gestión de Usuarios/Roles (FT-005):**
    *   Registro de nuevos usuarios (cliente) en la plataforma (US-015).
    *   Inicio de sesión con credenciales válidas y redirección por rol (US-016).
    *   Mantenimiento de sesión activa (US-021).
    *   Creación de nuevos usuarios (Admin) con roles específicos (US-017).
    *   Edición de roles de usuarios existentes (Admin) (US-018).
    *   Activación/desactivación de cuentas de usuario (Admin) (US-019).
    *   Visualización correcta de roles de usuario (Admin) (US-020).

*   **Gestión de Reseñas de Clientes (FT-006):**
    *   Dejar reseñas estructuradas para pedidos entregados/recogidos (US-022).
    *   Visualización de reseñas pendientes de moderación (Admin) (US-023).
    *   Aprobación u ocultamiento de reseñas (Admin) (US-024).
    *   Visualización de reseñas aprobadas por el cliente (US-025).
    *   **✅ MEJORA IMPLEMENTADA:** Modal de reseñas se muestra solo cuando `order.status === 'ready' || 'delivered'`
    *   **✅ MEJORA IMPLEMENTADA:** Review Service funcionando correctamente (verificado con curl)
    *   **✅ MEJORA IMPLEMENTADA:** Rutas de reviews configuradas en API Gateway con orden correcto
    *   **✅ PROBLEMA RESUELTO:** Reseñas no funcionaban porque Order Service no sincronizaba estados → Ahora funcional

*   **Generación de Reportes de Negocio (FT-007):**
    *   Acceso al panel de reportes (Admin) y visualización de estadísticas clave (US-026).
    *   Filtrado de reportes por rango de fechas (Admin) (US-027).
    *   Visualización de métricas de "Ingreso Total" (Admin) (US-028).
    *   Visualización del "Producto Más Destacado" por cantidad de unidades (Admin) (US-029).
    *   Exportación de reportes a CSV estandarizado (Admin) (US-030).
    *   Visualización del tiempo promedio de preparación en reportes (Admin) (US-031).
    *   Visualización de nombres completos de productos en reportes y exportación CSV (US-032).

*   **Internacionalización (FT-008):**
    *   Cambio de idioma de la interfaz de usuario y persistencia de la selección (US-033).

*   **Arquitectura y Despliegue (FT-009):**
    *   Correcta contenerización de microservicios y frontend con Docker y `docker-compose` (US-034).
    *   Funcionalidad y resiliencia de la comunicación asíncrona vía RabbitMQ (eventos, reintentos, DLQ) (US-035).
*   **Seguridad y Observabilidad (FT-010):**

    *   Protección de contraseñas de usuario (HTTPS, hashing, salting) (US-037).
    *   Cobertura de pruebas unitarias (mínimo 85%) (US-038).
    *   Manejo de errores centralizado (captura, formato consistente, logs claros) (US-039).
    *   Mantenimiento de estándares de calidad de código (ESLint, complejidad, duplicidad) (US-036).

**1.2. Qué NO se va a Probar (Exclusiones)**

Las siguientes funcionalidades o aspectos no serán parte del alcance de las pruebas en esta iteración, ya sea por ser mejoras futuras o no ser aplicables según los criterios de aceptación:

*   **Paginación/Carga diferida avanzada:** Para la visualización de productos en categorías con más de 20 productos (US-001, Criterio 2), solo se probará que el *payload inicial* sea menor a 500KB. La implementación completa de paginación o carga diferida para la UX no es un criterio de aceptación explícito para esta fase.

*   **Filtros/Búsqueda de reseñas:** Funcionalidad avanzada para el administrador (US-023).

*   **Manejo de empate entre productos destacados:** En los reportes de negocio (US-029, Criterio 1), no se probará cómo se resuelve un empate si varios productos tienen la misma cantidad de unidades vendidas.

*   **Granularidad de tiempo de preparación:** Métricas de tiempo de preparación más allá de minutos/horas/segundos (US-031).

*   **Políticas de contraseñas fuertes:** Implementación de reglas específicas para la complejidad de contraseñas (US-037). Solo se verificará HTTPS, hashing/salting y no visibilidad para administradores.

*   **Sistema de pago:** No se probará ningún sistema de pago, ya que no se menciona en las historias de usuario.

*   **Registro de auditoría:** Aunque es una buena práctica, no es un criterio de aceptación actual para la activación/desactivación de cuentas (US-019).

**2. Entorno de Pruebas**

El entorno de pruebas será una réplica lo más cercana posible al entorno de producción, con las siguientes características:

*   **Contenerización:** La aplicación completa (microservicios y frontend) se desplegará utilizando Docker y `docker-compose`. Esto asegura la consistencia y reproducibilidad del entorno, validando US-034.

*   **Orquestación de Mensajes:** Se utilizará RabbitMQ para la comunicación asíncrona entre microservicios. El ambiente de pruebas incluirá una instancia de RabbitMQ configurada con los exchanges, queues y bindings definidos. Se considerará el monitoreo de RabbitMQ para validar US-035.

*   **Base de Datos y Autenticación:** Se utilizará Firebase para la autenticación y gestión de usuarios (US-015, US-016, US-017). La base de datos subyacente (no especificada, pero implícita para productos, pedidos, reseñas) contendrá datos de prueba representativos.

*   **Datos de Prueba:** Se dispondrá de un conjunto de datos de prueba robusto y realista que cubra diversos escenarios:
    *   Productos con diferentes categorías, precios, descripciones (incluyendo alérgenos), y algunos con nombres largos para US-032.
    *   Múltiples usuarios con diferentes roles (cliente, cocina, administrador) para US-017, US-018, US-020.
    *   Pedidos en varios estados (pendientes, en preparación, listos, modificados, cancelados) para US-004, US-005, US-006, US-007, US-008, US-013.
    *   Reseñas con diferentes calificaciones y estados (pendientes, aprobadas, ocultas) para US-022, US-023, US-024, US-025.
    *   Datos históricos suficientes para la generación de reportes (US-026, US-027, US-028, US-029, US-031).
    *   Datos para pruebas de internacionalización (textos en Español e Inglés) para US-033.

*   **Servicios Externos/Integraciones:** Se configurarán los servicios de Order Service, Kitchen Service y Notification Service. En caso de dependencias externas no controladas, se considerará el uso de stubs o mocks para aislar las pruebas.

*   **Logging y Monitoreo:** El entorno incluirá la configuración de un sistema de logging centralizado (ej. Elasticsearch, CloudWatch) y herramientas de monitoreo de errores (ej. Sentry, DataDog) para simular el entorno de producción y facilitar la depuración, validando US-039.

*   **Recursos:** Se definirán los requisitos mínimos de CPU/RAM para el entorno de pruebas Docker, asegurando un rendimiento adecuado para las ejecuciones de pruebas.

**3. Estrategia de Pruebas**

La estrategia de pruebas adoptará un enfoque integral, combinando diferentes tipos de pruebas para asegurar la calidad del software.

**3.1. Tipos de Pruebas**

*   **Pruebas Unitarias:**

    *   **Objetivo:** Verificar la funcionalidad de componentes individuales de la aplicación.

    *   **Cobertura:** Se buscará una alta cobertura de pruebas unitarias (mínimo 85%) para el frontend y backend, validando US-038.

    *   **Herramientas:** Se utilizarán Jest y React Testing Library para el frontend, y Supertest para las APIs del backend.

    *   **Integración:** Las pruebas unitarias serán parte del pipeline de integración continua (CI/CD).

*   **Pruebas de Integración:**

    *   **Objetivo:** Verificar la comunicación y el correcto funcionamiento entre los diferentes microservicios, con RabbitMQ (US-035), Firebase y otros servicios internos (Order Service, Kitchen Service, Notification Service).

    *   **Enfoque:** Se probarán los flujos de eventos asíncronos (US-011, US-012, US-040), la persistencia de datos a través de servicios y la correcta interacción entre el frontend y el backend.

*   **Pruebas Funcionales (Manuales y Automatizadas):**

    *   **Objetivo:** Asegurar que cada historia de usuario y sus criterios de aceptación se cumplen correctamente.

    *   **Automatizadas:** Se priorizará la automatización de pruebas funcionales críticas y de regresión para los flujos principales de la aplicación (ej. creación de pedido, registro de usuario, marcaje de pedidos).

    *   **Manuales:** Se realizarán pruebas manuales exploratorias, de usabilidad (UI/UX) y para escenarios complejos o de difícil automatización, especialmente en las interfaces de usuario de cliente y administrador (US-001, US-003, US-005, US-006, US-013, US-017, US-018, US-020, US-022, US-023, US-024, US-025, US-026, US-032).

*   **Pruebas de Regresión:**

    *   **Objetivo:** Confirmar que los cambios o nuevas funcionalidades no han introducido defectos en áreas existentes.

    *   **Enfoque:** Se ejecutarán suites de pruebas automatizadas después de cada integración significativa o despliegue.

*   **Pruebas de Rendimiento y Carga:**
    *   **Objetivo:** Evaluar la capacidad de respuesta y estabilidad del sistema bajo diferentes cargas de trabajo.

    *   **Enfoque:** Se realizarán pruebas para identificar cuellos de botella en la carga de productos (US-001), el panel de reportes (US-028, US-029, US-031) y la gestión de pedidos, así como la escalabilidad y resiliencia de la comunicación asíncrona (US-035).

*   **Pruebas de Seguridad:**
    *   **Objetivo:** Identificar vulnerabilidades y asegurar la protección de datos sensibles.

    *   **Enfoque:** Se verificarán las implementaciones de HTTPS, el hashing y salting de contraseñas (US-037), y se considerará la realización de una auditoría de seguridad o un pentest para evaluar la protección de contraseñas y otros aspectos de seguridad. Se incluirá la sanitización de entradas (ej. US-003, US-022).

*   **Pruebas de Internacionalización (i18n):**
    *   **Objetivo:** Asegurar que la aplicación soporta correctamente múltiples idiomas y formatos culturales.

    *   **Enfoque:** Se probará el cambio de idioma, la visualización de textos, mensajes y el manejo de caracteres especiales en diferentes idiomas (US-033).

*   **Pruebas de Manejo de Errores:**

    *   **Objetivo:** Verificar que el sistema maneja los errores de manera robusta y proporciona feedback claro al usuario y al administrador.

    *   **Enfoque:** Se probarán escenarios de errores comunes (validación, autenticación, autorización, errores de base de datos, errores de servicios externos) y se verificará el formato estándar de las respuestas de error y el registro de logs (US-039).

*   **Pruebas de Calidad de Código:**

    *   **Objetivo:** Asegurar que el código cumple con los estándares de calidad definidos.

    *   **Enfoque:** Se utilizarán herramientas como ESLint y Prettier para el análisis estático de código, se realizarán revisiones de código (Code Reviews) y se verificará la existencia y calidad de la documentación (JSDoc, READMEs), validando US-036.

**3.2. Proceso de Pruebas**

*   **Integración Continua (CI):** Las pruebas unitarias y algunas pruebas de integración automatizadas se ejecutarán automáticamente en cada push al repositorio de código.

*   **Despliegue Continuo (CD):** Una vez que las pruebas de CI pasen, el código se desplegará en un entorno de pruebas para la ejecución de pruebas funcionales y de regresión más extensas.

*   **Ciclos de Feedback:** Se establecerán ciclos de feedback rápidos entre desarrollo y QA para resolver defectos de manera eficiente.

*   **Gestión de Defectos:** Se utilizará un sistema de seguimiento de defectos para registrar, priorizar y gestionar los errores encontrados.

**3.3. Casos de Prueba de Mejoras Implementadas (2025-12-18)**

Esta sección documenta los casos de prueba específicos para verificar las mejoras implementadas durante la sesión de debugging y optimización.

---

**✅ TC-MEJORA-001: Sincronización de Estados entre Microservicios**

*   **Historia Relacionada:** US-007, US-008, US-011
*   **Descripción:** Verificar que cuando Kitchen Service marca un pedido como "PREPARING" o "READY", el Order Service actualiza su estado correctamente.
*   **Precondiciones:**
    1. RabbitMQ está corriendo y accesible
    2. Order Service está consumiendo eventos de RabbitMQ
    3. Kitchen Service está publicando eventos correctamente
*   **Pasos de Prueba:**
    1. Crear un pedido nuevo vía POST `/orders`
    2. Verificar que el pedido tiene estado `pending` en Order Service
    3. Marcar el pedido como "start-preparing" en Kitchen Service: POST `/kitchen/orders/{id}/start-preparing`
    4. Verificar que Order Service actualiza el estado a `preparing`
    5. Marcar el pedido como "ready" en Kitchen Service: POST `/kitchen/orders/{id}/ready`
    6. Verificar que Order Service actualiza el estado a `ready`
*   **Resultado Esperado:**
    - Estados sincronizados: Kitchen (PREPARING) → Order (`preparing`)
    - Estados sincronizados: Kitchen (READY) → Order (`ready`)
    - Logs de Order Service muestran: "✅ Pedido {orderNumber} actualizado a estado PREPARING/READY"
*   **Estado:** ✅ VALIDADO (2025-12-18)

---

**✅ TC-MEJORA-002: Notificaciones SSE en Tiempo Real**

*   **Historia Relacionada:** US-009, US-010
*   **Descripción:** Verificar que el frontend recibe notificaciones SSE cuando cambia el estado del pedido.
*   **Precondiciones:**
    1. Notification Service está corriendo en puerto 3003
    2. API Gateway tiene ruta `/notifications/stream` configurada
    3. Frontend está conectado vía `useNotification.js`
*   **Pasos de Prueba:**
    1. Abrir página de seguimiento de pedido en el navegador
    2. Verificar conexión SSE en Network tab (EventSource)
    3. Desde backend, cambiar estado del pedido a "preparing"
    4. Verificar que frontend recibe evento `order.preparing`
    5. Verificar que se muestra modal informativo en UI
    6. Cambiar estado del pedido a "ready"
    7. Verificar que frontend recibe evento `order.ready`
    8. Verificar que se muestra modal "Ready for Pickup" con botón "Add Review"
*   **Resultado Esperado:**
    - Conexión SSE establecida exitosamente
    - Eventos recibidos en tiempo real (< 1 segundo)
    - Modales se muestran automáticamente según el evento
    - Estado del pedido se actualiza en UI sin refresh manual
*   **Estado:** ✅ VALIDADO (2025-12-18)

---

**✅ TC-MEJORA-003: Flujo Completo de Reseñas**

*   **Historia Relacionada:** US-022
*   **Descripción:** Verificar que el cliente puede agregar una reseña cuando el pedido está en estado "ready".
*   **Precondiciones:**
    1. Pedido existe con estado `ready` en Order Service
    2. Review Service está corriendo en puerto 3004
    3. API Gateway tiene rutas `/reviews` configuradas
*   **Pasos de Prueba:**
    1. Cliente navega a página de estado del pedido
    2. Verificar que pedido muestra estado "Ready for Pickup"
    3. Click en botón "Add Review" en el modal de "Ready"
    4. Verificar que se abre `ReviewModal`
    5. Completar formulario: rating (1-5), comentario (max 280 chars)
    6. Submit reseña
    7. Verificar POST request a `/reviews` con status 200
    8. Verificar que reseña se guarda con estado "pending"
*   **Resultado Esperado:**
    - Modal de reseñas solo se muestra si `order.status === 'ready' || 'delivered'`
    - Formulario valida campos correctamente
    - Reseña se envía exitosamente a Review Service
    - Sanitización de comentario aplicada (sin scripts)
    - Usuario recibe confirmación visual de éxito
*   **Estado:** ✅ VALIDADO (2025-12-18)
*   **Nota:** Problema previo resuelto: Reseñas no funcionaban porque Order Service no sincronizaba estados correctamente.

---

**✅ TC-MEJORA-004: Timeline de Estados Dinámico**

*   **Historia Relacionada:** US-006, US-007, US-008
*   **Descripción:** Verificar que los iconos del timeline en OrderStatus se actualizan correctamente según el estado real del pedido.
*   **Precondiciones:**
    1. OrderStatus.jsx actualizado con lógica de estados condicionales
*   **Pasos de Prueba:**
    1. Crear pedido nuevo (estado `pending`)
    2. Verificar en UI:
       - Paso 1 "Received": Activo (icono `receipt_long`)
       - Paso 2 "Being Prepared": Inactivo (gris)
       - Paso 3 "Ready": Inactivo (gris)
    3. Marcar pedido como "preparing" desde Kitchen
    4. Verificar en UI:
       - Paso 1 "Received": Activo con `check`
       - Paso 2 "Being Prepared": Activo con animación ping (icono `soup_kitchen`)
       - Paso 3 "Ready": Inactivo
    5. Marcar pedido como "ready" desde Kitchen
    6. Verificar en UI:
       - Paso 1 "Received": Activo con `check`
       - Paso 2 "Being Prepared": Activo con `check`
       - Paso 3 "Ready": Activo (icono `check`)
*   **Resultado Esperado:**
    - Estados visuales alineados con estados reales del backend
    - `isReceived` = true cuando status >= 'pending'
    - `isBeingPrepared` = true cuando status >= 'preparing'
    - `isReadyForPickup` = true cuando status >= 'ready'
    - No más iconos hardcoded siempre activos
*   **Estado:** ✅ VALIDADO (2025-12-18)

---

**✅ TC-MEJORA-005: Manejo de Errores en API Gateway**

*   **Historia Relacionada:** US-039
*   **Descripción:** Verificar que el API Gateway maneja errores correctamente y retorna mensajes descriptivos.
*   **Precondiciones:**
    1. API Gateway configurado con try-catch en todas las rutas
*   **Pasos de Prueba:**
    1. Intentar crear reseña con orderId inválido
    2. Verificar respuesta 404 o 400 con mensaje claro
    3. Intentar acceder a endpoint cuando Review Service está caído
    4. Verificar respuesta 500 con mensaje "Error al crear reseña"
    5. Verificar logs en consola del API Gateway con mensajes descriptivos
*   **Resultado Esperado:**
    - Errores capturados en bloques try-catch
    - Respuestas con formato consistente: `{ success: false, message: "..." }`
    - Status codes apropiados (400, 404, 500)
    - Logs claros que facilitan debugging
*   **Estado:** ✅ VALIDADO (2025-12-18)

---

**✅ TC-MEJORA-006: Consumers de RabbitMQ Activos**

*   **Historia Relacionada:** US-035
*   **Descripción:** Verificar que Order Service se suscribe correctamente a eventos de RabbitMQ al iniciar.
*   **Precondiciones:**
    1. RabbitMQ está corriendo
    2. Order Service reiniciado recientemente
*   **Pasos de Prueba:**
    1. Revisar logs de Order Service al iniciar
    2. Verificar mensaje: "📥 RabbitMQ conectado - Consumiendo eventos: order.preparing, order.ready"
    3. Publicar evento `order.preparing` manualmente vía RabbitMQ Management
    4. Verificar que Order Service procesa el evento y actualiza el pedido
    5. Verificar logs: "👨‍🍳 Actualizando estado del pedido {id} a PREPARING"
*   **Resultado Esperado:**
    - Consumers se suscriben al inicio del servicio
    - Eventos se procesan correctamente
    - Pedidos se actualizan en MongoDB
    - Logs indican procesamiento exitoso
*   **Estado:** ✅ VALIDADO (2025-12-18)
*   **Nota:** Problema resuelto: Order Service no estaba consumiendo eventos → Requirió reinicio con `docker-compose restart order-service`

---

**4. Casos de Prueba Específicos**

A continuación, se presentan casos de prueba detallados para algunas de las historias de usuario clave, cubriendo escenarios positivos, negativos y de borde.

---

**Historia de Usuario 1 (US-001): Visualizar menú y tiempos de carga**

*   **ID:** TC-US001-001 (Positivo)
*   **Descripción:** Verificar que el cliente puede visualizar el menú completo con productos, descripciones, precios e imágenes.

*   **Pasos:**
    1.  Iniciar sesión como cliente.
    2.  Navegar a la sección del menú.
    3.  Verificar que se muestra una lista de productos con sus nombres, descripciones, precios e imágenes.
    4.  Verificar que el botón "Añadir" está visible para cada producto.

*   **Datos de Entrada:**
    *   Usuario: Cliente registrado y autenticado.
    *   Menú: Contiene al menos 5 productos con detalles completos (nombre, descripción, precio, imagen).

*   **Resultado Esperado:** El menú se muestra correctamente, con todos los detalles de los productos y el botón "Añadir" visible.

*   **ID:** TC-US001-002 (Borde - Rendimiento)
*   **Descripción:** Verificar que el renderizado del listado de productos no excede 2.5 segundos en red 4G simulada.

*   **Pasos:**
    1.  Configurar el navegador para simular una red 4G lenta.
    2.  Iniciar sesión como cliente.
    3.  Navegar a la sección del menú.
    4.  Medir el tiempo de carga y renderizado completo del listado de productos.

*   **Datos de Entrada:**
    *   Usuario: Cliente registrado y autenticado.
    *   Menú: Contiene un número representativo de productos (ej. 15-20).
    *   Simulación de red: 4G (ej. usando herramientas de desarrollo del navegador).

*   **Resultado Esperado:** El listado de productos se renderiza completamente en menos de 2.5 segundos.

*   **ID:** TC-US001-003 (Borde - Carga diferida)
*   **Descripción:** Verificar que el payload inicial para categorías con más de 20 productos es menor a 500KB.

*   **Pasos:**
    1.  Acceder a la aplicación como cliente.
    2.  Abrir las herramientas de desarrollo del navegador (pestaña Network).
    3.  Navegar a una categoría que contenga más de 20 productos.
    4.  Monitorear el tamaño del payload inicial de la solicitud de productos para esa categoría.
*   **Datos de Entrada:**
    *   Usuario: Cliente registrado y autenticado.
    *   Categoría: "Pizzas" con 25 productos.
*   **Resultado Esperado:** El tamaño del payload inicial de la solicitud de productos para la categoría "Pizzas" es menor a 500KB.

---

**Historia de Usuario 3 (US-003): Añadir notas personalizadas al pedido**

*   **ID:** TC-US003-001 (Positivo)
*   **Descripción:** Verificar que el cliente puede añadir una nota personalizada a un producto en el pedido y que esta es visible para el personal de cocina.
*   **Pasos:**
    1.  Iniciar sesión como cliente.
    2.  Añadir "Hamburguesa Clásica" al carrito.
    3.  Hacer clic en la opción para añadir nota personalizada al producto.
    4.  Introducir la nota: "Sin cebolla, por favor".
    5.  Confirmar y enviar el pedido.
    6.  (Verificación interna/Cocina) Iniciar sesión como personal de cocina.
    7.  Navegar al panel de pedidos pendientes y abrir los detalles del pedido recién creado.
    8.  Verificar que la nota "Sin cebolla, por favor" es visible en los detalles del producto.

*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.notas@example.com`
    *   Producto: "Hamburguesa Clásica"
    *   Nota: "Sin cebolla, por favor"
*   **Resultado Esperado:** La nota se guarda correctamente con el producto en el pedido y es visible para el personal de cocina en los detalles del pedido.

*   **ID:** TC-US003-002 (Negativo)
*   **Descripción:** Verificar que el campo de notas sanitiza entradas maliciosas (ej. scripts) y no permite la inyección de código.
*   **Pasos:**
    1.  Iniciar sesión como cliente.
    2.  Añadir un producto al carrito.
    3.  Intentar añadir una nota con un script: `<script>alert('XSS');</script>`.
    4.  Confirmar y enviar el pedido.
    5.  (Verificación interna/Cocina) Iniciar sesión como personal de cocina y abrir los detalles del pedido.
    6.  Verificar que el script no se ejecuta y que el texto se muestra como texto plano o sanitizado.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.seguridad@example.com`
    *   Producto: "Ensalada César"
    *   Nota: `<script>alert('XSS');</script>`
*   **Resultado Esperado:** El script no se ejecuta. La nota se muestra como texto plano o sanitizado, sin comprometer la seguridad de la interfaz de cocina.

---

**Historia de Usuario 5 (US-005): Modificar pedido antes de preparación**

*   **ID:** TC-US005-001 (Positivo)
*   **Descripción:** Verificar que el cliente puede modificar un pedido pendiente (no "En preparación") y que los cambios se reflejan correctamente.
*   **Pasos:**
    1.  Iniciar sesión como cliente.
    2.  Realizar un pedido (ej. P-001: "Pizza Margarita" x1).
    3.  Navegar a la sección de "Mis Pedidos".
    4.  Localizar el pedido P-001 y verificar que la opción "Modificar Pedido" está visible.
    5.  Hacer clic en "Modificar Pedido".
    6.  Cambiar la cantidad de "Pizza Margarita" a 2 y añadir "Refresco" x1.
    7.  Confirmar la modificación.
    8.  Verificar que el pedido P-001 en "Mis Pedidos" ahora muestra los productos actualizados.
    9.  (Verificación interna/Cocina) Iniciar sesión como personal de cocina y verificar que el pedido P-001 se actualiza con los nuevos detalles y que se recibe una notificación de modificación.

*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.modifica@example.com`
    *   Pedido Inicial: P-001 ("Pizza Margarita" x1, estado "Pendiente").
    *   Modificación: "Pizza Margarita" a x2, añadir "Refresco" x1.
    
*   **Resultado Esperado:** El pedido se modifica exitosamente. El cliente ve los cambios reflejados. Order Service actualiza el pedido y Kitchen Service recibe una notificación de la modificación con los detalles actualizados.

*   **ID:** TC-US005-002 (Negativo)
*   **Descripción:** Verificar que el cliente NO puede modificar un pedido que ya está "En preparación".
*   **Pasos:**
    1.  (Precondición) Un cliente realiza un pedido (ej. P-002).
    2.  (Precondición) El personal de cocina marca el pedido P-002 como "Comenzar a cocinar".
    3.  Iniciar sesión como cliente.
    4.  Navegar a la sección de "Mis Pedidos".
    5.  Localizar el pedido P-002 (estado "En preparación").
    6.  Verificar que la opción "Modificar Pedido" NO está visible o está deshabilitada.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.no_modifica@example.com`
    *   Pedido: P-002 (estado "En preparación").
*   **Resultado Esperado:** La opción "Modificar Pedido" no es visible o está deshabilitada para el pedido P-002, impidiendo al cliente realizar cambios.

---

**Historia de Usuario 13 (US-013): Cancelar un pedido**

*   **ID:** TC-US013-001 (Positivo)
*   **Descripción:** Verificar que un cliente puede cancelar un pedido pendiente (no "En preparación") y recibe confirmación.
*   **Pasos:**
    1.  Iniciar sesión como cliente.
    2.  Realizar un pedido (ej. P-003: "Pasta Carbonara" x1).
    3.  Navegar a la sección de "Mis Pedidos".
    4.  Localizar el pedido P-003 y verificar que la opción "Cancelar Pedido" está visible.
    5.  Hacer clic en "Cancelar Pedido" y confirmar la acción.
    6.  Verificar que se muestra una notificación de cancelación exitosa (US-014).
    7.  Verificar que el pedido P-003 se elimina o marca como "Cancelado" en la lista de pedidos del cliente.
    8.  (Verificación interna/Cocina) Iniciar sesión como personal de cocina y verificar que el pedido P-003 se elimina o marca como "Cancelado" en el panel de cocina y que se recibe una notificación de cancelación.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.cancela@example.com`
    *   Pedido: P-003 ("Pasta Carbonara" x1, estado "Pendiente").
*   **Resultado Esperado:** El pedido P-003 se cancela exitosamente. El cliente recibe una confirmación. El pedido se actualiza a "Cancelado" en la interfaz del cliente y de la cocina. Kitchen Service recibe la notificación y actualiza su panel.

*   **ID:** TC-US013-002 (Negativo)
*   **Descripción:** Verificar que el cliente NO puede cancelar un pedido que ya está "En preparación".
*   **Pasos:**
    1.  (Precondición) Un cliente realiza un pedido (ej. P-004).
    2.  (Precondición) El personal de cocina marca el pedido P-004 como "Comenzar a cocinar".
    3.  Iniciar sesión como cliente.
    4.  Navegar a la sección de "Mis Pedidos".
    5.  Localizar el pedido P-004 (estado "En preparación").
    6.  Verificar que la opción "Cancelar Pedido" NO está visible o está deshabilitada.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.no_cancela@example.com`
    *   Pedido: P-004 (estado "En preparación").
*   **Resultado Esperado:** La opción "Cancelar Pedido" no es visible o está deshabilitada para el pedido P-004, impidiendo al cliente cancelarlo.

---

**Historia de Usuario 18 (US-018): Editar roles de usuarios (Admin)**

*   **ID:** TC-US018-001 (Positivo)
*   **Descripción:** Verificar que un administrador puede cambiar el rol de un usuario y que los permisos se actualizan en la siguiente sesión.
*   **Pasos:**
    1.  Iniciar sesión como Administrador.
    2.  Navegar a la sección de "Gestión de Usuarios".
    3.  Localizar al usuario `cocinero.antiguo@example.com` (rol actual: Cocina).
    4.  Editar el perfil del usuario y cambiar su rol a "Cliente".
    5.  Guardar los cambios.
    6.  Cerrar sesión como Administrador.
    7.  Iniciar sesión como `cocinero.antiguo@example.com`.
    8.  Verificar que el usuario es redirigido a la interfaz de cliente y no tiene acceso a las funcionalidades de cocina.
*   **Datos de Entrada:**
    *   Usuario Admin: `admin@example.com`
    *   Usuario a modificar: `cocinero.antiguo@example.com` (rol "Cocina").
    *   Nuevo rol: "Cliente".
*   **Resultado Esperado:** El rol del usuario `cocinero.antiguo@example.com` se actualiza a "Cliente". Al iniciar sesión, el usuario accede a la interfaz de cliente y sus permisos se corresponden con el nuevo rol.

*   **ID:** TC-US018-002 (Negativo)
*   **Descripción:** Verificar que el administrador no puede asignar un rol inválido o inexistente.
*   **Pasos:**
    1.  Iniciar sesión como Administrador.
    2.  Navegar a la sección de "Gestión de Usuarios".
    3.  Localizar un usuario (ej. `cliente.ejemplo@example.com`).
    4.  Intentar editar el perfil y asignar un rol que no existe (ej. "Supervisor" o un valor numérico/cadena no mapeado).
    5.  Intentar guardar los cambios.
*   **Datos de Entrada:**
    *   Usuario Admin: `admin@example.com`
    *   Usuario a modificar: `cliente.ejemplo@example.com`
    *   Rol inválido: "Supervisor"
*   **Resultado Esperado:** El sistema muestra un mensaje de error indicando que el rol es inválido y no permite guardar los cambios.

---

**Historia de Usuario 22 (US-022): Dejar una reseña estructurada**

*   **ID:** TC-US022-001 (Positivo)
*   **Descripción:** Verificar que un cliente puede dejar una reseña válida (calificación y comentario) para un pedido "ENTREGADO" o "RECOGIDO".
*   **Pasos:**
    1.  (Precondición) Un cliente ha completado un pedido (ej. P-005) y su estado es "ENTREGADO".
    2.  Iniciar sesión como cliente.
    3.  Navegar a la sección de "Historial de Pedidos".
    4.  Localizar el pedido P-005 y hacer clic en la opción "Dejar Reseña".
    5.  Introducir una calificación numérica (ej. 5 estrellas) y un comentario (ej. "¡Excelente comida y servicio rápido!").
    6.  Enviar la reseña.
    7.  Verificar que la reseña se envía exitosamente y aparece como "Pendiente" o se muestra un mensaje de confirmación.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.reseña@example.com`
    *   Pedido: P-005 (estado "ENTREGADO").
    *   Calificación: 5.
    *   Comentario: "¡Excelente comida y servicio rápido!"
*   **Resultado Esperado:** La reseña se envía correctamente, cumple con los criterios de longitud y calificación, y está pendiente de aprobación por el administrador.

*   **ID:** TC-US022-002 (Negativo)
*   **Descripción:** Verificar que el cliente NO puede dejar una reseña para un pedido que NO está en estado "ENTREGADO" o "RECOGIDO".
*   **Pasos:**
    1.  (Precondición) Un cliente tiene un pedido (ej. P-006) en estado "EN PREPARACIÓN".
    2.  Iniciar sesión como cliente.
    3.  Navegar a la sección de "Historial de Pedidos".
    4.  Localizar el pedido P-006.
    5.  Verificar que la opción "Dejar Reseña" NO está visible o está deshabilitada.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.no_reseña@example.com`
    *   Pedido: P-006 (estado "EN PREPARACIÓN").
*   **Resultado Esperado:** La opción para dejar reseña no es visible o está deshabilitada para el pedido P-006.

*   **ID:** TC-US022-003 (Negativo - Validación)
*   **Descripción:** Verificar que el campo de texto de la reseña tiene un límite de 280 caracteres y sanitiza scripts.
*   **Pasos:**
    1.  (Precondición) Un cliente ha completado un pedido (ej. P-007) y su estado es "ENTREGADO".
    2.  Iniciar sesión como cliente.
    3.  Navegar a la opción "Dejar Reseña" para P-007.
    4.  Introducir una calificación (ej. 4).
    5.  Introducir un comentario con más de 280 caracteres (ej. copiar un párrafo largo) y/o con un script (ej. `<script>alert('XSS');</script>`).
    6.  Intentar enviar la reseña.
*   **Datos de Entrada:**
    *   Usuario Cliente: `cliente.reseña_larga@example.com`
    *   Pedido: P-007 (estado "ENTREGADO").
    *   Calificación: 4.
    *   Comentario: Un texto de 300 caracteres o `<script>alert('XSS');</script>`.
*   **Resultado Esperado:** Si el comentario excede los 280 caracteres, se muestra un mensaje de error de validación y no se permite el envío. Si contiene un script, este se sanitiza y no se ejecuta, o se rechaza el envío.

---

**Historia de Usuario 27 (US-027): Filtrar reportes por fecha (Admin)**

*   **ID:** TC-US027-001 (Positivo)
*   **Descripción:** Verificar que el administrador puede filtrar reportes por un rango de fechas válido y que las métricas se actualizan.
*   **Pasos:**
    1.  Iniciar sesión como Administrador.
    2.  Navegar al "Panel de Reportes".
    3.  Seleccionar "Fecha Desde": 2025-11-01.
    4.  Seleccionar "Fecha Hasta": 2025-11-30.
    5.  Hacer clic en "Aplicar Filtro".
    6.  Verificar que las métricas (órdenes totales, ingresos, etc.) se actualizan para reflejar solo los datos de noviembre de 2025.
*   **Datos de Entrada:**
    *   Usuario Admin: `admin@example.com`
    *   Fecha Desde: 2025-11-01
    *   Fecha Hasta: 2025-11-30
*   **Resultado Esperado:** El panel de reportes muestra las métricas actualizadas, correspondientes únicamente al rango de fechas seleccionado.

*   **ID:** TC-US027-002 (Negativo)
*   **Descripción:** Verificar que el sistema muestra un mensaje de error si "Fecha Desde" es posterior a "Fecha Hasta".
*   **Pasos:**
    1.  Iniciar sesión como Administrador.
    2.  Navegar al "Panel de Reportes".
    3.  Seleccionar "Fecha Desde": 2025-12-15.
    4.  Seleccionar "Fecha Hasta": 2025-12-01.
    5.  Hacer clic en "Aplicar Filtro".
*   **Datos de Entrada:**
    *   Usuario Admin: `admin@example.com`
    *   Fecha Desde: 2025-12-15
    *   Fecha Hasta: 2025-12-01
*   **Resultado Esperado:** Se muestra un mensaje de error claro indicando que "Fecha Desde" no puede ser posterior a "Fecha Hasta", y los reportes no se actualizan con el filtro inválido.

*   **ID:** TC-US027-003 (Borde)
*   **Descripción:** Verificar el comportamiento cuando el rango de fechas seleccionado no contiene datos.
*   **Pasos:**
    1.  Iniciar sesión como Administrador.
    2.  Navegar al "Panel de Reportes".
    3.  Seleccionar un rango de fechas en el que se sabe que no hubo pedidos (ej. "Fecha Desde": 2024-01-01, "Fecha Hasta": 2024-01-31).
    4.  Hacer clic en "Aplicar Filtro".
*   **Datos de Entrada:**
    *   Usuario Admin: `admin@example.com`
    *   Fecha Desde: 2024-01-01
    *   Fecha Hasta: 2024-01-31
*   **Resultado Esperado:** Las métricas de los reportes muestran $0.00 o "N/A" para los valores numéricos y un mensaje indicando que no hay datos para el período seleccionado, sin errores en la interfaz.

---

**Historia de Usuario 37 (US-037): Proteger contraseñas de usuario**

*   **ID:** TC-US037-001 (Seguridad - Conceptual)
*   **Descripción:** Verificar que la transmisión de contraseñas de usuario se realiza de forma segura mediante HTTPS.
*   **Pasos:**
    1.  Acceder a la aplicación a través de una conexión HTTP (si es posible, o simular un ataque Man-in-the-Middle).
    2.  Intentar iniciar sesión o registrar un nuevo usuario.
    3.  Monitorear el tráfico de red.
*   **Datos de Entrada:**
    *   Credenciales de usuario.
*   **Resultado Esperado:** La aplicación fuerza el uso de HTTPS para todas las comunicaciones que involucran credenciales. Si se intenta HTTP, la conexión debe ser redirigida a HTTPS o rechazada. Las contraseñas no deben ser visibles en texto plano en el tráfico de red.

*   **ID:** TC-US037-002 (Seguridad - Conceptual)
*   **Descripción:** Verificar que las contraseñas se almacenan cifradas/hasheadas con salting en Firebase y no son visibles en texto plano para administradores.

*   **Pasos:**
    1.  Registrar un nuevo usuario.
    2.  (Verificación interna/Acceso a Firebase) Acceder a la consola de Firebase o a la base de datos de usuarios.
    3.  Localizar el registro del usuario recién creado.
    4.  Verificar el formato de la contraseña almacenada.
    5.  Iniciar sesión como administrador en la aplicación.
    6.  Navegar a la gestión de usuarios y ver los detalles del usuario.
*   **Datos de Entrada:**
    *   Usuario: `usuario.seguro@example.com`
    *   Contraseña: `MiContraseñaSegura123`
*   **Resultado Esperado:** En Firebase, la contraseña no debe ser visible en texto plano, sino como un hash (ej. SHA-256, bcrypt) con un salt. En la interfaz de administración, la contraseña no debe ser mostrada en texto plano a ningún administrador.
