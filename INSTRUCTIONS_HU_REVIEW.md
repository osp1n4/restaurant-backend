# 📝 Sistema de Reseñas - MVP Ultra-Reducido (Entrega 1 Día)

## 🎯 Visión General
Sistema mínimo de reseñas que permite a clientes calificar pedidos entregados y ver reseñas públicas. **SIN microservicio nuevo**, se reutiliza infraestructura existente.

---

## 📋 Historia de Usuario Única (MVP Ultra-Mínimo)

### **HU-REV-01: Cliente Envía y Visualiza Reseñas**
**Como** cliente
**Quiero** calificar mi pedido después de entregado y ver opiniones de otros
**Para** compartir mi experiencia y conocer la del restaurante

**Criterios de Aceptación Mínimos:**
- ✅ Modal de reseña aparece cuando usuario hace clic en botón "Leave a Review" en página de estado del pedido
- ✅ Cliente califica experiencia general (1-5 estrellas) y calidad de comida (1-5 estrellas)
- ✅ Cliente puede agregar comentario opcional (máx 500 caracteres)
- ✅ Reseña se guarda en MongoDB (colección `reviews` en base `orders`)
- ✅ Botón "View Customer Reviews" en parte inferior de Home.jsx
- ✅ Página `/reviews` muestra listado de reseñas aprobadas (sin filtros avanzados)
- ✅ Panel admin básico en `/admin/reviews` para aprobar/ocultar reseñas


---

## 🧪 Escenarios Gherkin Esenciales

### **Funcionalidad: Sistema de Reseñas Básico**

```gherkin
Funcionalidad: Sistema de Reseñas Básico
  Como cliente del restaurante
  Quiero calificar mi pedido y ver opiniones
  Para compartir y conocer experiencias

  Antecedentes:
    Dado que existe la colección "reviews" en MongoDB
    Y el order-service tiene endpoint de reseñas
    Y el cliente "Juan Pérez" completó pedido "#ORD12345"

  Escenario: Cliente envía reseña desde página de estado del pedido
    Dado que el cliente está en la página de estado del pedido "#ORD12345"
    Y el pedido tiene estado "delivered"
    Cuando el cliente hace clic en botón "Leave a Review"
    Entonces debe aparecer el modal ReviewModal
    Y el modal debe mostrar formulario de reseña
    Cuando el cliente selecciona 5 estrellas para "Overall Rating"
    Y el cliente selecciona 5 estrellas para "Food Quality"
    Y el cliente ingresa comentario "¡Excelente comida!"
    Y el cliente hace clic en "Submit Review"
    Entonces la reseña debe guardarse en MongoDB con estado "pending"
    Y el cliente debe ver mensaje "Thank you for your review!"
    Y el modal debe cerrarse

  Escenario: Cliente visualiza reseñas desde Home
    Dado que el cliente está en la página Home
    Cuando el cliente hace scroll hasta el final de la página
    Entonces debe ver el botón "View Customer Reviews"
    Cuando el cliente hace clic en el botón
    Entonces el navegador debe navegar a "/reviews"
    Y la página debe mostrar lista de reseñas aprobadas
    Y cada reseña debe mostrar: nombre, fecha, calificación, comentario

  Escenario: Administrador aprueba reseña pendiente
    Dado que el administrador accede a "/admin/reviews"
    Y hay una reseña con estado "pending"
    Cuando el administrador hace clic en botón "Approve"
    Entonces el estado de la reseña debe cambiar a "approved"
    Y la reseña debe aparecer en la página pública "/reviews"

  Escenario: Validación de calificación obligatoria
    Dado que el modal ReviewModal está abierto
    Cuando el cliente no selecciona calificación general
    Y el cliente hace clic en "Submit Review"
    Entonces debe mostrar error "Overall rating is required"
    Y la reseña no debe guardarse
```

---

## 🏗️ Arquitectura Técnica Simplificada

### **Stack Tecnológico Existente (NO SE AGREGA NADA NUEVO):**
- ✅ **Backend:** Node.js + TypeScript + Express (ya existe en order-service)
- ✅ **Base de Datos:** MongoDB (ya existe, nueva colección `reviews`)
- ✅ **Frontend:** React 19.2.0 + Vite + Tailwind CSS (ya existe)
- ✅ **Routing:** React Router 7.9.6 (ya configurado)
- ✅ **HTTP Client:** fetch nativo (ya usado en api.js)
- ❌ **NO se usa:** RabbitMQ, SSE, nuevo microservicio, Zod, Multer

### **Cambios Mínimos en Arquitectura:**

#### **1. Backend (order-service) - Agregar 3 endpoints:**
```typescript
// order-service/src/routes/reviewRoutes.ts
POST   /api/reviews              // Crear reseña (cualquier usuario)
GET    /api/reviews              // Listar reseñas aprobadas (público)
PATCH  /api/reviews/:id/status   // Cambiar estado (admin)
```

#### **2. MongoDB - Nueva Colección:**
```typescript
// Colección: reviews (en base de datos "orders")
{
  _id: ObjectId,
  orderId: string,           // Referencia a Order
  customerName: string,
  customerEmail: string,
  ratings: {
    overall: number,         // 1-5 (obligatorio)
    food: number            // 1-5 (obligatorio)
  },
  comment: string,           // opcional, max 500 chars
  status: string,            // "pending" | "approved" | "hidden"
  createdAt: Date,
  updatedAt: Date
}
```

#### **3. API Gateway - Proxy Existente:**
```typescript
// api-gateway/src/routes/index.ts (modificar existente)
app.use('/reviews', reviewProxy);  // Proxy a order-service:3001/reviews
```

### **Patrones de Diseño Mínimos:**
- ✅ **Repository Pattern:** `ReviewRepository` para acceso a datos
- ✅ **Service Pattern:** `ReviewService` para lógica de negocio
- ✅ **MVC:** Controller → Service → Repository → MongoDB

### **Principios SOLID Básicos:**
- **Single Responsibility:** ReviewController (HTTP), ReviewService (lógica), ReviewRepository (DB)
- **Dependency Inversion:** ReviewService recibe ReviewRepository en constructor
- **Open/Closed:** Validaciones básicas en Service, extensibles sin modificar controller

---

## 📅 Plan de Implementación Ultra-Rápido (1 Día)

### **🔴 Fase 1: Backend Básico (3-4 horas)**

#### **Tarea 1.1: Modelo de Datos (30 min)**
```bash
# Archivo: order-service/src/models/Review.ts
```
- Crear esquema Mongoose para Review
- Validaciones básicas (required, min, max)
- Índice en `orderId` (unique)

#### **Tarea 1.2: Repository (30 min)**
```bash
# Archivo: order-service/src/repositories/ReviewRepository.ts
```
- `create(reviewData)` - Crear reseña
- `findApproved()` - Obtener reseñas aprobadas
- `findById(id)` - Obtener por ID
- `updateStatus(id, status)` - Cambiar estado

#### **Tarea 1.3: Service (45 min)**
```bash
# Archivo: order-service/src/services/ReviewService.ts
```
- `createReview(data)` - Validar y crear (estado "pending")
- `getPublicReviews()` - Solo status="approved", ordenar por createdAt desc
- `changeReviewStatus(id, status)` - Cambiar a approved/hidden

#### **Tarea 1.4: Controller (45 min)**
```bash
# Archivo: order-service/src/controllers/ReviewController.ts
```
- `POST /reviews` - Crear reseña
- `GET /reviews` - Listar aprobadas
- `PATCH /reviews/:id/status` - Cambiar estado (body: {status: "approved"})

#### **Tarea 1.5: Routes & Gateway (30 min)**
```bash
# Archivos:
# - order-service/src/routes/reviewRoutes.ts
# - api-gateway/src/routes/index.ts
```
- Registrar rutas en order-service
- Configurar proxy en api-gateway a `/reviews`

#### **Tarea 1.6: Testing Básico (30 min)**
- Test unitario: ReviewService.createReview()
- Test integración: POST /api/reviews (usando Supertest)

---

### **🔵 Fase 2: Frontend - Modal de Reseña (2-3 horas)**

#### **Tarea 2.1: Componente StarRating (30 min)**
```bash
# Archivo: restaurant-frontend/src/components/StarRating.jsx
```
- Componente reutilizable de estrellas interactivas
- Props: `rating`, `onChange`, `label`
- Usar Material Symbols existentes

#### **Tarea 2.2: Componente ReviewModal (1 hora)**
```bash
# Archivo: restaurant-frontend/src/components/ReviewModal.jsx
```
- Modal similar a NotificationModal existente
- Campos: Overall Rating, Food Quality, Comment (textarea)
- Validación básica client-side
- Integración con API (`POST /api/reviews`)

#### **Tarea 2.3: Integrar en OrderStatusPage (30 min)**
```bash
# Archivo: restaurant-frontend/src/pages/OrderStatusPage.jsx
```
- Agregar botón "Leave a Review" si status === "delivered"
- Mostrar ReviewModal al hacer clic
- Deshabilitar botón si ya existe reseña del pedido

#### **Tarea 2.4: Servicios API (30 min)**
```bash
# Archivo: restaurant-frontend/src/services/api.js
```
- `createReview(reviewData)` - POST /api/reviews
- `getPublicReviews()` - GET /api/reviews

---

### **🟢 Fase 3: Frontend - Página de Reseñas (2 horas)**

#### **Tarea 3.1: Componente ReviewCard (30 min)**
```bash
# Archivo: restaurant-frontend/src/components/ReviewCard.jsx
```
- Mostrar: nombre, fecha relativa, estrellas, comentario
- Estilos Tailwind consistentes con diseño existente

#### **Tarea 3.2: Página ReviewsPage (1 hora)**
```bash
# Archivo: restaurant-frontend/src/pages/ReviewsPage.jsx
```
- Listar reseñas usando `getPublicReviews()`
- Paginación básica (10 por página, solo botones Prev/Next)
- Estados de carga y error

#### **Tarea 3.3: Botón en Home (15 min)**
```bash
# Archivo: restaurant-frontend/src/pages/Home.jsx
```
- Agregar botón "View Customer Reviews" al final
- Link a `/reviews` usando React Router

#### **Tarea 3.4: Ruta en Router (15 min)**
```bash
# Archivo: restaurant-frontend/src/main.jsx o App.jsx
```
- Agregar ruta `/reviews` → `<ReviewsPage />`

---

### **🟡 Fase 4: Panel Admin Básico (1.5 horas)**

#### **Tarea 4.1: Componente AdminReviewCard (30 min)**
```bash
# Archivo: restaurant-frontend/src/components/AdminReviewCard.jsx
```
- Mostrar todos los campos + badge de estado
- Botones: "Approve" (si pending), "Hide" (si approved)

#### **Tarea 4.2: Página AdminReviewsPage (45 min)**
```bash
# Archivo: restaurant-frontend/src/pages/AdminReviewsPage.jsx
```
- Endpoint temporal: `GET /api/reviews?includeAll=true` (modificar backend)
- Listar todas las reseñas con estado visible
- Botones de acción llaman a `PATCH /api/reviews/:id/status`

#### **Tarea 4.3: Ruta Admin (15 min)**
```bash
# Archivo: restaurant-frontend/src/main.jsx o App.jsx
```
- Agregar ruta `/admin/reviews` → `<AdminReviewsPage />`

---

### **⚪ Fase 5: Testing & Ajustes (1 hora)**

#### **Tarea 5.1: Testing E2E Manual (30 min)**
- ✅ Crear pedido → Marcar como delivered → Dejar reseña → Ver en página pública
- ✅ Admin: Aprobar reseña → Verificar que aparece en público
- ✅ Admin: Ocultar reseña → Verificar que desaparece

#### **Tarea 5.2: Ajustes Finales (30 min)**
- Verificar estilos Tailwind consistentes
- Mensajes en inglés (UI) y validaciones
- Responsive design básico

---

## 📊 Resumen del Plan Ultra-Reducido

| Fase | Duración | Componente                | Entregables Clave                          |
|------|----------|---------------------------|--------------------------------------------|
| 1    | 3-4h     | Backend Básico            | 3 endpoints + modelo + tests               |
| 2    | 2-3h     | Frontend - Modal Reseña   | ReviewModal + StarRating + integración     |
| 3    | 2h       | Frontend - Página Reseñas | ReviewsPage + botón en Home                |
| 4    | 1.5h     | Panel Admin Básico        | AdminReviewsPage + acciones moderación     |
| 5    | 1h       | Testing & Ajustes         | Validación E2E + fixes                     |

**⏱️ Total: 9-11 horas (1 día completo de trabajo)**

---

## 🎯 Alcance Ultra-Mínimo

### **✅ Incluido (Lo Esencial):**
- ✅ Modal de reseña con 2 calificaciones (Overall, Food)
- ✅ Comentario opcional (sin subida de fotos)
- ✅ Página pública de reseñas (sin filtros, solo lista)
- ✅ Panel admin básico (aprobar/ocultar)
- ✅ Validación básica (rating obligatorio, max 500 chars)
- ✅ Persistencia en MongoDB (nueva colección)
- ✅ Integración con order-service existente

### **❌ Excluido (Optimizaciones Futuras):**
- ❌ Notificación automática al entregar pedido (manual via botón)
- ❌ Subida de fotos
- ❌ Filtros avanzados (por rating, fecha)
- ❌ RabbitMQ events
- ❌ SSE tiempo real
- ❌ Validación con Zod
- ❌ Respuestas del admin
- ❌ Estadísticas
- ❌ Búsqueda por Order ID
- ❌ Prevención de duplicados (cliente puede enviar múltiples, admin modera)

### **🔄 Reutilización de Código Existente:**
- ✅ Estructura de order-service (misma arquitectura)
- ✅ Mongoose connection existente
- ✅ API Gateway proxy existente
- ✅ NotificationModal como base para ReviewModal
- ✅ Estilos Tailwind y Material Symbols
- ✅ Patrón de servicios API (api.js)

---

## 📝 Checklist de Implementación

### **Backend:**
- [ ] `Review.ts` - Modelo Mongoose
- [ ] `ReviewRepository.ts` - CRUD básico
- [ ] `ReviewService.ts` - Lógica de negocio
- [ ] `ReviewController.ts` - Endpoints REST
- [ ] `reviewRoutes.ts` - Registro de rutas
- [ ] Gateway proxy a `/reviews`
- [ ] Test unitario ReviewService
- [ ] Test integración POST /api/reviews

### **Frontend:**
- [ ] `StarRating.jsx` - Componente estrellas
- [ ] `ReviewModal.jsx` - Modal de envío
- [ ] `ReviewCard.jsx` - Tarjeta de reseña
- [ ] `ReviewsPage.jsx` - Lista pública
- [ ] `AdminReviewCard.jsx` - Tarjeta admin
- [ ] `AdminReviewsPage.jsx` - Panel admin
- [ ] Botón "View Customer Reviews" en Home
- [ ] Botón "Leave a Review" en OrderStatusPage
- [ ] Funciones en `api.js`: createReview, getPublicReviews
- [ ] Rutas `/reviews` y `/admin/reviews`

### **Testing:**
- [ ] Crear pedido → Reseña → Ver en público
- [ ] Admin aprueba → Aparece en público
- [ ] Admin oculta → Desaparece de público
- [ ] Validación: rating vacío rechazado
- [ ] Responsive design en móvil

---

## 🚀 Comandos de Ejecución

### **Desarrollo:**
```bash
# Backend (order-service con cambios de reviews)
cd restaurant-backend/order-service
npm install
npm run dev

# Frontend
cd restaurant-frontend
npm install
npm run dev
```

### **Docker (Opcional, si hay tiempo):**
```bash
cd restaurant-backend
docker-compose up --build
```

---

**Versión del Documento:** 3.0 (Ultra-Reducido para Entrega 1 Día)
**Última Actualización:** 1 de diciembre de 2025
**Prioridad:** 🔴 CRÍTICA - Entrega mañana en la noche
**Estado:** ✅ Listo para Implementación Inmediata
