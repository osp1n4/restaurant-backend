# Restaurant Backend - Sistema de Pedidos

Sistema de procesamiento de pedidos para restaurante con arquitectura de microservicios.

<img width="1863" height="349" alt="image" src="https://github.com/user-attachments/assets/27d49b0e-7f84-4b1a-bcf9-d7134419b373" />


## 🏗️ Arquitectura

- **API Gateway** (Puerto 3000): Punto de entrada único
- **Order Service** (Puerto 3001): Gestión de pedidos
- **Kitchen Service** (Puerto 3002): Procesamiento de pedidos en cocina
- **Notification Service** (Puerto 3003): Notificaciones de estados

## 🚀 Inicio Rápido

### Prerrequisitos

- Docker y Docker Compose instalados
- Node.js 20+ (para desarrollo local)

### Ejecutar con Docker Compose

```bash
# Desde la raíz de restaurant-backend
docker-compose up --build
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
# En cada servicio
cd api-gateway
npm install
npm run dev

# Repetir para order-service, kitchen-service, notification-service
```

**Nota:** Necesitarás tener RabbitMQ y MongoDB corriendo localmente.

## 📁 Estructura

```
restaurant-backend/
├── docker-compose.yml
├── api-gateway/
│   ├── src/
│   │   ├── app.ts
│   │   ├── routes/
│   │   └── controllers/
│   └── package.json
├── order-service/
│   ├── src/
│   │   ├── app.ts
│   │   ├── models/
│   │   ├── services/
│   │   └── rabbitmq/
│   └── package.json
├── kitchen-service/
│   ├── src/
│   │   ├── app.ts
│   │   ├── services/
│   │   └── rabbitmq/
│   └── package.json
└── notification-service/
    ├── src/
    │   ├── app.ts
    │   └── rabbitmq/
    └── package.json
```

## 🔄 Flujo de Datos

1. Cliente crea pedido → API Gateway → Order Service → RabbitMQ (order.created)
2. Kitchen Service consume order.created → Procesa → RabbitMQ (order.ready)
3. Notification Service consume ambos eventos → Logs en consola

## 🧪 Testing

```bash
# En cada servicio con tests
npm test
```

## 📝 TODO

- [ ] Implementar lógica de negocio en cada servicio
- [ ] Configurar conexiones a MongoDB
- [ ] Configurar RabbitMQ (publicar/consumir eventos)
- [ ] Implementar endpoints en API Gateway
- [ ] Completar tests

