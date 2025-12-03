# Resumen de Arquitectura y Configuración

## Arquitectura General
El proyecto está basado en microservicios, cada uno con su propio código, dependencias y configuración. Los servicios principales son:

- **api-gateway**
- **kitchen-service**
- **notification-service**
- **order-service**
- **restaurant-frontend** (no incluido en el adjunto, pero presente en la estructura)

Cada servicio tiene su propio Dockerfile y configuración de tests.

## Lenguajes Usados
- **Backend:** TypeScript (Node.js)
- **Frontend:** JavaScript/React
- **Infraestructura:** Docker, docker-compose, PowerShell (scripts .ps1)

## Estructura de Carpetas
- Cada microservicio contiene:
  - `src/` (código fuente)
  - `controllers/`, `routes/`, `services/`, `models/`, `types/`
  - `tests/` o `__tests__/` (pruebas unitarias e integración)
  - Archivos de configuración: `package.json`, `tsconfig.json`, `jest.config.js`, `Dockerfile`, `.dockerignore`

## Variables de Entorno Comunes
Aunque no hay archivos `.env` adjuntos, las variables de entorno típicas pueden ser:

- `PORT`: Puerto de escucha del servicio
- `NODE_ENV`: Entorno de ejecución (development, production, test)
- `DATABASE_URL` o parámetros de conexión a base de datos
- `RABBITMQ_URL` o parámetros de conexión a RabbitMQ
- `API_GATEWAY_URL`: URL del API Gateway
- `JWT_SECRET`: Clave secreta para autenticación (si aplica)
- `SERVICE_NAME`: Nombre del microservicio

## Configuración de Tests
- Uso de **Jest** para pruebas unitarias e integración
- Mocks para dependencias externas (por ejemplo, `__mocks__/rabbitmqClient.ts`)

## Infraestructura
- **Docker** y **docker-compose** para orquestar los servicios
- Scripts PowerShell para iniciar y detener servicios (`start-services.ps1`, `stop-services.ps1`)

## Resumen
- **Arquitectura:** Microservicios (Node.js/TypeScript)
- **Lenguajes:** TypeScript, JavaScript, Docker, PowerShell
- **Variables de entorno:** Puertos, bases de datos, RabbitMQ, configuración de entorno
- **Testing:** Jest
- **Orquestación:** Docker Compose

---
