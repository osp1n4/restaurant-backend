# Restaurant Backend - Sistema de Gestión de Restaurante

Sistema completo de procesamiento de pedidos para restaurante con arquitectura de microservicios, incluyendo gestión de cocina, notificaciones en tiempo real y sistema de reseñas.

## 🏗️ Arquitectura

- **API Gateway** (Puerto 3000): Punto de entrada único para todos los servicios
- **Order Service** (Puerto 3001): Gestión de pedidos y sistema de reseñas
- **Kitchen Service** (Puerto 3002): Procesamiento de pedidos en cocina
- **Notification Service** (Puerto 3003): Notificaciones en tiempo real (SSE)
- **RabbitMQ**: Sistema de mensajería para comunicación asíncrona
- **MongoDB**: Base de datos NoSQL para persistencia

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- Node.js 20+ (para desarrollo local)
- npm o yarn

### Instalación de Dependencias

```bash
# Instalar dependencias del backend principal
npm install

# Instalar dependencias de todos los microservicios
npm run install:all

# O instalar manualmente en cada servicio
cd order-service && npm install
cd ../kitchen-service && npm install
cd ../notification-service && npm install
cd ../api-gateway && npm install
```

### Ejecutar con Docker Compose (Recomendado)

```bash
# Desde la raíz de restaurant-backend
docker-compose up -d --build

# Ver logs
docker-compose logs -f

# Detener servicios
docker-compose down
```

Esto iniciará todos los servicios:
- RabbitMQ (puerto 5672, management en 15672)
- MongoDB (puerto 27017)
- API Gateway (puerto 3000)
- Order Service (puerto 3001)
- Kitchen Service (puerto 3002)
- Notification Service (puerto 3003)

### Desarrollo Local

Para desarrollo local sin Docker:

```bash
# 1. Iniciar RabbitMQ y MongoDB (requiere Docker)
docker-compose up rabbitmq mongodb -d

# 2. En terminales separadas, iniciar cada servicio
cd api-gateway && npm run dev
cd order-service && npm run dev
cd kitchen-service && npm run dev
cd notification-service && npm run dev

# O usar el script de PowerShell
npm run services:start
```

**Nota:** Los servicios requieren que RabbitMQ (puerto 5672) y MongoDB (puerto 27017) estén corriendo.

### Scripts Disponibles

```bash
# Instalar dependencias en todos los servicios
npm run install:all

# Iniciar servicios en desarrollo
npm run services:start

# Detener servicios
npm run services:stop

# Docker
npm run docker:up              # Iniciar con Docker
npm run docker:up:build        # Iniciar reconstruyendo imágenes
npm run docker:up:detached     # Iniciar en segundo plano
npm run docker:down            # Detener y eliminar contenedores
npm run docker:logs            # Ver logs de todos los contenedores

# Tests
npm run test                   # Tests del order-service
npm run test:order            # Tests específicos del order-service
npm run test:watch            # Tests en modo watch
npm run test:all              # Todos los tests
```

## 📁 Estructura del Proyecto

```
restaurant-backend/
├── docker-compose.yml              # Configuración de Docker para todos los servicios
├── package.json                    # Scripts de gestión del monorepo
├── start-services.ps1             # Script para iniciar servicios en desarrollo
├── stop-services.ps1              # Script para detener servicios
├── TESTING_GUIDE.md               # Guía completa de testing
├── USER_STORIES.md                # Historias de usuario implementadas
├── REVIEW_SYSTEM_SUMMARY.md       # Documentación del sistema de reseñas
│
├── api-gateway/                   # 🚪 Punto de entrada único
│   ├── src/
│   │   ├── app.ts                # Configuración principal
│   │   ├── routes/               # Rutas HTTP
│   │   │   ├── orderRoutes.ts
│   │   │   ├── kitchenRoutes.ts
│   │   │   └── reviewRoutes.ts   # ⭐ Rutas de reseñas
│   │   ├── controllers/          # Controladores HTTP
│   │   ├── services/             # Cliente HTTP para microservicios
│   │   └── validators/           # Validación de requests
│   └── package.json
│
├── order-service/                 # 📝 Gestión de pedidos y reseñas
│   ├── src/
│   │   ├── app.ts
│   │   ├── models/
│   │   │   ├── Order.ts          # Modelo de pedidos
│   │   │   └── Review.ts         # ⭐ Modelo de reseñas
│   │   ├── services/
│   │   │   ├── orderService.ts
│   │   │   └── ReviewService.ts  # ⭐ Lógica de negocio de reseñas
│   │   ├── repositories/
│   │   │   └── ReviewRepository.ts # ⭐ Acceso a datos (Repository Pattern)
│   │   ├── controllers/
│   │   │   ├── OrderController.ts
│   │   │   └── ReviewController.ts # ⭐ Controlador de reseñas
│   │   └── rabbitmq/
│   │       └── rabbitmqClient.ts  # Cliente de mensajería
│   ├── tests/                     # ⭐ Tests completos (92.45% coverage)
│   │   ├── unit/
│   │   │   ├── ReviewService.test.ts
│   │   │   └── ReviewController.test.ts
│   │   └── integration/
│   │       └── ReviewAPI.test.ts
│   └── package.json
│
├── kitchen-service/               # 👨‍🍳 Procesamiento de cocina
│   ├── src/
│   │   ├── app.ts
│   │   ├── models/
│   │   │   └── KitchenOrder.ts   # Estados: RECEIVED → PREPARING → READY
│   │   ├── services/
│   │   │   └── kitchenService.ts
│   │   ├── controllers/
│   │   │   └── kitchenController.ts
│   │   └── rabbitmq/
│   │       └── rabbitmqClient.ts
│   ├── tests/
│   └── package.json
│
└── notification-service/          # 🔔 Notificaciones en tiempo real
    ├── src/
    │   ├── app.ts
    │   ├── services/
    │   │   └── notificationService.ts # SSE (Server-Sent Events)
    │   └── rabbitmq/
    │       └── rabbitmqClient.ts      # Consumer de eventos
    ├── tests/
    └── package.json
```

## 🔄 Flujo de Datos

### Flujo de Pedidos

1. **Creación de Pedido**
   - Cliente → API Gateway (`POST /orders`) → Order Service
   - Order Service guarda en MongoDB → Publica evento `order.created` en RabbitMQ
   - Kitchen Service consume evento → Actualiza estado a `RECEIVED`

2. **Procesamiento en Cocina**
   - Chef inicia preparación → API Gateway (`POST /kitchen/:id/start`) → Kitchen Service
   - Kitchen Service actualiza estado a `PREPARING` → Publica `order.preparing`
   - Notification Service notifica al cliente vía SSE

3. **Pedido Listo**
   - Chef marca como listo → API Gateway (`POST /kitchen/:id/ready`) → Kitchen Service
   - Kitchen Service actualiza estado a `READY` → Publica `order.ready`
   - Notification Service notifica al cliente vía SSE

### Flujo de Reseñas ⭐ (Nuevo)

1. **Cliente recibe pedido y deja reseña**
   - Cliente → API Gateway (`POST /reviews`) → Order Service
   - ReviewService valida y guarda en MongoDB
   - Response con datos de la reseña creada

2. **Moderación de Reseñas**
   - Admin → API Gateway (`GET /reviews`) → Lista todas las reseñas
   - Admin → API Gateway (`PATCH /reviews/:id/approve`) → Aprueba reseña
   - Admin → API Gateway (`PATCH /reviews/:id/reject`) → Rechaza reseña

3. **Consulta de Reseñas Públicas**
   - Cliente → API Gateway (`GET /reviews/public`) → Solo reseñas aprobadas
   - Filtros: rating mínimo, ordenamiento por fecha/rating

## 📊 Eventos de RabbitMQ

| Evento | Publicador | Consumidores | Payload |
|--------|-----------|--------------|---------|
| `order.created` | Order Service | Kitchen Service, Notification Service | `{ orderId, customerName, items, timestamp }` |
| `order.preparing` | Kitchen Service | Notification Service | `{ orderId, status: 'PREPARING', timestamp }` |
| `order.ready` | Kitchen Service | Notification Service | `{ orderId, status: 'READY', timestamp }` |

## 🧪 Testing

El proyecto cuenta con testing completo del sistema de reseñas con **92.45% de cobertura**.

```bash
# Tests del order-service (incluye sistema de reseñas)
cd order-service
npm test

# Tests en modo watch
npm run test:watch

# Tests con cobertura
npm run test:coverage

# Tests de integración
npm run test:integration
```

### Cobertura Actual

| Servicio | Statements | Branches | Functions | Lines |
|----------|-----------|----------|-----------|-------|
| **ReviewService** | 100% | 100% | 100% | 100% |
| **ReviewController** | 100% | 100% | 100% | 100% |
| **ReviewRepository** | 92% | 85% | 90% | 92% |
| **Global** | 92.45% | 91.30% | 93.75% | 92.45% |

Ver más detalles en:
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guía completa de testing
- [INFORME_TESTS_UNITARIOS_REVIEW.md](./order-service/INFORME_TESTS_UNITARIOS_REVIEW.md) - Informe detallado de cobertura

## 📡 API Endpoints

### Pedidos (Orders)

```http
POST   /orders              # Crear nuevo pedido
GET    /orders              # Listar todos los pedidos
GET    /orders/:id          # Obtener pedido por ID
```

### Cocina (Kitchen)

```http
GET    /kitchen             # Listar pedidos en cocina
GET    /kitchen/:id         # Obtener pedido de cocina
POST   /kitchen/:id/start   # Iniciar preparación
POST   /kitchen/:id/ready   # Marcar como listo
```

### Reseñas (Reviews) ⭐

```http
POST   /reviews                    # Crear reseña
GET    /reviews                    # Listar todas (admin)
GET    /reviews/public             # Listar solo aprobadas
GET    /reviews/:id                # Obtener por ID
PATCH  /reviews/:id/approve        # Aprobar reseña (admin)
PATCH  /reviews/:id/reject         # Rechazar reseña (admin)
DELETE /reviews/:id                # Eliminar reseña (admin)
```

Ver documentación completa en [ENDPOINTS_POSTMAN.md](./ENDPOINTS_POSTMAN.md)

## 🎯 Funcionalidades Implementadas

### ✅ Sistema de Pedidos
- Creación de pedidos con validación de items
- Tracking de estados del pedido
- Persistencia en MongoDB
- Comunicación asíncrona con RabbitMQ

### ✅ Gestión de Cocina
- Vista de pedidos pendientes
- Estados: RECEIVED → PREPARING → READY
- Actualización en tiempo real
- Publicación de eventos de estado

### ✅ Notificaciones en Tiempo Real
- Server-Sent Events (SSE) para actualizaciones en vivo
- Notificaciones de cambios de estado
- Conexión persistente con clientes

### ✅ Sistema de Reseñas (Nuevo) ⭐
- **Creación de Reseñas**
   - Validación de campos requeridos
   - Ratings (1-5 estrellas): Overall y Food
   - Comentarios opcionales (máx 500 caracteres)
   - Una reseña por pedido

### ✅ Gestión de Roles de Usuario
- Roles soportados: Administrador, Chef, Cliente
- Acceso diferenciado a endpoints y vistas según el rol
- El administrador puede moderar reseñas y acceder a analíticas
- El chef accede a la vista de cocina y actualiza estados de pedidos
- El cliente puede crear pedidos y dejar reseñas

**¿Cómo acceder?**
- El rol se define al autenticarse o seleccionar el tipo de usuario en el frontend.
- Los endpoints protegidos requieren el rol adecuado (ver documentación de endpoints y frontend).
- http://localhost:5173/login
- usuario nevardo.ospina@sofka.com.co 
- contraseña -> Sofka2025

### ✅ Dashboard Analítico
- Visualización de métricas de ventas y pedidos en tiempo real
- Filtros por rango de fechas y estado de pedido
- Gráficas de barras y líneas, tabla de datos y tarjetas de estadísticas
- Solo accesible para el rol Administrador

**¿Cómo acceder?**
- Ingresar al frontend (http://localhost:5173/login) y autenticarse como Administrador
- usuario nevardo.ospina@sofka.com.co 
- contraseña -> Sofka2025


  

- **Moderación de Contenido**
  - Estados: PENDING → APPROVED/REJECTED
  - Panel de administración
  - Filtrado por estado de moderación

- **Consultas Públicas**
  - Solo reseñas aprobadas
  - Filtros por rating mínimo
  - Ordenamiento por fecha/rating

- **Arquitectura SOLID**
  - Repository Pattern para acceso a datos
  - Service Layer para lógica de negocio
  - Dependency Injection
  - Tests completos (92.45% coverage)

## 📚 Documentación Adicional

- [USER_STORIES.md](./USER_STORIES.md) - Historias de usuario completas
- [REVIEW_SYSTEM_SUMMARY.md](./REVIEW_SYSTEM_SUMMARY.md) - Documentación del sistema de reseñas
- [TESTING_GUIDE.md](./TESTING_GUIDE.md) - Guía de testing
- [ENDPOINTS_POSTMAN.md](./ENDPOINTS_POSTMAN.md) - Colección de endpoints
- [INSTRUCTIONS_HU_REVIEW.md](./INSTRUCTIONS_HU_REVIEW.md) - Instrucciones de implementación

## 🛠️ Tecnologías Utilizadas

### Backend
- **Node.js 20+** - Runtime de JavaScript
- **TypeScript 5.9** - Superset tipado de JavaScript
- **Express 5** - Framework web
- **MongoDB 9** - Base de datos NoSQL
- **Mongoose** - ODM para MongoDB
- **RabbitMQ** - Message broker
- **amqplib** - Cliente de RabbitMQ

### Testing
- **Jest 30** - Framework de testing
- **Supertest** - Testing de APIs HTTP
- **MongoDB Memory Server** - MongoDB en memoria para tests
- **ts-jest** - Soporte de TypeScript en Jest

### DevOps
- **Docker & Docker Compose** - Containerización
- **ESLint** - Linter de código
- **Prettier** - Formateador de código

## 🔧 Configuración de Entorno

### Variables de Entorno

Cada servicio puede configurarse con las siguientes variables:

**Order Service**
```env
PORT=3001
MONGODB_URI=mongodb://localhost:27017/restaurant-orders
RABBITMQ_URL=amqp://localhost:5672
```

**Kitchen Service**
```env
PORT=3002
MONGODB_URI=mongodb://localhost:27017/restaurant-kitchen
RABBITMQ_URL=amqp://localhost:5672
```

**Notification Service**
```env
PORT=3003
RABBITMQ_URL=amqp://localhost:5672
```

**API Gateway**
```env
PORT=3000
ORDER_SERVICE_URL=http://localhost:3001
KITCHEN_SERVICE_URL=http://localhost:3002
NOTIFICATION_SERVICE_URL=http://localhost:3003
```

## 🐛 Troubleshooting

### RabbitMQ no se conecta
```bash
# Verificar que RabbitMQ esté corriendo
docker ps | grep rabbitmq

# Ver logs de RabbitMQ
docker-compose logs rabbitmq

# Reiniciar RabbitMQ
docker-compose restart rabbitmq
```

### MongoDB no se conecta
```bash
# Verificar que MongoDB esté corriendo
docker ps | grep mongo

# Ver logs de MongoDB
docker-compose logs mongodb

# Conectar con MongoDB Compass
mongodb://localhost:27017
```

### Servicios no inician
```bash
# Ver logs de todos los servicios
docker-compose logs -f

# Ver logs de un servicio específico
docker-compose logs -f order-service

# Reconstruir contenedores
docker-compose down
docker-compose up --build
```

### Tests fallan
```bash
# Limpiar cache de Jest
npm run test -- --clearCache

# Ejecutar un solo archivo de test
npm test -- ReviewService.test.ts

# Ver más detalles
npm test -- --verbose
```

## 👥 Equipo de Desarrollo

**Grupo 2 - Taller de Scramble Refactor**
- Implementación de microservicios
- Sistema de reseñas con SOLID
- Testing completo (>90% coverage)
- Documentación exhaustiva

## 📄 Licencia

ISC
