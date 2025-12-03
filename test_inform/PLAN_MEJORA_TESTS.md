# Plan para Mejorar los Tests Unitarios

## Objetivo
Aumentar la cobertura y calidad de los tests unitarios en el proyecto, priorizando los archivos con menor cobertura.

## Paso 1: Diagnóstico Inicial
- Revisar el reporte de cobertura para identificar los archivos con menor cobertura (especialmente los que tienen 0%).
- Listar los módulos críticos y dependencias externas que requieren mocks.

## Paso 2: Priorización de Archivos
1. Archivos con 0% de cobertura:
   - `src/app.ts`
   - `src/controllers/kitchenController.ts`
   - `src/routes/kitchenRoutes.ts`
   - `src/routes/orderRoutes.ts`
2. Archivos con cobertura baja:
   - `src/services/baseHttpClient.ts`
   - `src/services/httpClient.ts`
   - `src/utils/httpResponse.ts`
   - `src/validators/orderValidator.ts`
   - `src/config/index.ts`

## Paso 3: Preparación del Entorno
- Asegurarse de tener Jest y dependencias instaladas.
- Configurar mocks para dependencias externas (bases de datos, servicios HTTP, RabbitMQ, etc.).

## Paso 4: Creación de Nuevos Tests
- Por cada archivo priorizado:
  1. Analizar las funciones exportadas y su lógica.
  2. Escribir tests unitarios para cada función pública.
  3. Incluir casos de éxito, error y casos borde.
  4. Usar mocks para aislar dependencias externas.

## Paso 5: Ejecución y Revisión
- Ejecutar `npm run test:coverage` tras agregar cada set de tests.
- Revisar el reporte de cobertura y ajustar tests según sea necesario.

## Paso 6: Refactorización y Mejora Continua
- Refactorizar código si es difícil de testear (aplicar principios SOLID).
- Repetir el proceso para nuevos archivos o funcionalidades.

## Paso 7: Documentación
- Documentar los tests agregados y las decisiones de diseño.
- Mantener actualizado el reporte de cobertura.

---