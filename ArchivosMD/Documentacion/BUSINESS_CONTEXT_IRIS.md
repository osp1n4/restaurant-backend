# BUSINESS_CONTEXT_IRIS
**Generado por:** Agent IRIS - AI Center sofka
**Fecha:** 12 de diciembre de 2025
**Versión:** 1.0

---

## 1. Análisis y síntesis de contexto

### 1.1. Resumen ejecutivo
El proyecto "Delicious Kitchen" tiene como objetivo principal el desarrollo de una plataforma integral para la gestión de un restaurante. Esta plataforma busca optimizar la interacción entre clientes, el personal de cocina y la administración, a través de un sistema de autoservicio de pedidos, procesamiento en cocina, notificaciones en tiempo real, y herramientas de administración y reporte.

La solución se basa en una arquitectura de microservicios (`order-service`, `kitchen-service`, `notification-service`, `API Gateway`) con un frontend desarrollado en React y Node.js/TypeScript para el backend, utilizando Firebase para la autenticación de usuarios. El valor esperado incluye una mejora significativa en la eficiencia operativa, una mejor experiencia para el cliente y la provisión de información valiosa para la toma de decisiones administrativas.

### 1.2. Propósito del proyecto
El propósito fundamental de "Delicious Kitchen" es resolver las ineficiencias inherentes a los procesos manuales de toma y gestión de pedidos en un restaurante. Al proporcionar una plataforma digital, se busca agilizar la comunicación entre los clientes y la cocina, reducir errores en los pedidos, y ofrecer a la administración herramientas robustas para supervisar las operaciones y analizar el rendimiento. La plataforma pretende ser un sitio web de autoservicio donde los clientes puedan ordenar, registrarse, recibir notificaciones de su pedido y dejar reseñas, mientras que el personal interno gestiona eficazmente sus respectivas responsabilidades.

### 1.3. Objetivo principal del proyecto
El objetivo principal del proyecto es desarrollar y desplegar una plataforma web integral y robusta, denominada "Delicious Kitchen", que automatice la gestión de pedidos, el procesamiento en cocina, las notificaciones a clientes y personal, y la administración de usuarios y reportes para un restaurante. Esto se logrará mediante la implementación de una arquitectura de microservicios escalable, un frontend intuitivo y seguro, y la integración de herramientas que faciliten la interacción eficiente y la toma de decisiones estratégicas, con el fin de optimizar las operaciones del restaurante y mejorar la experiencia del cliente.

### 1.4. Descripción del alcance del proyecto
El alcance del proyecto comprende el desarrollo y la implementación de las siguientes funcionalidades y componentes:

* **Desarrollo de Microservicios:**
    * `order-service`: Gestión completa del ciclo de vida de los pedidos.
    * `kitchen-service`: Procesamiento de pedidos por parte del personal de cocina.
    * `notification-service`: Envío de notificaciones en tiempo real sobre el estado de los pedidos.
    * `API Gateway`: Orquestación y comunicación entre los microservicios.
* **Interfaces de Usuario (Frontend):**
    * *Interfaz para Clientes:* Permite la creación, consulta y seguimiento de pedidos, así como la posibilidad de dejar reseñas.
    * *Interfaz para Personal de Cocina:* Visualización de pedidos pendientes, cambio de estado (comenzar a cocinar, listo).
    * *Interfaz para Administradores:* Gestión de usuarios y roles, gestión de reseñas (aprobar/ocultar), visualización y exportación de reportes.
* **Gestión de Usuarios y Roles:**
    * Registro y autenticación de usuarios mediante Firebase.
    * Definición y asignación de roles (Administrador, Cocina, Cliente).
    * Control de acceso basado en roles para diferentes secciones de la plataforma.
* **Gestión de Pedidos:**
    * Toma de pedidos con opciones personalizables (notas adicionales).
    * Actualización de estados de pedidos (en preparación, listo, cancelado).
    * Historial de pedidos para clientes.
* **Notificaciones:**
    * Notificaciones automáticas al cliente sobre el estado de su pedido.
    * Notificaciones al personal de cocina sobre nuevos pedidos.
* **Gestión de Reseñas:**
    * Clientes pueden enviar reseñas después de recibir un pedido.
    * Administradores pueden aprobar u ocultar reseñas.
* **Módulo de Reportes:**
    * Generación de reportes de órdenes, ingresos y productos vendidos por rango de fechas.
    * Exportación de datos de reportes a formato CSV.
* **Internacionalización:**
    * Soporte para múltiples idiomas (español e inglés) en la interfaz de usuario.
* **Pruebas:**
    * Implementación de pruebas unitarias para el frontend y los microservicios, con una cobertura objetivo superior al 80%.

### 1.5. Flujo principal del proceso

#### 1.5.1 Creación y Realización de Pedidos por el Cliente:
* El cliente accede a la plataforma web y se autentica.
* Navega por el menú y selecciona productos, añadiendo notas especiales (ej. "sin cebolla").
* Procede a la confirmación y realización del pedido.

#### 1.5.2 Notificación y Recepción del Pedido en Cocina:
* El sistema envía una notificación a la interfaz del personal de cocina.
* El cliente recibe una notificación de que su pedido ha sido recibido correctamente.

#### 1.5.3 Procesamiento del Pedido por el Personal de Cocina:
* El personal de cocina visualiza los pedidos pendientes y marca uno como "Comenzar a cocinar".
* El sistema notifica al cliente que su pedido está en preparación.
* Al finalizar, cocina marca el pedido como "Listo" y el sistema notifica al cliente para recogerlo.

#### 1.5.4 Gestión de Cancelaciones de Pedido:
* El cliente puede cancelar si el pedido no está en estado "Comenzar a cocinar".
* El sistema actualiza el estado a "Cancelado".
* **Dolencia Actual:** La notificación de cancelación no llega al personal de cocina, requiriendo corrección para detener la preparación.

#### 1.5.5 Recolección del Pedido y Envío de Reseñas:
* El cliente recoge su pedido y opcionalmente deja una reseña desde su historial.

#### 1.5.6 Administración y Aprobación de Reseñas:
* El administrador accede al panel para ver, aprobar u ocultar las reseñas enviadas.

#### 1.5.7 Generación y Exportación de Reportes:
* El administrador genera reportes por rango de fechas (órdenes, ingresos, productos).
* Los datos se visualizan en tablas/gráficos y se pueden exportar a CSV.
* **Dolencia Actual:** Se requiere validar la información y añadir el tiempo de preparación como métrica.

#### 1.5.8 Gestión de Usuarios y Roles por el Administrador:
* El administrador gestiona usuarios (crear, editar, desactivar) integrados con Firebase.
* **Dolencia Actual:** Bug en visualización de roles por internacionalización y token de Firebase expira muy rápido (3 min).

### 1.6. Análisis de requisitos y contexto de negocio

**Requisitos funcionales (Resumen)**
* **Autenticación:** Registro, login y roles (Admin, Cocina, Cliente).
* **Pedidos (Cliente):** Menú, carrito, personalización, seguimiento y cancelación.
* **Pedidos (Cocina):** Visualización y actualización de estados.
* **Notificaciones:** Automáticas a clientes y cocina.
* **Gestión (Admin):** Usuarios, roles, reseñas y reportes (con exportación CSV).
* **Internacionalización:** Español e Inglés.

**Requisitos no funcionales (Resumen)**
* **Seguridad:** Protección de contraseñas, tokens seguros, control de acceso estricto.
* **Rendimiento:** Respuesta rápida y notificaciones eficientes.
* **Tecnología:** Node.js, TypeScript, React, MongoDB, RabbitMQ, Docker, Firebase.

### 1.7. Criterios de aceptación generales
* Plataforma completamente funcional para todos los roles.
* Flujo de pedido (creación, cocina, notificación, reseña) exitoso.
* Notificaciones en tiempo real correctas.
* Gestión de administración (usuarios y reseñas) efectiva.
* Reportes precisos y exportación a CSV funcional.
* Internacionalización sin errores de visualización.
* Despliegue en Docker y comunicación RabbitMQ correctos.
* Cobertura de pruebas unitarias > 80%.
* Seguridad de contraseñas mejorada.

### 1.12. Dependencias identificadas
* **Firebase:** Crítica para autenticación.
* **RabbitMQ:** Vital para comunicación asíncrona.
* **Docker y docker-compose:** Esenciales para despliegue.
* **MongoDB:** Base de datos.
* **Resolución de Dolencias:** Éxito depende de corregir bugs (token corto, contraseñas, notificación cancelación).

---

## 2. Inventario de requerimientos

### 2.1. Requerimientos funcionales

#### 2.1.1. Módulo de Autenticación y Usuarios
* **RF-001: Registro de Usuarios**
    * *Descripción:* Permitir registro con nombre (alfanumérico 2-50 caracteres) y correo válido único.
    * *Prioridad:* Alta | *Estado:* Propuesto
* **RF-002: Inicio de Sesión de Usuarios**
    * *Descripción:* Login con credenciales para usuarios registrados.
    * *Prioridad:* Alta
* **RF-003: Autenticación Basada en Roles**
    * *Descripción:* Asignar roles (Admin, Cocina, Cliente) para permisos.
    * *Prioridad:* Alta
* **RF-004: Gestión de Usuarios por Administrador**
    * *Descripción:* Crear, editar y desactivar usuarios desde admin.
    * *Prioridad:* Alta
* **RF-005: Asignación y Modificación de Roles**
    * *Descripción:* Modificar roles de usuarios existentes.
    * *Prioridad:* Alta

#### 2.1.2. Módulo de Pedidos (Cliente)
* **RF-006: Visualización de Menú y Productos**
    * *Descripción:* Navegar menú con descripciones y precios.
    * *Prioridad:* Alta
* **RF-007: Adición de Productos al Carrito**
    * *Descripción:* Añadir productos con notas personalizadas (ej. "sin cebolla").
    * *Prioridad:* Alta
* **RF-008: Realización de Pedidos**
    * *Descripción:* Confirmar y enviar pedido.
    * *Prioridad:* Alta
* **RF-009: Seguimiento del Estado de Pedidos**
    * *Descripción:* Consultar estado actual (ej. "en preparación").
    * *Prioridad:* Alta
* **RF-010: Cancelación de Pedidos por Cliente**
    * *Descripción:* Cancelar si no se ha marcado "Comenzar a cocinar".
    * *Prioridad:* Media
* **RF-011: Historial de Pedidos**
    * *Descripción:* Acceso a pedidos anteriores y detalles.
    * *Prioridad:* Media

#### 2.1.3. Módulo de Cocina
* **RF-012: Visualización de Pedidos Pendientes**
    * *Descripción:* Lista de pedidos a preparar con notas.
    * *Prioridad:* Alta
* **RF-013: Actualización a "Comenzar a cocinar"**
    * *Descripción:* Marcar inicio de preparación (notifica cliente).
    * *Prioridad:* Alta
* **RF-014: Actualización a "Listo"**
    * *Descripción:* Marcar fin de preparación (notifica recolección).
    * *Prioridad:* Alta

#### 2.1.4. Módulo de Notificaciones
* **RF-015:** Notificación de Pedido Recibido (Cliente).
* **RF-016:** Notificación de Pedido en Preparación (Cliente).
* **RF-017:** Notificación de Pedido Listo (Cliente).
* **RF-018:** Notificación de Nuevo Pedido (Cocina).
* **RF-019: Notificación de Cancelación de Pedido (Cocina)**
    * *Descripción:* Notificar a cocina tras cancelación para detener preparación (soluciona dolencia).
    * *Prioridad:* Alta

#### 2.1.5. Módulo de Gestión de Reseñas
* **RF-020:** Envío de Reseñas por Clientes.
* **RF-021:** Visualización de Reseñas (Admin).
* **RF-022:** Aprobación u Ocultamiento de Reseñas (Admin).

#### 2.1.6. Módulo de Reportes
* **RF-023: Generación de Reportes**
    * *Descripción:* Reportes de órdenes e ingresos por fechas (ETL ligero).
    * *Prioridad:* Alta
* **RF-024:** Visualización de Tendencias y Productos Destacados.
* **RF-025:** Exportación de Reportes a CSV.

#### 2.1.7. Módulo de Internacionalización
* **RF-026:** Soporte Múltiples Idiomas (Español/Inglés).

### 2.2. Requerimientos no funcionales

#### 2.2.1. Rendimiento y escalabilidad
* **RNF-001: Tiempos de Respuesta Rápidos:** 95% transacciones < 2 segundos.
* **RNF-002: Procesamiento Eficiente Notificaciones:** 99% entregadas < 1 segundo.
* **RNF-003: Escalabilidad:** Soportar 1000 pedidos concurrentes/min.

#### 2.2.2. Seguridad
* **RNF-004: Protección de Datos:** Contraseñas hasheadas, no visibles en frontend.
* **RNF-005: Autenticación Robusta:** Tokens JWT firmados, expiración configurable.
* **RNF-006: Control de Acceso Estricto:** Validación de rol en rutas protegidas.

#### 2.2.3. Usabilidad
* **RNF-007: Interfaz Intuitiva:** Usuario nuevo completa tarea clave < 5 min.

#### 2.2.4. Disponibilidad
* **RNF-008: Alta Disponibilidad:** 99.9% uptime.

#### 2.2.5. Mantenibilidad
* **RNF-009: Código Modular:** Documentado y estandarizado.
* **RNF-010: Cobertura de Pruebas:** > 80% cobertura unitaria.

### 2.4. Matriz de riesgos

| ID | Nombre del riesgo | Probabilidad | Impacto | Nivel de riesgo | Posible mitigación |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **RS-001** | Notificación de cancelación a cocina fallida | Alta | Alto | **Crítico** | Implementar y probar notificación de cancelación. |
| **RS-002** | Bug visualización de roles por i18n | Media | Medio | **Alto** | Depurar y corregir bug de internacionalización. |
| **RS-003** | Token de Firebase expira muy rápido | Alta | Alto | **Crítico** | Ajustar expiración de token de Firebase a 15 min. |
| **RS-004** | Contraseñas expuestas en frontend/backend | Alta | **Crítico** | **Crítico** | Implementar encriptación y manejo seguro de credenciales. |
| **RS-005** | Inconsistencia de datos en reportes | Media | Alto | **Alto** | Validar datos, añadir métrica de tiempo de preparación. |
| **RS-006** | Fallos críticos en creación/procesamiento de pedidos | Alta | **Crítico** | **Crítico** | Pruebas exhaustivas, monitoreo continuo. |
| **RS-007** | Problemas de rendimiento/disponibilidad | Media | Alto | **Alto** | Optimización de código, infraestructura robusta. |
| **RS-008** | Errores en comunicación/despliegue Docker | Media | Alto | **Alto** | Configuración y pruebas de integración Docker/RabbitMQ. |
| **RS-009** | Repositorio con archivos innecesarios | Baja | Bajo | **Bajo** | Limpieza y organización del repositorio. |