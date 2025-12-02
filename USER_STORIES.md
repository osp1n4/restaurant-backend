# USER STORIES - Sistema de Reseñas de Clientes

**Proyecto:** Restaurant Management System
**Módulo:** Sistema de Reseñas (Customer Reviews)
**Fecha:** 1 de diciembre de 2025
**Sprint:** Review System Implementation

---

## 📋 Índice

1. [Visión General](#visión-general)
2. [User Stories](#user-stories)
   - [US-01: Dejar una Reseña](#us-01-dejar-una-reseña-como-cliente)
   - [US-02: Ver Reseñas Públicas](#us-02-ver-reseñas-públicas-como-visitante)
   - [US-03: Moderar Reseñas](#us-03-moderar-reseñas-como-administrador)
   - [US-04: Visualizar Estadísticas](#us-04-visualizar-estadísticas-como-administrador)
3. [Criterios de Aceptación Técnicos Generales](#criterios-de-aceptación-técnicos-generales)
4. [Definición de Done](#definición-de-done)

---

## Visión General

### Contexto del Negocio

El restaurante necesita un sistema de reseñas que permita a los clientes compartir sus experiencias después de recibir sus pedidos. Esto ayudará a:

- **Aumentar la confianza** de nuevos clientes al ver opiniones reales
- **Obtener feedback valioso** para mejorar el servicio
- **Identificar áreas de mejora** en calidad de comida y atención
- **Construir reputación online** del restaurante

### Stakeholders

- **Clientes:** Usuarios que han realizado pedidos y desean compartir su experiencia
- **Visitantes:** Personas explorando el restaurante que quieren ver opiniones
- **Administradores:** Personal del restaurante que modera contenido y analiza feedback
- **Gerencia:** Dirección del restaurante interesada en métricas y satisfacción del cliente

### Alcance Funcional

El sistema de reseñas permitirá:
1. ✅ Crear reseñas después de recibir un pedido
2. ✅ Ver reseñas aprobadas en página pública
3. ✅ Moderar reseñas (aprobar/ocultar) en panel administrativo
4. ✅ Visualizar estadísticas de reseñas

---

## User Stories

### US-01: Dejar una Reseña como Cliente

**Como** cliente que ha recibido su pedido
**Quiero** poder dejar una reseña sobre mi experiencia
**Para** compartir mi opinión y ayudar a otros clientes a tomar decisiones informadas

#### Prioridad
🔴 **ALTA** - Funcionalidad core del sistema

#### Story Points
**8 puntos** (Complejidad media-alta)

---

#### Criterios de Aceptación

##### AC-01.1: Acceso al Formulario de Reseña
**Dado que** soy un cliente con un pedido en estado "DELIVERED"
**Cuando** accedo a la página de estado de mi pedido (`/orders/:orderId`)
**Entonces** veo un botón **"Leave a Review"** al final de la página

**Validaciones:**
- ✅ El botón solo aparece si el estado del pedido es exactamente `"DELIVERED"`
- ✅ El botón NO aparece si el pedido está en estado `"PENDING"`, `"PREPARING"`, o `"READY"`
- ✅ El botón NO aparece si ya existe una reseña para ese pedido

---

##### AC-01.2: Formulario de Reseña
**Dado que** hago clic en el botón "Leave a Review"
**Cuando** se abre el modal de reseña
**Entonces** veo un formulario con los siguientes campos:

**Campos del formulario:**

| Campo               | Tipo             | Requerido | Validación                          |
|---------------------|------------------|-----------|-------------------------------------|
| Overall Rating      | Star Rating (1-5)| Sí        | Mínimo 1 estrella                   |
| Food Quality Rating | Star Rating (1-5)| Sí        | Mínimo 1 estrella                   |
| Comment             | Textarea         | No        | Máximo 500 caracteres               |

**Validaciones de UI:**
- ✅ Las estrellas son interactivas (hover y click)
- ✅ El contador de caracteres muestra: `{current}/500`
- ✅ El botón "Submit" está deshabilitado si:
  - Overall Rating = 0 estrellas
  - Food Rating = 0 estrellas
- ✅ Hay un botón "Cancel" para cerrar el modal sin enviar

---

##### AC-01.3: Envío Exitoso
**Dado que** he completado el formulario correctamente
**Cuando** hago clic en el botón "Submit Review"
**Entonces** el sistema:

1. ✅ Muestra un indicador de carga ("Submitting...")
2. ✅ Envía la reseña al backend vía API
3. ✅ Muestra mensaje de éxito: **"Thank you for your review!"**
4. ✅ Cierra el modal automáticamente después de 2 segundos
5. ✅ Oculta el botón "Leave a Review" (ya no se puede reenviar)

**Validación técnica:**
```http
POST http://localhost:3000/reviews
Content-Type: application/json

{
  "orderId": "ORD-1733087654321",
  "customerName": "John Doe",
  "overallRating": 5,
  "foodRating": 5,
  "comment": "Excellent food and fast delivery!"
}

Response 201 Created:
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "review": {
      "_id": "674c3a1b2f...",
      "orderId": "ORD-1733087654321",
      "customerName": "John Doe",
      "overallRating": 5,
      "foodRating": 5,
      "comment": "Excellent food and fast delivery!",
      "status": "pending",
      "createdAt": "2025-12-01T10:30:00.000Z",
      "updatedAt": "2025-12-01T10:30:00.000Z"
    }
  }
}
```

---

##### AC-01.4: Validación de Errores
**Dado que** intento enviar una reseña
**Cuando** ocurre un error de validación
**Entonces** veo un mensaje de error apropiado:

**Casos de error:**

| Condición                          | Mensaje de Error                                    |
|------------------------------------|-----------------------------------------------------|
| Rating general = 0                 | "Please select an overall rating"                   |
| Rating de comida = 0               | "Please select a food quality rating"               |
| Comentario > 500 caracteres        | "Comment must not exceed 500 characters"            |
| Ya existe reseña para ese pedido   | "You have already reviewed this order"              |
| Pedido no existe                   | "Order not found"                                   |
| Error de conexión                  | "Unable to submit review. Please try again later."  |

**Comportamiento:**
- ✅ Los mensajes de error se muestran en color rojo
- ✅ El modal permanece abierto para corregir errores
- ✅ Los datos ingresados NO se pierden al mostrar error

---

##### AC-01.5: Estado Inicial de la Reseña
**Dado que** una reseña se ha enviado exitosamente
**Cuando** se guarda en la base de datos
**Entonces**:
- ✅ El campo `status` se establece en `"pending"`
- ✅ La reseña NO aparece en la página pública aún
- ✅ La reseña SÍ aparece en el panel de administración

---

#### Mockups / Wireframes

**Ubicación:** `/design/review-form-modal.png`

**Elementos visuales clave:**
- Modal con título "Leave a Review"
- Componente de estrellas interactivas (amarillo/naranja)
- Textarea con contador de caracteres
- Botones "Cancel" (gris) y "Submit" (naranja)

---

#### Notas Técnicas

**Endpoints utilizados:**
```
POST /reviews
```

**Tecnologías frontend:**
- React 19.2.0
- Material Symbols Icons (para estrellas)
- Tailwind CSS para estilos

**Componentes creados:**
- `ReviewModal.jsx` - Modal principal del formulario
- `StarRating.jsx` - Componente reutilizable de estrellas

---

#### Dependencias

- ✅ El sistema de órdenes debe estar funcional
- ✅ Debe existir al menos un pedido en estado "DELIVERED"
- ✅ El backend debe validar que el pedido existe y está entregado

---

### US-02: Ver Reseñas Públicas como Visitante

**Como** visitante del sitio web (potencial cliente)
**Quiero** ver las reseñas de otros clientes
**Para** conocer la calidad del servicio antes de hacer un pedido

#### Prioridad
🔴 **ALTA** - Funcionalidad core para conversión de clientes

#### Story Points
**5 puntos** (Complejidad media)

---

#### Criterios de Aceptación

##### AC-02.1: Acceso a la Página de Reseñas
**Dado que** soy un visitante del sitio web
**Cuando** navego a `/reviews` o hago clic en "View Customer Reviews" desde la página principal
**Entonces** veo la página pública de reseñas

**Elementos visibles:**
- ✅ Título: "Customer Reviews"
- ✅ Subtítulo: "Read about our customers' experiences"
- ✅ Lista de reseñas aprobadas
- ✅ Paginación (si hay más de 10 reseñas)

---

##### AC-02.2: Visualización de Reseñas
**Dado que** estoy en la página de reseñas públicas
**Cuando** la página carga
**Entonces** veo las siguientes reseñas:

**Solo se muestran:**
- ✅ Reseñas con status `"approved"`
- ✅ Ordenadas por fecha de creación (más recientes primero)
- ✅ Máximo 10 reseñas por página

**NO se muestran:**
- ❌ Reseñas con status `"pending"`
- ❌ Reseñas con status `"hidden"`

---

##### AC-02.3: Formato de Tarjeta de Reseña
**Dado que** hay reseñas aprobadas disponibles
**Cuando** veo una tarjeta de reseña
**Entonces** cada tarjeta muestra:

**Información visible:**

| Elemento              | Formato / Ejemplo                          |
|-----------------------|--------------------------------------------|
| Nombre del Cliente    | "John Doe"                                 |
| Fecha                 | Relativa: "2 days ago" o "3 months ago"    |
| Overall Rating        | Badge naranja con estrellas: "★ 5.0"      |
| Rating Breakdown      | Iconos con estrellas: "Overall: ★★★★★"    |
|                       | "Food Quality: ★★★★★"                      |
| Comentario            | Texto del comentario (si existe)           |

**Diseño visual:**
- ✅ Tarjetas con fondo blanco y sombra suave
- ✅ Espaciado consistente entre elementos
- ✅ Estrellas en color amarillo (#FBBF24)
- ✅ Badge de rating en color naranja (#FF6B35)

---

##### AC-02.4: Estado Vacío
**Dado que** no hay reseñas aprobadas en el sistema
**Cuando** accedo a la página de reseñas
**Entonces** veo:
- ✅ Icono ilustrativo (emoji de estrella o similar)
- ✅ Mensaje: **"No reviews yet"**
- ✅ Submensaje: **"Be the first to share your experience"**

---

##### AC-02.5: Paginación
**Dado que** hay más de 10 reseñas aprobadas
**Cuando** llego al final de la página
**Entonces** veo controles de paginación:

**Controles:**
- ✅ Botón "Previous" (deshabilitado en página 1)
- ✅ Indicador: "Page 1 of 3"
- ✅ Botón "Next" (deshabilitado en última página)

**Comportamiento:**
- ✅ Al hacer clic en "Next", se cargan las siguientes 10 reseñas
- ✅ La página hace scroll automáticamente al inicio de las reseñas
- ✅ Se actualiza la URL: `/reviews?page=2`

---

##### AC-02.6: Estado de Carga
**Dado que** la página está cargando reseñas desde el API
**Cuando** se hace la petición inicial
**Entonces**:
- ✅ Veo un spinner de carga
- ✅ Mensaje: **"Loading reviews..."**
- ✅ El contenido anterior no se muestra hasta que la carga termine

---

##### AC-02.7: Manejo de Errores
**Dado que** ocurre un error al cargar reseñas
**Cuando** el API retorna un error (500, timeout, etc.)
**Entonces**:
- ✅ Veo mensaje: **"Unable to load reviews"**
- ✅ Botón **"Retry"** para intentar cargar nuevamente
- ✅ No se muestra contenido parcial o corrupto

---

#### Mockups / Wireframes

**Ubicación:** `/design/public-reviews-page.png`

**Elementos clave:**
- Layout de tarjetas en grid (1 columna en móvil, 2 en tablet, 2 en desktop)
- Componente de paginación en la parte inferior
- Estado vacío con iconografía amigable

---

#### Notas Técnicas

**Endpoints utilizados:**
```http
GET /reviews?page=1&limit=10
```

**Respuesta del API:**
```json
{
  "reviews": [
    {
      "_id": "674c3a1b2f...",
      "orderId": "ORD-1733087654321",
      "customerName": "John Doe",
      "overallRating": 5,
      "foodRating": 5,
      "comment": "Excellent!",
      "status": "approved",
      "createdAt": "2025-12-01T10:30:00.000Z",
      "updatedAt": "2025-12-01T10:35:00.000Z"
    }
  ],
  "total": 25,
  "page": 1,
  "limit": 10,
  "hasMore": true
}
```

**Componentes creados:**
- `ReviewsPage.jsx` - Página principal de reseñas
- `ReviewCard.jsx` - Tarjeta individual de reseña

---

### US-03: Moderar Reseñas como Administrador

**Como** administrador del restaurante
**Quiero** poder revisar y moderar las reseñas enviadas por clientes
**Para** prevenir contenido ofensivo o spam y mantener la calidad de las reseñas públicas

#### Prioridad
🔴 **ALTA** - Crítico para control de calidad

#### Story Points
**13 puntos** (Complejidad alta)

---

#### Criterios de Aceptación

##### AC-03.1: Acceso al Panel de Administración
**Dado que** soy un administrador
**Cuando** navego a `/admin/reviews`
**Entonces** veo el panel de administración de reseñas

**Nota:** En esta versión NO hay autenticación. En producción, este endpoint debe estar protegido con JWT y rol de admin.

---

##### AC-03.2: Visualización de Todas las Reseñas
**Dado que** estoy en el panel de administración
**Cuando** la página carga
**Entonces** veo:

**Elementos del panel:**
- ✅ Título: "Review Management Panel"
- ✅ Subtítulo: "Manage and moderate customer reviews"
- ✅ Tarjetas de estadísticas (ver US-04)
- ✅ Lista de TODAS las reseñas (pending, approved, hidden)
- ✅ Paginación (50 reseñas por página)

**Orden:**
- Reseñas "pending" primero (requieren acción)
- Luego "approved"
- Finalmente "hidden"
- Dentro de cada grupo: más recientes primero

---

##### AC-03.3: Información Visible por Reseña
**Dado que** veo una reseña en el panel de admin
**Entonces** cada tarjeta muestra:

| Elemento              | Formato / Ejemplo                          |
|-----------------------|--------------------------------------------|
| Customer Name         | "John Doe"                                 |
| Order ID              | "Order: ORD-1733087654321" (clickable)     |
| Status Badge          | "Pending" (amarillo), "Approved" (verde), "Hidden" (gris) |
| Overall Rating        | Estrellas: ★★★★★ (5.0)                     |
| Food Quality Rating   | Estrellas: ★★★★☆ (4.0)                     |
| Comment               | Texto completo del comentario              |
| Date                  | "Created: December 1, 2025 at 10:30 AM"    |
| Action Buttons        | "Approve" y "Hide" (ver AC-03.4)           |

---

##### AC-03.4: Acciones de Moderación
**Dado que** veo una reseña en estado "pending"
**Cuando** analizo su contenido
**Entonces** puedo:

**Acción 1: Aprobar Reseña**
- ✅ Botón **"Approve"** (color naranja con ícono de checkmark)
- ✅ Al hacer clic, se abre modal de confirmación
- ✅ Modal pregunta: *"Are you sure you want to approve this review from [Customer Name]?"*
- ✅ Opciones: "Cancel" y "Confirm"
- ✅ Al confirmar:
  - Status cambia de `"pending"` a `"approved"`
  - Badge cambia a verde
  - Botón "Approve" desaparece
  - Reseña ahora visible en página pública

**Acción 2: Ocultar Reseña**
- ✅ Botón **"Hide"** (color gris con ícono de ojo tachado)
- ✅ Al hacer clic, se abre modal de confirmación
- ✅ Modal pregunta: *"Are you sure you want to hide this review from [Customer Name]?"*
- ✅ Al confirmar:
  - Status cambia a `"hidden"`
  - Badge cambia a gris
  - Reseña desaparece de página pública (si estaba aprobada)
  - Botón "Hide" cambia a "Approve" (se puede revertir)

---

##### AC-03.5: Cambio de Estado en Tiempo Real
**Dado que** apruebo u oculto una reseña
**Cuando** se completa la acción
**Entonces**:
- ✅ La tarjeta se actualiza inmediatamente (sin recargar página)
- ✅ Las estadísticas en las tarjetas superiores se actualizan
- ✅ Aparece notificación de éxito:
  - "Review approved successfully" (verde)
  - "Review hidden successfully" (gris)

---

##### AC-03.6: Validación de Acciones
**Dado que** intento cambiar el estado de una reseña
**Cuando** el API retorna un error
**Entonces**:
- ✅ Veo notificación de error: *"Unable to update review status. Please try again."*
- ✅ El estado de la tarjeta NO cambia
- ✅ Puedo reintentar la acción

---

##### AC-03.7: Estado Vacío
**Dado que** no hay ninguna reseña en el sistema
**Cuando** accedo al panel de admin
**Entonces** veo:
- ✅ Estadísticas en 0
- ✅ Mensaje: **"No reviews"**
- ✅ Submensaje: "Reviews will appear here once customers start leaving feedback"

---

##### AC-03.8: Filtrado por Estado (Futuro)
**Nota:** Esta funcionalidad está preparada para implementación futura.

**User story futura:**
> Como administrador, quiero poder filtrar reseñas por estado (All/Pending/Approved/Hidden) para enfocarte en las que requieren acción.

---

#### Mockups / Wireframes

**Ubicación:** `/design/admin-reviews-panel.png`

**Elementos clave:**
- Tarjetas de estadísticas en la parte superior
- Lista de reseñas con badges de estado claramente visibles
- Botones de acción con iconografía intuitiva
- Modal de confirmación con advertencia clara

---

#### Notas Técnicas

**Endpoints utilizados:**

```http
# Listar todas las reseñas (admin)
GET /reviews/admin/reviews?page=1&limit=50

# Cambiar estado
PATCH /reviews/:id/status
Content-Type: application/json

{
  "status": "approved" // o "hidden"
}
```

**Validaciones backend:**
```typescript
// Solo estados válidos para transiciones
if (status !== 'approved' && status !== 'hidden') {
  return res.status(400).json({
    success: false,
    message: 'Invalid status. Must be "approved" or "hidden"'
  });
}
```

**Componentes creados:**
- `AdminReviewsPage.jsx` - Página principal del panel
- `ReviewAdminCard.jsx` (reutiliza ReviewCard con props adicionales)

---

### US-04: Visualizar Estadísticas como Administrador

**Como** administrador del restaurante
**Quiero** ver estadísticas agregadas de las reseñas
**Para** entender rápidamente el volumen y estado de las reseñas sin revisar cada una

#### Prioridad
🟡 **MEDIA** - Nice to have, mejora UX del admin

#### Story Points
**3 puntos** (Complejidad baja)

---

#### Criterios de Aceptación

##### AC-04.1: Tarjetas de Estadísticas
**Dado que** estoy en el panel de administración (`/admin/reviews`)
**Cuando** la página carga
**Entonces** veo 3 tarjetas de estadísticas en la parte superior:

**Tarjeta 1: Total Reviews**
- ✅ Ícono: Múltiples estrellas
- ✅ Título: "Total Reviews"
- ✅ Valor: Número total de reseñas en el sistema (pending + approved + hidden)
- ✅ Ejemplo: "25"

**Tarjeta 2: Pending**
- ✅ Ícono: Reloj (indicando espera)
- ✅ Título: "Pending"
- ✅ Valor: Número de reseñas pendientes de moderación
- ✅ Ejemplo: "8"
- ✅ Color de acento: Amarillo/Ámbar (#F59E0B)

**Tarjeta 3: Approved**
- ✅ Ícono: Checkmark
- ✅ Título: "Approved"
- ✅ Valor: Número de reseñas aprobadas y visibles públicamente
- ✅ Ejemplo: "17"
- ✅ Color de acento: Verde (#10B981)

---

##### AC-04.2: Actualización en Tiempo Real
**Dado que** apruebo u oculto una reseña
**Cuando** la acción se completa exitosamente
**Entonces**:
- ✅ La tarjeta "Total Reviews" se mantiene igual (no cambia el total)
- ✅ Si apruebo: "Pending" decrementa en 1, "Approved" incrementa en 1
- ✅ Si oculto aprobada: "Approved" decrementa en 1
- ✅ Si oculto pendiente: "Pending" decrementa en 1

---

##### AC-04.3: Estado de Carga
**Dado que** las estadísticas están cargando
**Cuando** la página inicia
**Entonces**:
- ✅ Veo "..." o spinner en cada tarjeta mientras carga
- ✅ Una vez cargadas, se muestran los números reales

---

##### AC-04.4: Cálculo de Estadísticas
**Validación técnica:**

```http
GET /reviews/admin/reviews?page=1&limit=50

Response:
{
  "reviews": [...],
  "total": 25,        // Total de reseñas
  "page": 1,
  "limit": 50
}
```

**Cálculo en frontend:**
```javascript
const total = data.total;
const pending = data.reviews.filter(r => r.status === 'pending').length;
const approved = data.reviews.filter(r => r.status === 'approved').length;
```

**Nota:** Para precisión total en sistemas grandes, el backend debería proporcionar estas métricas pre-calculadas.

---

#### Mockups / Wireframes

**Ubicación:** `/design/admin-statistics-cards.png`

**Diseño:**
- 3 tarjetas en fila (en desktop)
- Stack vertical (en móvil)
- Cada tarjeta con fondo blanco, sombra suave, y ícono grande

---

#### Notas Técnicas

**Mejora futura (backend):**
```http
GET /reviews/stats

Response:
{
  "total": 25,
  "pending": 8,
  "approved": 17,
  "hidden": 0,
  "averageOverallRating": 4.6,
  "averageFoodRating": 4.8
}
```

Esto evitaría calcular estadísticas en frontend y mejoraría performance con grandes volúmenes.

---

## Criterios de Aceptación Técnicos Generales

### Performance

- ✅ Tiempo de carga inicial de página de reseñas: < 2 segundos
- ✅ Tiempo de respuesta de API POST /reviews: < 500ms
- ✅ Tiempo de respuesta de API GET /reviews: < 300ms
- ✅ Paginación debe cargar solo los registros necesarios (no todo el dataset)

### Compatibilidad

- ✅ Frontend funcional en:
  - Chrome 90+ ✅
  - Firefox 88+ ✅
  - Safari 14+ ✅
  - Edge 90+ ✅
- ✅ Diseño responsive:
  - Móvil (320px - 768px) ✅
  - Tablet (769px - 1024px) ✅
  - Desktop (1025px+) ✅

### Seguridad

- ✅ Validación de entrada en backend (prevenir inyección SQL/NoSQL)
- ✅ Sanitización de comentarios (prevenir XSS)
- ✅ Límite de longitud de comentarios (500 caracteres)
- ✅ Rate limiting en endpoints (futuro - no implementado en MVP)
- ⚠️ Autenticación de admin (NO implementada - requerida para producción)

### Accesibilidad (WCAG 2.1 Level AA)

- ✅ Contraste de colores adecuado (>4.5:1 para texto)
- ✅ Navegación por teclado funcional (Tab, Enter, Escape)
- ✅ Labels en formularios para screen readers
- ✅ Mensajes de error claros y descriptivos
- ⚠️ ARIA attributes (implementación parcial)

### Mantenibilidad

- ✅ Código siguiendo principios SOLID
- ✅ Separación de responsabilidades (Model-View-Controller)
- ✅ Interfaces TypeScript para contratos de datos
- ✅ Patrones de diseño: Repository, Service Layer, Dependency Injection
- ✅ Cobertura de tests >85% en nueva funcionalidad

---

## Definición de Done

Una User Story se considera **DONE** cuando:

### Código
- ✅ Todo el código está commiteado en la rama principal (`main`)
- ✅ Código pasa linting sin errores (`npm run lint`)
- ✅ Código compila sin errores TypeScript (`npm run build`)
- ✅ No hay warnings de compilación críticos

### Testing
- ✅ Tests unitarios escritos y pasando (>90% coverage en servicios)
- ✅ Tests de integración escritos y pasando (>80% coverage en controllers)
- ✅ Tests E2E manuales ejecutados y documentados con screenshots
- ✅ Coverage report generado: `npm run test:coverage`

### Documentación
- ✅ README actualizado con nueva funcionalidad
- ✅ USER_STORIES.md creado con todas las historias
- ✅ AUDIT_REPORT.md creado con análisis de calidad
- ✅ TESTING_GUIDE.md creado con instrucciones paso a paso
- ✅ Comentarios en código para lógica compleja
- ✅ Endpoints documentados con ejemplos de request/response

### Infraestructura
- ✅ docker-compose.yml actualizado con servicios necesarios (RabbitMQ, MongoDB)
- ✅ Variables de entorno documentadas en README
- ✅ Servicios levantan sin errores: `docker-compose up -d`
- ✅ Health checks configurados para servicios críticos

### Review
- ✅ Code review realizado (auto-review en este caso)
- ✅ Criterios de aceptación verificados uno por uno
- ✅ Principios SOLID aplicados y validados
- ✅ No hay errores en consola del navegador

### Deployment
- ✅ Código desplegable en ambiente local
- ✅ Frontend accesible en http://localhost:5173
- ✅ Backend accesible en http://localhost:3000
- ✅ Base de datos MongoDB funcional en puerto 27017
- ✅ Todos los microservicios saludables en Docker

---

## Anexo: Endpoints del API

### Resumen de Endpoints

| Método | Endpoint                    | Descripción                      | Auth Required |
|--------|-----------------------------|----------------------------------|---------------|
| POST   | `/reviews`                  | Crear nueva reseña               | No            |
| GET    | `/reviews`                  | Listar reseñas públicas (paged)  | No            |
| GET    | `/reviews/:id`              | Obtener reseña por ID            | No            |
| GET    | `/reviews/admin/reviews`    | Listar todas (admin panel)       | No* (Sí en prod) |
| PATCH  | `/reviews/:id/status`       | Aprobar/Ocultar reseña           | No* (Sí en prod) |

*En producción estos endpoints deben requerir JWT con rol de admin.

---

## Anexo: Modelo de Datos

### Review Schema (MongoDB)

```typescript
{
  _id: ObjectId,
  orderId: String (required, unique, indexed),
  customerName: String (required, min: 2, max: 100),
  overallRating: Number (required, min: 1, max: 5),
  foodRating: Number (required, min: 1, max: 5),
  comment: String (optional, max: 500),
  status: String (enum: ['pending', 'approved', 'hidden'], default: 'pending'),
  createdAt: Date (auto-generated),
  updatedAt: Date (auto-generated)
}
```

### Índices

```javascript
orderId: unique index (previene reseñas duplicadas)
status: index (optimiza queries de reseñas aprobadas)
createdAt: index (optimiza ordenamiento por fecha)
```

---

## Anexo: Priorización y Roadmap

### Sprint 1 - MVP (COMPLETADO ✅)
- US-01: Dejar una Reseña
- US-02: Ver Reseñas Públicas
- US-03: Moderar Reseñas
- US-04: Visualizar Estadísticas

**Total Story Points:** 29 puntos

### Sprint 2 - Mejoras (Futuro)
- Autenticación de administrador con JWT
- Filtrado de reseñas por estado en panel admin
- Respuestas del restaurante a reseñas
- Fotos en reseñas

### Sprint 3 - Avanzado (Futuro)
- Notificaciones por email al aprobar reseña
- Integración con redes sociales
- Análisis de sentimiento con AI
- Dashboard de analytics para gerencia

---

**Fin del Documento de User Stories**

**Elaborado por:** Equipo de Desarrollo
**Revisado por:** Product Owner
**Fecha de creación:** 1 de diciembre de 2025
**Versión:** 1.0
