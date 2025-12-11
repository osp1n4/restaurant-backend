
# HU-01: Acceso Administrador Gestión Personal

> **como** Administrador,
> **quiero** acceder de forma segura a la sección de Gestión de Personal solo si mi cuenta tiene el rol Administrador,
> **para** proteger los datos sensibles de personal y evitar accesos no autorizados, usando autenticación conectada a Restaurant Firebase.

**Descripción y contexto:**
La sección de Gestión de Personal contiene información crítica para la operación del restaurante, como datos de empleados, horarios y permisos. Es fundamental que este panel sea accesible únicamente por administradores autenticados para mitigar riesgos de fuga de información y garantizar el cumplimiento de políticas internas de seguridad. El proceso de autenticación y autorización se realiza a través de Restaurant Firebase, asegurando que el frontend valide el rol y el token antes de mostrar cualquier información confidencial. El diseño debe alinearse con los mockups aprobados por el área de producto para mantener coherencia visual y usabilidad.

## criterios de aceptación (ac):

  **ac 1: acceso exitoso para administrador**
      **Dado** que un usuario con rol Administrador está en la pantalla de login,
      **Cuando** ingresa sus credenciales válidas 
      **Entonces** puede acceder a la sección en el panel de administración.

  **ac 2: acceso exitoso para kitchen**
      **Dado** que un usuario con rol kitchen está en la pantalla de login,
      **Cuando** ingresa sus credenciales válidas 
      **Entonces** puede acceder a la sección kitchen.

   **ac 3: acceso denegado para usuarios sin rol Administrador**
     **Dado** que un usuario autenticado no tiene el rol Administrador,
     **Cuando** intenta acceder a la sección de Gestión de Personal,
     **Entonces** el sistema debe denegar el acceso mostrando un mensaje de acceso denegado o redirigiendo a una sección permitida.

   **ac 4: validación de token y rol**
     **Dado** que un usuario ha iniciado sesión con el rol de administrador,
     **Cuando** el frontend recibe el token y los datos de rol,
     **Entonces** valida que el token es válido y el rol es Administrador antes de mostrar la sección de Gestión de Personal.

  **ac 5: presentación visual conforme al mockup**
     **Dado** que el usuario está en la pantalla panel de administrador,
     **Cuando** se muestra la interfaz,
     **Entonces** todos los elementos visuales (inputs, botones, colores, layout) corresponden al mockup adjunto.

   **ac 6: manejo de error por credenciales incorrectas**
     **Dado** que el usuario ingresa credenciales inválidas en la pantalla de login,
     **Cuando** intenta autenticarse,
     **Entonces** el sistema muestra un mensaje claro y específico de error indicando que el usuario o la contraseña son incorrectos.

-----------------------------------------------------------------------------------------------------------------------------------

# HU-02:Gestión de Alta de Usuarios de Personal
 **Como** `Administrador del Sistema`,
 **Quiero** `acceder a un formulario intuitivo para crear y asignar roles a nuevos usuarios de personal`,
 **Para** `agilizar la incorporación de miembros al equipo y asegurar una gestión eficiente de los accesos al sistema`.

## Descripción y contexto:
Actualmente, el proceso de dar de alta a nuevos usuarios de personal puede ser manual o requerir pasos adicionales que ralentizan la incorporación de nuevos empleados. Esta historia de usuario busca proporcionar una interfaz de usuario (frontend) dedicada y fácil de usar para los administradores, permitiéndoles crear rápidamente nuevas cuentas de usuario, asignarles un rol predefinido (como Administrador, Editor, Visor, etc.) y establecer una contraseña temporal. Esto es crucial para mantener la seguridad del sistema al controlar quién tiene acceso y con qué nivel de permisos, además de mejorar la eficiencia operativa en la gestión de personal. Esta funcionalidad es la interfaz para la creación de usuarios, que interactuará con una API de backend para persistir los datos.

**criterios de aceptación (ac):**

   **ac 1: Acceso al formulario de creación de usuarios para administradores**
     **Dado** que soy un usuario con rol de Administrador
     **Y** he iniciado sesión en el panel de administración
     **Cuando** navego a la sección "User Management"
     **Entonces** puedo ver y acceder al formulario para "Crear Nuevo Usuario"

   **ac 2: Creación exitosa de un nuevo usuario de personal**
     **Dado** que estoy en el formulario de "Crear Nuevo Usuario"
     **Y** he introducido un "Nombre Completo" válido
     **Y** he introducido una "Dirección de Correo Electrónico" única y válida
     **Y** he introducido una "Contraseña Temporal" que cumple los requisitos de seguridad
     **Y** he confirmado la "Contraseña Temporal" correctamente
     **Y** he seleccionado un "Rol" válido del listado
     **Cuando** hago clic en el botón "Guardar"
     **Entonces** se muestra un mensaje de éxito "Usuario creado correctamente"
     **Y** el nuevo usuario aparece en la lista de usuarios
     **Y** el formulario se limpia para una nueva entrada

   **ac 3: Fallo en la creación por datos de entrada inválidos (ej. email)**
     **Dado** que estoy en el formulario de "Crear Nuevo Usuario"
     **Y** he introducido un "Nombre Completo" válido
     **Y** he introducido una "Dirección de Correo Electrónico" con formato inválido (ej. "usuario@dominio")
     **Y** he introducido una "Contraseña Temporal" y su confirmación válidas
     **Y** he seleccionado un "Rol" válido
     **Cuando** hago clic en el botón "Guardar"
     **Entonces** se muestra un mensaje de error "El formato del correo electrónico no es válido" debajo del campo de email
     **Y** el usuario no es creado
     **Y** los datos introducidos en el formulario se mantienen

   **ac 4: Fallo en la creación por contraseñas no coincidentes**
     **Dado** que estoy en el formulario de "Crear Nuevo Usuario"
     **Y** he introducido todos los campos obligatorios y válidos, excepto las contraseñas
     **Y** la "Contraseña Temporal" y "Confirmar Contraseña" no coinciden
     **Cuando** hago clic en el botón "Guardar"
     **Entonces** se muestra un mensaje de error "Las contraseñas no coinciden" debajo del campo de confirmación de contraseña
     **Y** el usuario no es creado
     **Y** los datos introducidos en el formulario se mantienen

*   **ac 5: Cancelación del proceso de creación de usuario**
     **Dado** que estoy en el formulario de "Crear Nuevo Usuario"
     **Y** he introducido algunos datos en los campos
     **Cuando** hago clic en el botón "Cancelar"
     **Entonces** el formulario se limpia
     **Y** soy redirigido a la lista de usuarios de personal


------------------------------------------------------------------------------------------------------------------------------




## HU-03 Visualización y Búsqueda de Usuarios


 **Como** Administrador del sistema,
 **Quiero** visualizar y buscar usuarios existentes mediante una tabla interactiva,
 **Para** gestionar eficientemente a los empleados y localizar información relevante de manera rápida y segura.

**descripción y contexto:**
La gestión eficiente de usuarios es fundamental para mantener la integridad y el correcto funcionamiento del sistema de administración de empleados. Los administradores requieren una interfaz clara y funcional que les permita visualizar todos los usuarios registrados, filtrar y buscar rápidamente por parámetros clave (nombre, email, rol, estado), y realizar acciones de gestión como edición o desactivación de usuarios. Esta funcionalidad resulta crucial para reducir errores, agilizar procesos internos y asegurar que solo el personal autorizado tenga acceso a la información y acciones administrativas. La experiencia debe ser consistente con los lineamientos de UI/UX aprobados y debe garantizar la usabilidad, escalabilidad y seguridad de los datos presentados.

**criterios de aceptación (ac):**

   **ac 1: Visualización general de usuarios**
     **Dado** que el administrador ha accedido a la sección "Gestión de Usuarios"
     **Cuando** se carga la página
     **Entonces** se muestra una tabla con los datos de todos los usuarios (avatar, nombre, email, rol, estado, acciones), paginada según el rango configurado.

*   **ac 2: Búsqueda por nombre o email**
    **Dado** que la tabla de usuarios está visible
    **Cuando** el administrador ingresa un término en el campo de búsqueda
    **Entonces** la tabla muestra solo los usuarios cuyo nombre o email contiene el término ingresado, actualizándose dinámicamente.

*   **ac 3: Filtro por rol y estado**
    **Dado** que la tabla de usuarios está visible
    **Cuando** el administrador selecciona un valor en los dropdowns de rol o estado
    **Entonces** la tabla muestra únicamente los usuarios que cumplen con ambos filtros seleccionados.

*   **ac 4: Caso alternativo – Sin resultados**
    **Dado** que el administrador ha aplicado una búsqueda o filtros
    **Cuando** no hay usuarios que coincidan con los criterios
    **Entonces** se muestra un mensaje claro indicando "No se encontraron usuarios con los criterios seleccionados".

*   **ac 5: Acceso a acciones y formulario de alta**
    **Dado** que el administrador visualiza la tabla
    **Cuando** hace clic en "Editar" o "Desactivar" en la fila de un usuario
    **Entonces** se ejecuta la acción correspondiente según los permisos y reglas de negocio configuradas.

    **Dado** que el administrador está en la sección
    **Cuando** hace clic en "Agregar nuevo usuario"
    **Entonces** se abre el formulario de registro de usuario según el diseño aprobado.


------------------------------------------------------------------------------------------------------------------------------

# HU-4: Edición y Control de Usuarios


 **Como** Administrador,
 **Quiero** editar datos, restablecer contraseñas y desactivar cuentas de usuarios,
 **Para** mantener la información actualizada y gestionar el acceso de forma segura y eficiente.

**descripción y contexto:**
La administración de usuarios es fundamental para garantizar la seguridad y la integridad del sistema. Esta funcionalidad permite a los administradores modificar los datos principales de los usuarios (nombre y rol), restablecer contraseñas cuando sea necesario (por ejemplo, en casos de olvido o compromisos de seguridad), y desactivar cuentas para impedir el acceso sin eliminar registros históricos. Es clave que el administrador no pueda desactivar su propia cuenta para evitar bloqueos accidentales del sistema de gestión. Toda la experiencia debe alinearse visual y funcionalmente con los lineamientos de UI/UX definidos por el equipo de diseño.

**criterios de aceptación (ac):**

   **ac 1: Edición exitosa de datos de usuario**
     **Dado** que el administrador está autenticado y visualiza la lista de usuarios  
     **Cuando** selecciona "Editar" en un usuario y modifica el nombre o rol en el formulario  
     **Entonces** los cambios se guardan correctamente y se muestra un mensaje de éxito consistente con el diseño UI.

   **ac 2: Restablecimiento de contraseña**
     **Dado** que el administrador está en el formulario de edición de un usuario  
     **Cuando** selecciona la opción para restablecer contraseña  
     **Entonces** el sistema genera una nueva contraseña temporal o inicia el flujo de restablecimiento, y notifica al administrador del resultado.

   **ac 3: Desactivación de cuenta de usuario**
     **Dado** que el administrador está editando a un usuario distinto a sí mismo  
     **Cuando** utiliza la opción para desactivar la cuenta  
     **Entonces** el usuario pasa a estado "inactivo" (sin eliminarse), y se muestra un mensaje de confirmación.

   **ac 4: Prevención de autodesactivación**
     **Dado** que el administrador edita su propia cuenta  
     **Cuando** accede al formulario de edición  
     **Entonces** la opción para desactivar la cuenta está deshabilitada o no visible.

   **ac 5: Manejo de errores en la edición**
     **Dado** que el administrador intenta guardar cambios con datos inválidos (ejemplo: nombre vacío, rol no válido)  
     **Cuando** presiona el botón de guardar  
     **Entonces** el sistema muestra mensajes de error específicos, sin modificar la información original hasta que se corrijan.



------------------------------------------------------------------------------------------------------------------------------


# HU-5: Visualización de métricas clave por rango de fechas

 **Como** `administrador del portal Delicious Kitchen`,
 **Quiero** `ver métricas clave de ventas, ingresos y productos filtradas por un rango de fechas personalizado`,
 **Para** `analizar el comportamiento del negocio en periodos específicos y tomar decisiones estratégicas basadas en datos actualizados`.

**descripción y contexto:**
La administración de Delicious Kitchen requiere una herramienta que permita visualizar rápidamente el rendimiento del negocio en cualquier periodo definido por el usuario. Actualmente, las métricas de ventas, ingresos y productos no se pueden filtrar por fechas específicas, lo que dificulta el análisis temporal y la toma de decisiones informadas. Esta funcionalidad permitirá a los administradores seleccionar un rango de fechas y ver información consolidada sobre órdenes, ingresos totales, productos vendidos y el ranking de productos más populares, presentada tanto en gráficos (línea, barra) como en una tabla paginada. Esto responde a la necesidad de identificar tendencias, evaluar campañas y optimizar la oferta de productos.

**criterios de aceptación (ac):**

   **ac 1: visualización exitosa de métricas**
    **Dado** que el usuario está autenticado como “administrador” 
    **Y** existen datos en el rango de fechas seleccionado
    **Cuando** consultar el rendimiento del negocio dentro de un periodo definido selecciona un rango de fecha (ej. 2025-11-01 al 2025-11-30)
    **Entonces**  , el sistema muestra: 
    total Orders
    total Revenue
    products Sold (por producto)
    top N Products
    presentados en gráficos (línea, barra) y una tabla paginada

    **ac 2: manejo de rango de fechas sin datos**
     **Dado** que el usuario está autenticado como administrador  
     **Y** no existen datos para el rango de fechas seleccionado  
     **Cuando** solicita las métricas del negocio  
     **Entonces** el sistema muestra un mensaje indicando “No hay datos disponibles para el periodo seleccionado” y no se despliega información en los gráficos o tabla.

   
   **ac 4: paginación y visualización**
     **Dado** que el usuario está autenticado como administrador  
     **Y** existen más productos vendidos de los que pueden mostrarse en una sola página de la tabla  
     **Cuando** navega entre páginas de la tabla  
     **Entonces** el sistema muestra los datos correspondientes a cada página sin pérdida de información.

   **ac 5: visualización de gráficos**
     **Dado** que el usuario está autenticado como administrador  
     **Cuando** consulta las métricas  
     **Entonces** el sistema presenta los datos en al menos dos tipos de visualización: gráfico de línea y gráfico de barra.



------------------------------------------------------------------------------------------------------------------------------
# HU-6: Filtrado y agrupación de métricas por periodos

**Como** Administrador de Delicious Kitchen
**Quiero** agrupar y visualizar métricas por periodos predefinidos (día, semana, mes, año)
**Para**  identificar tendencias y variaciones en diferentes escalas temporales, facilitando la toma de decisiones informadas.

**Descripción y contexto:**
La funcionalidad propuesta permite a los administradores analizar el desempeño del negocio, comparando fácilmente métricas como ventas, pedidos y clientes en distintas ventanas temporales. Esta capacidad es fundamental para detectar patrones de crecimiento, estacionalidad o anomalías en el negocio. El análisis por periodos predefinidos mejora la eficiencia, reduce errores manuales y habilita reportes más precisos. Es importante que el filtrado y la visualización respondan de manera rápida y clara a la selección del usuario, mostrando agrupaciones coherentes tanto en gráficos como en tablas.

**criterios de aceptación (ac):**

**ac 1: Visualización agrupada correctamente por periodo**
**Dado** que el administrador está en el Dashboard con métricas ya filtradas
**Cuando** selecciona un periodo predefinido (día, semana, mes o año)
**Entonces** el sistema actualiza los gráficos y la tabla mostrando métricas agregadas por sub-periodo, incluyendo valores como dateFrom, dateTo.



-----------------------------------------------------------------------------------------------------------------------------

# HU-7 : Exportación de datos del dashboard a CSV


**Como** Administrador de la página delicious kitchen
**Quiero** exportar en un archivo CSV los datos visibles del dashboard
**Para** realizar análisis externos, integrarlos en reportes o compartir información con otros equipos

## Criterios de Aceptación

**Dado** que el dashboard muestra métricas filtradas y agrupadas con base en parámetros seleccionados
**Cuando** hace clic en el boton “Exportar CSV”
**Entonces** , el sistema devuelve 200 con un archivo CSV que contiene columnas:
period, totalOrders, totalRevenue, productId, productName, quantity.

------------------------------------------------------------------------------------------------------------------------------

# HU-8 : Manejo de ausencia de datos

**Como** Administrador de la plapágina delicious kitchen
**Quiero** ver una mensaje clara cuando no existan datos disponibles para un periodo seleccionado
**Para** evitar confusiones y entender que no hay registros asociados a ese rango temporal

## Criterios de Aceptación

**Dado** que el usuario está autenticado como “administrador”
**Cuando** selecciono un rango de fechas sin datos registrados
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


# HU-13: Permitir al Cliente Cancelar Pedido

 **como** cliente del restaurante,
 **quiero** poder cancelar mi pedido desde la interfaz del sistema,
 **para** tener control sobre mis órdenes y evitar pagar por un pedido que ya no deseo o he cambiado de opinión.

**descripción y contexto:**
Esta historia de usuario busca empoderar a los clientes del restaurante, dándoles la capacidad de cancelar sus pedidos directamente desde la aplicación o sitio web. La funcionalidad es crucial para mejorar la satisfacción del cliente, reducir la frustración por errores en el pedido o cambios de opinión, y potencialmente disminuir la carga administrativa del restaurante al evitar llamadas para cancelaciones.

La cancelación solo será posible si el pedido aún no ha avanzado a ciertas etapas de preparación. Esto asegura que el restaurante no incurra en costos innecesarios por pedidos cancelados tardíamente. El sistema debe ofrecer una experiencia de usuario clara, mostrando cuándo la cancelación es posible y cuándo no, y proporcionando retroalimentación adecuada en ambos escenarios.

**criterios de aceptación (ac):**

   **ac 1: Botón de cancelación visible y habilitado**
     **Dado** que el pedido se encuentra en estado `RECEIVED` o `IN_KITCHEN`
     **cuando** el cliente visualiza la pantalla de detalle de su pedido
     **Entonces** el botón "Cancelar pedido" debe estar visible y habilitado para la interacción.

   **ac 2: Botón de cancelación deshabilitado o ausente**
     **Dado** que el pedido se encuentra en estado `PREPARING`, `READY`, `DELIVERED` o `CANCELLED`
     **Cuando** el cliente visualiza la pantalla de detalle de su pedido
     **Entonces** el botón "Cancelar pedido" debe estar deshabilitado o no visible.

   **ac 3: Cancelación exitosa del pedido**
     **Dado** que el pedido se encuentra en un estado que permite cancelación (`RECEIVED` o `IN_KITCHEN`)
     **y** el cliente ha iniciado la acción de cancelación
     **Cuando** el cliente confirma la cancelación en el diálogo de confirmación
     **Entonces** el sistema debe actualizar el estado del pedido a `CANCELLED`
     **y** debe mostrar el mensaje: "Pedido cancelado exitosamente."
     **y** el cliente debe ser redirigido a la lista de pedidos o la pantalla de detalle actualizada.

   **ac 4: Intento de cancelación de pedido no elegible (validación backend)**
     **Dado** que el pedido se encuentra en un estado que NO permite cancelación (`PREPARING`, `READY`, `DELIVERED` o `CANCELLED`)
     **Cuando** el cliente intenta cancelar el pedido (ya sea por UI o manipulación directa de la API)
     **Entonces** el backend debe responder con un código de error `400` (Bad Request) o `409` (Conflict)
     **y** el frontend debe mostrar el mensaje: "Este pedido ya no se puede cancelar."

   **ac 5: Manejo de cambio de estado concurrente**
     **Dado** que el pedido se encuentra en un estado que permite cancelación (ej. `RECEIVED`)
     **y** el cliente está en el proceso de cancelar el pedido
     **Cuando** el estado del pedido cambia a uno no cancelable (ej. `PREPARING`) antes de que la cancelación se complete en el backend
     **Entonces** el sistema debe rechazar la cancelación
     **y** debe mostrar un mensaje al cliente indicando que el pedido ya no puede ser cancelado debido a un cambio de estado.

