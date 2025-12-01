# INSTRUCTIONS_HU_DashboardAnalíticas.md

Título: Instrucciones técnicas para implementar la HU — Dashboard de Analíticas de Ventas y Rendimiento

Estado: Listo para producción
Responsables: Backend Team
Versión: 1.0

1. Introducción
Objetivo
Implementar un módulo de analíticas en el backend que permita visualizar métricas clave de negocio (totalOrders, totalRevenue, productsSold, topNProducts, avgPrepTime), filtrar por rangos de fechas y agrupar por periodos (día, semana, mes, año), además de exportar dichos datos en formato CSV. Debe integrarse con la arquitectura existente basada en microservicios (API Gateway, Order Service, Kitchen Service, Notification Service), usar MongoDB para agregaciones y RabbitMQ solo si se requiere procesamiento asíncrono.

Alcance
- Endpoints REST expuestos a través del API Gateway para consultar métricas y exportar CSV.
- Agregaciones en Order Service sobre la colección de órdenes.
- Opcional: métricas de cocina (avgPrepTime) integradas desde Kitchen Service si existe la fuente; si no, se calculará desde timestamps en órdenes.
- Respuestas estandarizadas compatibles con el frontend.
- Manejo de ausencia de datos con mensaje exacto: "No hay datos disponibles para el período seleccionado".

Contexto del proyecto
- API Gateway: fachada HTTP y formateo consistente de respuestas. Referencia: [`api-gateway.BaseHttpClient`](api-gateway/src/services/baseHttpClient.ts)
- Order Service: persistencia de órdenes en MongoDB (Mongoose). Referencia de modelo: [`order-service.Order` model](order-service/src/models/Order.ts)
- Kitchen Service: tiempos de preparación (si aplica). Referencia de servicio: [`kitchen-service.KitchenService`](kitchen-service/src/services/kitchenService.ts)

2. Arquitectura
Componentes
- API Gateway: expone endpoints /admin/analytics y /admin/analytics/export; aplica RBAC (roles manager/admin) y delega llamadas a servicios internos.
- Order Service (Reports Module): agrega datos de órdenes con pipelines MongoDB; provee DTOs estables para el Gateway.
- Kitchen Service (opcional): provee tiempos de preparación si están almacenados por ítem o pedido.
- Notification Service: no participa directamente en esta HU.

Patrones de diseño
- Repository: encapsular acceso a MongoDB para órdenes (OrderRepository).
- Strategy: estrategia de agrupación por periodos (Day/Week/Month/Year) con funciones inyectables.
- DTOs: definir respuestas claras para AnalyticsResponse y CSVExportRequest.
- CQRS: separar lectura (queries) en un módulo de reporting; no mezclar con comandos de negocio.
- Factory (opcional): creación de adaptadores/estrategias de agrupación basada en groupBy.

SOLID
- SRP: controlador de analytics solo orquesta; repositorio hace agregaciones; strategy agrupa; CSV exporter transforma a texto.
- OCP: añadir nuevos KPIs sin modificar lógica central (registrarlos en la Strategy/Mapper).
- DIP: inyectar repositorio y estrategia en servicios; API Gateway llama interfaces en lugar de implementaciones concretas.

3. Modelo de datos
Fuente principal: orders (MongoDB)
Se asume esquema base con campos:
- orderNumber: string
- createdAt: Date
- status: string
- items: [{ productId: string, name: string, quantity: number, unitPrice: number }]
- total: number
- timestamps de preparación (si existen): preparingStartedAt?: Date, readyAt?: Date

Índices recomendados
- { createdAt: 1 }
- { status: 1 }
- { "items.productId": 1 }

Documentos auxiliares (opcional)
- kitchen_orders o timestamps por ítem (si proviene de Kitchen Service).

Objetos de transferencia (DTOs)

AnalyticsQueryDTO
{
  "from": "YYYY-MM-DD",
  "to": "YYYY-MM-DD",
  "groupBy": "day|week|month|year",
  "top": 10
}

AnalyticsResponseDTO
{
  "range": { "from": "YYYY-MM-DD", "to": "YYYY-MM-DD", "groupBy": "month" },
  "summary": {
    "totalOrders": 1234,
    "totalRevenue": 45678.90,
    "avgPrepTime": 12.5
  },
  "series": [
    {
      "period": "2025-11",
      "totalOrders": 100,
      "totalRevenue": 3500.25,
      "avgPrepTime": 11.2
    }
  ],
  "productsSold": [
    { "productId": "p-101", "name": "Pizza", "quantity": 250, "revenue": 1250.00 }
  ],
  "topNProducts": [
    { "productId": "p-101", "name": "Pizza", "quantity": 250, "revenue": 1250.00 }
  ],
  "message": null
}

CSVExportRequestDTO
{
  "from": "YYYY-MM-DD",
  "to": "YYYY-MM-DD",
  "groupBy": "day|week|month|year",
  "top": 10,
  "columns": ["period", "totalOrders", "totalRevenue", "productId", "productName", "quantity", "avgPrepTime"]
}

CSVExportResponse (streamed)
- Cabeceras: Content-Type: text/csv; charset=utf-8
- Content-Disposition: attachment; filename="analytics_YYYYMMDD-YYYYMMDD.csv"
- Cuerpo: CSV en streaming

4. Endpoints
Expuestos por API Gateway

GET /admin/analytics
Descripción: Devuelve métricas de negocio filtradas por rango y agrupación de periodo.
Query params:
- from (YYYY-MM-DD) requerido
- to (YYYY-MM-DD) requerido
- groupBy (day|week|month|year) requerido
- top (number, opcional, default 10)
Respuestas:
- 200 OK con AnalyticsResponseDTO
- 204 No Content con body: { "message": "No hay datos disponibles para el período seleccionado" }
- 400 Bad Request con errores de validación
- 401 Unauthorized / 403 Forbidden según RBAC
- 500 Internal Server Error (error técnico)

POST /admin/analytics/export
Descripción: Devuelve CSV descargable con las métricas del rango y agrupación.
Body: CSVExportRequestDTO
Respuestas:
- 200 OK con Content-Disposition y contenido CSV (stream)
- 204 No Content con body: { "message": "No hay datos disponibles para el período seleccionado" }
- 400 / 401 / 403 / 500 según casos

Servicios internos
Order Service
- GET /internal/analytics (no expuesto públicamente; llamado por Gateway)
- POST /internal/analytics/export (stream de CSV)

Referencias de código existentes
- Gateway HTTP client: [`api-gateway.BaseHttpClient`](api-gateway/src/services/baseHttpClient.ts)
- Modelo de órdenes: [`order-service.Order` model](order-service/src/models/Order.ts)

5. Flujo de alto nivel
- UI solicita métricas:
  1) El frontend envía GET /admin/analytics?from=&to=&groupBy=&top=
  2) API Gateway valida parámetros, verifica RBAC y llama Order Service /internal/analytics con los mismos parámetros usando [`api-gateway.BaseHttpClient`](api-gateway/src/services/baseHttpClient.ts)
  3) Order Service ejecuta pipeline de agregación en MongoDB:
     - $match por createdAt dentro del rango
     - $unwind items
     - $group por periodo (Strategy: day/week/month/year) y por producto para productsSold
     - $group adicional para summary (totalOrders, totalRevenue)
     - cálculo avgPrepTime (usar diferencias entre preparingStartedAt y readyAt si están disponibles; si no, devolver null)
  4) Order Service retorna DTO AnalyticsResponseDTO
  5) API Gateway formatea respuesta para el frontend; si no hay datos, responde 204 con mensaje requerido
- Export CSV:
  1) Frontend envía POST /admin/analytics/export con el mismo payload de consulta
  2) Gateway valida, aplica RBAC y solicita a Order Service el stream CSV
  3) Order Service genera CSV en stream a partir del mismo pipeline
  4) Gateway proxyea el stream con cabeceras adecuadas

6. Validaciones exactas
Nivel API Gateway
- from: formato YYYY-MM-DD; requerido
- to: formato YYYY-MM-DD; requerido; to >= from
- groupBy: uno de ["day","week","month","year"]; requerido
- top: entero > 0 y <= 100; opcional (por defecto 10)
- Autorización: rol en JWT debe incluir "manager" o "admin"; de lo contrario:
  - 401 si falta token
  - 403 si rol insuficiente

Nivel Order Service
- Rango de fechas: convertir a fechas con timezone coherente (UTC recomendado)
- Manejo de ausencia de datos: si pipeline devuelve 0 documentos:
  - Responder 204 con body: { "message": "No hay datos disponibles para el período seleccionado" }
- avgPrepTime:
  - Si faltan timestamps, devolver null y no calcular
- Robustez:
  - Limitar el rango máximo (p. ej., 1 año) configurable; si excede, 400 con error: "El rango de fechas excede el máximo permitido"

Mensajes de error estandarizados
- 400: { "error": "VALIDATION_ERROR", "details": [{ "field": "from", "message": "Formato inválido (YYYY-MM-DD)" }] }
- 401: { "error": "UNAUTHORIZED", "message": "Token requerido" }
- 403: { "error": "FORBIDDEN", "message": "Rol insuficiente para acceder a analíticas" }
- 500: { "error": "INTERNAL_ERROR", "message": "Error interno procesando la solicitud" }

7. Consideraciones de seguridad
- RBAC en Gateway (manager/admin) para ambos endpoints.
- Sanitización y validación de parámetros (evitar inyección en queries).
- Timeouts y retry en llamadas del Gateway al Order Service (usar [`api-gateway.BaseHttpClient`](api-gateway/src/services/baseHttpClient.ts) con configuración de tiempo de espera).
- No exponer endpoints /internal directamente al público.
- Auditoría (opcional): registrar acceso a analíticas (userId, rango, groupBy) en audit_logs.

8. Checklist técnico
- [ ] Crear módulo Analytics en Order Service: servicio + repositorio + estrategias de agrupación
- [ ] Definir interfaces: IAnalyticsRepository, IGroupingStrategy, ICSVExporter
- [ ] Implementar pipeline MongoDB con índices adecuados
- [ ] Crear endpoints internos en Order Service: /internal/analytics y /internal/analytics/export
- [ ] Implementar en API Gateway endpoints públicos /admin/analytics y /admin/analytics/export
- [ ] Validación estricta de parámetros en Gateway
- [ ] RBAC middleware para roles manager/admin
- [ ] Manejo de ausencia de datos: responder 204 con mensaje requerido
- [ ] Generación de CSV en stream con Content-Disposition
- [ ] Tests: unit (estrategias y repositorio), integración (Order Service + MongoMemoryServer), contrato (Gateway ↔ Order Service)
- [ ] Documentar en [ENDPOINTS_POSTMAN.md](ENDPOINTS_POSTMAN.md)

9. Preguntas abiertas
- ¿avgPrepTime debe calcularse por pedido o por ítem? Si por ítem, Kitchen Service debe exponer tiempos por item o persistir en orders.
- ¿Rango máximo permitido para consultas? Propuesta: 12 meses.
- ¿Se requiere paginación para productsSold/topNProducts en rangos grandes?
- ¿Se necesita incluir impuestos/fees en totalRevenue o es neto?
- ¿Formato de CSV debe incluir separador configurable (coma/semicolon)?

10. Notas finales
- Mantener separación CQRS: no mezclar estas consultas con lógica de creación/actualización de pedidos.
- Evitar singletons acoplados: inyectar repositorios y estrategias en servicios (DIP).
- Usar DTOs consistentes entre servicios y Gateway.

11. Formatos JSON exactos
Ejemplo de respuesta 200 (AnalyticsResponseDTO)
{
  "range": { "from": "2025-10-01", "to": "2025-10-31", "groupBy": "month" },
  "summary": {
    "totalOrders": 345,
    "totalRevenue": 15890.50,
    "avgPrepTime": 13.4
  },
  "series": [
    { "period": "2025-10", "totalOrders": 345, "totalRevenue": 15890.50, "avgPrepTime": 13.4 }
  ],
  "productsSold": [
    { "productId": "p-101", "name": "Pizza Margarita", "quantity": 120, "revenue": 720.00 },
    { "productId": "p-102", "name": "Lasaña", "quantity": 80, "revenue": 560.00 }
  ],
  "topNProducts": [
    { "productId": "p-101", "name": "Pizza Margarita", "quantity": 120, "revenue": 720.00 },
    { "productId": "p-102", "name": "Lasaña", "quantity": 80, "revenue": 560.00 }
  ],
  "message": null
}

Ejemplo de respuesta 204 (No Content)
{
  "message": "No hay datos disponibles para el período seleccionado"
}

Ejemplo de error 400
{
  "error": "VALIDATION_ERROR",
  "details": [
    { "field": "from", "message": "Formato inválido (YYYY-MM-DD)" },
    { "field": "groupBy", "message": "Debe ser uno de: day, week, month, year" }
  ]
}

12. Mensajes de respuesta exactos para el frontend
- Éxito (200):
  - Título: "Analíticas generadas"
  - Descripción: "Se han calculado las métricas para el rango seleccionado."
- Sin datos (204):
  - Título: "Sin datos"
  - Descripción: "No hay datos disponibles para el período seleccionado"
- Error de validación (400):
  - Título: "Parámetros inválidos"
  - Descripción: "Revisa el rango de fechas y el periodo de agrupación."
- No autorizado (401/403):
  - Título: "Acceso restringido"
  - Descripción: "No cuentas con permisos para visualizar analíticas."
- Error interno (500):
  - Título: "Error del servidor"
  - Descripción: "Ocurrió un problema procesando la solicitud. Intenta nuevamente."

13. 📌 Requerimientos Tecnológicos Pendientes de Aprobación
- Librería para exportar CSV (si no existe utilitario común):
  - Propuesta: usar generación manual de CSV desde Node (join + escape) para control fino; confirmar si se puede usar una librería ligera (ej. fast-csv).
- MongoDB versión:
  - Confirmar disponibilidad de operadores $dateTrunc; si no, usar $dateToString con formato y normalización semanal.
- Métrica avgPrepTime:
  - Confirmar la fuente de tiempos (Order Service vs Kitchen Service). Si se requiere integración, exponer timestamps desde Kitchen Service.

14. Diseño técnico detallado (interno del Order Service)
Interfaces
IAnalyticsRepository
- getAnalytics(query: AnalyticsQueryDTO): Promise<AnalyticsResponseDTO>
- streamCsv(query: CSVExportRequestDTO): NodeJS.ReadableStream

IGroupingStrategy
- groupStage(groupBy: 'day'|'week'|'month'|'year'): BSON.Document (devuelve $group/$project necesarios)
- periodFormatter(date): string (formatea periodo para DTO)

Implementación
- AnalyticsRepository (Mongoose): ejecuta pipeline con stages:
  1) $match: createdAt in [from, to]
  2) $unwind: "$items"
  3) $group: por periodo + acumuladores (count, sum totalRevenue)
  4) $group products: por productId/name con sum(quantity) y sum(revenue)
  5) $project: period, totals, avgPrepTime (si timestamps disponibles)
  6) $sort: por periodo asc
- Strategy:
  - day: $dateToString { format: "%Y-%m-%d", date: "$createdAt" }
  - week: $dateToString normalizando al lunes (o $dateTrunc si disponible)
  - month: $dateToString { format: "%Y-%m" }
  - year: $dateToString { format: "%Y" }

CSV Export
- Columnas: period,totalOrders,totalRevenue,productId,productName,quantity,avgPrepTime
- Generación: stream desde cursor de aggregate; escapado de comas y comillas.

15. Integración en API Gateway
- Controller /admin/analytics:
  - Valida query, verifica rol y llama a Order Service con [`api-gateway.BaseHttpClient`](api-gateway/src/services/baseHttpClient.ts)
  - Si body vacío (sin data), responde 204 con mensaje requerido
- Controller /admin/analytics/export:
  - Valida body y roles
  - Solicita stream al Order Service y proxyea con Content-Disposition

16. Consideraciones de rendimiento
- Limitar el rango máximo (configurable)
- Usar índices y proyección mínima
- Stream en export CSV para grandes volúmenes
- Cache (opcional) por combinaciones frecuentes de rango/groupBy/top

17. Estrategia de pruebas
- Unit: estrategias de grupo y formateadores de periodos
- Integración: AnalyticsRepository con mongodb-memory-server
- Contrato: Gateway ↔ Order Service (shape de DTOs)
- E2E (opcional): Docker Compose con datos semilla y validación de endpoints

Referencias del workspace
- [`api-gateway.BaseHttpClient`](api-gateway/src/services/baseHttpClient.ts)
- [`order-service.Order` model](order-service/src/models/Order.ts)
- [`kitchen-service.KitchenService`](kitchen-service/src/services/kitchenService.ts)
- Documentación existente: [ENDPOINTS_POSTMAN.md](ENDPOINTS_POSTMAN.md), [EJEMPLO_FRONTEND.md](EJEMPLO_FRONTEND.md)

Fin del documento.