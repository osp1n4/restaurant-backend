# TEST PLAN - Delicious Kitchen
**Plan de Pruebas Integral**  
**Proyecto:** Delicious Kitchen - Sistema de Pedidos de Restaurante  
**Versión:** 1.0  
**Fecha:** 18 de diciembre de 2025  
**Responsable:** Equipo de QA

---

## 1. RESUMEN EJECUTIVO

### 1.1 Propósito
Este documento define la estrategia, alcance, recursos, cronograma y entregables para las pruebas del sistema Delicious Kitchen, una aplicación de gestión de pedidos que incluye frontend SPA (React), backend basado en microservicios (Node.js/TypeScript), comunicación asíncrona (RabbitMQ), y autenticación Firebase.

### 1.2 Alcance del Proyecto
- **Frontend:** Panel de Cliente, Panel de Cocina, Panel de Administración
- **Backend:** 5 microservicios (API Gateway, Order Service, Kitchen Service, Review Service, Notification Service)
- **Integraciones:** Firebase Auth, RabbitMQ, MongoDB
- **Funcionalidades:** Gestión de pedidos, notificaciones en tiempo real (SSE), reseñas, analíticas, usuarios

### 1.3 Objetivos de las Pruebas
1. Verificar que todas las 40 historias de usuario (US-001 a US-040) cumplen sus criterios de aceptación
2. Garantizar la integridad de datos entre microservicios
3. Validar sincronización de estados vía RabbitMQ
4. Asegurar rendimiento (LCP <2.5s, recálculos <1s)
5. Verificar seguridad (contraseñas cifradas, sanitización de inputs)
6. Confirmar cobertura de código ≥85%

---

## 2. ALCANCE DE PRUEBAS

### 2.1 Funcionalidades en Alcance

#### **Módulo Cliente (US-001 a US-014, US-022, US-025, US-033)**
- [x] Visualización de menú con lazy loading
- [x] Gestión del carrito de compras
- [x] Creación y modificación de pedidos
- [x] Cancelación de pedidos (estado permitido)
- [x] Recepción de notificaciones SSE en tiempo real
- [x] Creación de reseñas post-pedido
- [x] Visualización de reseñas aprobadas
- [x] Cambio de idioma (i18n)

#### **Módulo Cocina (US-006 a US-008, US-011, US-012, US-040)**
- [x] Visualización de pedidos pendientes
- [x] Marcado de pedidos ("Comenzar a cocinar", "Listo")
- [x] Recepción de notificaciones de nuevos pedidos (RabbitMQ)
- [x] Actualización automática al recibir modificaciones/cancelaciones

#### **Módulo Administración (US-015 a US-020, US-023, US-024, US-026 a US-032)**
- [x] Gestión de usuarios (crear, editar roles, activar/desactivar)
- [x] Moderación de reseñas (aprobar/ocultar)
- [x] Dashboard de analíticas con métricas clave
- [x] Filtrado de reportes por fecha
- [x] Exportación de datos a XLSX
- [x] Visualización de producto más vendido

#### **Módulo Autenticación (US-016, US-021, US-037)**
- [x] Login con Firebase Auth
- [x] Persistencia de sesión (10 min inactividad)
- [x] Protección de contraseñas (bcryptjs + HTTPS)

#### **Módulo Notificaciones (US-009, US-010, US-014)**
- [x] SSE para notificaciones en tiempo real
- [x] Confirmaciones de cambio de estado
- [x] Notificaciones de cancelación

#### **Infraestructura y Calidad (US-034 a US-039)**
- [x] Contenerización con Docker Compose
- [x] Comunicación asíncrona con RabbitMQ
- [x] Validación de estándares de código (ESLint)
- [x] Cobertura de pruebas ≥85%
- [x] Manejo centralizado de errores

### 2.2 Funcionalidades Fuera de Alcance
- Pagos en línea (no implementado)
- Integración con servicios de delivery externos
- Sistema de inventario automatizado
- Notificaciones push móviles nativas

### 2.3 Tipos de Pruebas

| Tipo de Prueba | Alcance | Herramientas | Responsable |
|----------------|---------|--------------|-------------|
| **Unitarias** | Funciones, hooks, servicios | Jest, React Testing Library | Desarrolladores |
| **Integración** | Comunicación entre servicios, RabbitMQ, MongoDB | Jest, Supertest | QA + Dev |
| **End-to-End** | Flujos completos de usuario | Cypress/Playwright | QA |
| **API** | Endpoints REST, validación de respuestas | Postman/Newman | QA |
| **Rendimiento** | LCP, tiempos de respuesta | Lighthouse, K6 | QA Performance |
| **Seguridad** | Sanitización, autenticación, autorización | OWASP ZAP, manual | Security Team |
| **Compatibilidad** | Navegadores (Chrome, Firefox, Safari, Edge) | BrowserStack | QA |
| **Regresión** | Suite completa post-cambios | Automated Suite | CI/CD |

---

## 3. ESTRATEGIA DE PRUEBAS

### 3.1 Enfoque de Testing

**Pirámide de Pruebas:**
```
        /\
       /  \  E2E (10%)
      /----\
     /      \  Integración (30%)
    /--------\
   /          \  Unitarias (60%)
  /--------------\
```

**Principios:**
1. **Shift-Left:** Pruebas tempranas en el ciclo de desarrollo
2. **Automatización Continua:** 90% de casos automatizados
3. **Test-Driven:** Escribir tests antes de implementar (cuando sea posible)
4. **Risk-Based:** Priorizar funcionalidades críticas (pedidos, notificaciones, pagos)

### 3.2 Niveles de Prueba

#### **Nivel 1: Pruebas Unitarias (60%)**
- **Objetivo:** Verificar componentes aislados
- **Scope:** Funciones puras, custom hooks, servicios, utilidades
- **Criterio de Éxito:** ≥85% cobertura de líneas/ramas
- **Frecuencia:** Cada commit (pre-commit hook)

**Ejemplos:**
- `passwordEncryption.test.js` - Validar cifrado bcryptjs
- `useNotification.test.js` - Mock de EventSource SSE
- `analyticsService.test.js` - Cálculos de métricas financieras
- `orderValidation.test.js` - Validación de campos requeridos

#### **Nivel 2: Pruebas de Integración (30%)**
- **Objetivo:** Verificar interacciones entre componentes
- **Scope:** API Routes, RabbitMQ consumers, MongoDB queries
- **Criterio de Éxito:** Todos los flujos críticos pasan
- **Frecuencia:** Cada Pull Request

**Ejemplos:**
- `order-service-integration.test.js` - CRUD de pedidos + MongoDB
- `rabbitmq-communication.test.js` - Publisher → Consumer flow
- `sse-notifications.test.js` - Notification Service → Frontend stream
- `review-moderation.test.js` - Admin aprueba → Cliente ve reseña

#### **Nivel 3: Pruebas End-to-End (10%)**
- **Objetivo:** Validar flujos de usuario completos
- **Scope:** Happy paths y escenarios críticos
- **Criterio de Éxito:** 100% de casos E2E pasan antes de release
- **Frecuencia:** Antes de cada deploy a staging/producción

**Ejemplos:**
- `order-flow.e2e.js` - Cliente crea pedido → Cocina marca listo → Cliente recibe notificación
- `user-management.e2e.js` - Admin crea usuario → Usuario inicia sesión → Verifica permisos
- `review-lifecycle.e2e.js` - Cliente deja reseña → Admin modera → Reseña visible públicamente

### 3.3 Criterios de Entrada y Salida

**Criterios de Entrada (para iniciar pruebas):**
- ✅ Código completado y en rama de desarrollo
- ✅ Documentación de US actualizada
- ✅ Entorno de testing configurado (Docker Compose)
- ✅ Datos de prueba preparados (seeds)
- ✅ Build exitoso (sin errores de ESLint)

**Criterios de Salida (para cerrar ciclo de pruebas):**
- ✅ Cobertura de código ≥85%
- ✅ 0 bugs críticos abiertos
- ✅ ≤3 bugs menores abiertos (con workaround)
- ✅ Todos los casos de prueba de alta prioridad ejecutados
- ✅ Reporte de pruebas generado y revisado
- ✅ Sign-off del Product Owner

---

## 4. RECURSOS

### 4.1 Equipo de Pruebas

| Rol | Nombre | Responsabilidades | Dedicación |
|-----|--------|-------------------|------------|
| **QA Lead** | TBD | Planificación, coordinación, reportes | 100% |
| **QA Engineer** | TBD | Ejecución de pruebas manuales y automatizadas | 100% |
| **Automation Engineer** | TBD | Desarrollo de frameworks de testing | 100% |
| **Developer (Testing Support)** | Equipo Dev | Soporte en pruebas unitarias e integración | 30% |
| **Product Owner** | TBD | Validación de aceptación | 20% |

### 4.2 Infraestructura y Herramientas

#### **Entornos de Prueba**
| Entorno | Propósito | URL | Estado |
|---------|-----------|-----|--------|
| **Local** | Desarrollo y debugging | localhost | ✅ Activo |
| **Testing** | Pruebas automatizadas (CI/CD) | test.deliciouskitchen.local | ✅ Activo |
| **Staging** | Pruebas de aceptación y UAT | staging.deliciouskitchen.com | 🔄 En configuración |
| **Production** | Validación post-deploy | www.deliciouskitchen.com | 🔒 Protegido |

#### **Stack de Herramientas**
| Categoría | Herramienta | Versión | Uso |
|-----------|-------------|---------|-----|
| **Unitarias** | Jest | 29.x | Tests JS/TS, mocks |
| **Frontend** | React Testing Library | 14.x | Componentes React |
| **E2E** | Cypress | 13.x | Flujos de usuario |
| **API** | Postman + Newman | Latest | Colecciones de tests |
| **Performance** | Lighthouse CI | Latest | Métricas Core Web Vitals |
| **Coverage** | Istanbul/NYC | Latest | Reportes de cobertura |
| **CI/CD** | GitHub Actions | N/A | Automatización |
| **Gestión de Casos** | TestRail / Jira | Latest | Seguimiento |
| **Bug Tracking** | Jira | Latest | Gestión de defectos |

### 4.3 Datos de Prueba

**Estrategia de Datos:**
- **Seeds Automatizados:** Scripts en `src/__tests__/seeds/` para poblar BD de testing
- **Usuarios de Prueba:**
  - Admin: `admin@test.com` / `Test1234!`
  - Cocina: `kitchen@test.com` / `Test1234!`
  - Cliente: `customer@test.com` / `Test1234!`
- **Productos:** Mínimo 25 productos en diferentes categorías
- **Pedidos:** Estados variados (pending, preparing, ready, delivered, cancelled)

---

## 5. CRONOGRAMA DE PRUEBAS

### 5.1 Fases de Ejecución

| Fase | Duración | Actividades | Entregables |
|------|----------|-------------|-------------|
| **Planificación** | Semana 1 | - Revisión de backlog<br>- Definición de casos<br>- Setup de entorno | - Test Plan<br>- Test Cases Document |
| **Preparación** | Semana 2 | - Creación de datos<br>- Automatización de tests<br>- Configuración CI/CD | - Scripts de seeds<br>- Suites automatizadas |
| **Ejecución (Sprint 1)** | Semanas 3-4 | - Tests US-001 a US-014<br>- Tests módulo cliente | - Reporte de bugs<br>- Coverage report |
| **Ejecución (Sprint 2)** | Semanas 5-6 | - Tests US-015 a US-025<br>- Tests admin y reseñas | - Reporte de bugs<br>- Coverage report |
| **Ejecución (Sprint 3)** | Semanas 7-8 | - Tests US-026 a US-040<br>- Tests analíticas e infraestructura | - Reporte de bugs<br>- Coverage report |
| **Regresión** | Semana 9 | - Re-ejecución suite completa<br>- Validación de fixes | - Reporte final |
| **UAT** | Semana 10 | - Pruebas de aceptación<br>- Sign-off | - Certificado de aceptación |

### 5.2 Hitos Clave

| Fecha | Hito | Criterio |
|-------|------|----------|
| **Semana 2** | Ambiente de Testing Listo | Docker Compose funcional + seeds |
| **Semana 4** | Módulo Cliente Verificado | 100% US-001 a US-014 validadas |
| **Semana 6** | Módulo Admin Verificado | 100% US-015 a US-025 validadas |
| **Semana 8** | Módulo Analíticas Verificado | 100% US-026 a US-040 validadas |
| **Semana 9** | Test de Regresión Completo | 0 bugs críticos, ≤3 menores |
| **Semana 10** | Go-Live | Sign-off de stakeholders |

---

## 6. CASOS DE PRUEBA

### 6.1 Priorización de Casos

**Prioridad Alta (P0):**
- Creación, modificación y cancelación de pedidos
- Sincronización de estados (RabbitMQ)
- Notificaciones en tiempo real (SSE)
- Autenticación y autorización
- Manejo de errores críticos

**Prioridad Media (P1):**
- Gestión de usuarios
- Moderación de reseñas
- Dashboard de analíticas
- Exportación de reportes
- Internacionalización

**Prioridad Baja (P2):**
- Validaciones de formato de texto
- Estilos y alineación de UI
- Tooltips y mensajes informativos

### 6.2 Estructura de Casos de Prueba

Cada caso de prueba sigue el formato:

```
TC-{Módulo}-{Número}: {Título Descriptivo}
├─ Prioridad: P0/P1/P2
├─ Tipo: Funcional/Integración/E2E/Performance/Seguridad
├─ Historia Relacionada: US-XXX
├─ Precondiciones: [Lista]
├─ Pasos:
│  1. [Acción]
│  2. [Acción]
├─ Resultado Esperado: [Descripción]
├─ Resultado Real: [A completar en ejecución]
├─ Estado: Pass/Fail/Blocked/Skipped
└─ Evidencia: [Screenshot/Log/Video]
```

### 6.3 Casos de Prueba por Módulo

Ver documento complementario: [TEST_CASES.md](./TEST_CASES.md)

**Resumen de Casos por Módulo:**
- **Cliente:** 45 casos (TC-CLIENT-001 a TC-CLIENT-045)
- **Cocina:** 20 casos (TC-KITCHEN-001 a TC-KITCHEN-020)
- **Admin:** 35 casos (TC-ADMIN-001 a TC-ADMIN-035)
- **Autenticación:** 15 casos (TC-AUTH-001 a TC-AUTH-015)
- **Notificaciones:** 12 casos (TC-NOTIF-001 a TC-NOTIF-012)
- **Analíticas:** 18 casos (TC-ANALYTICS-001 a TC-ANALYTICS-018)
- **Infraestructura:** 15 casos (TC-INFRA-001 a TC-INFRA-015)
- **Total:** 160 casos de prueba

---

## 7. GESTIÓN DE DEFECTOS

### 7.1 Clasificación de Severidad

| Severidad | Criterio | SLA de Resolución | Ejemplo |
|-----------|----------|-------------------|---------|
| **Crítica** | Sistema no funcional, pérdida de datos | 24 horas | - RabbitMQ no conecta<br>- No se pueden crear pedidos |
| **Alta** | Funcionalidad clave no funciona | 3 días | - Notificaciones no llegan<br>- Reseñas no se guardan |
| **Media** | Funcionalidad menor afectada | 1 semana | - Exportación XLSX con errores<br>- Formato de fecha incorrecto |
| **Baja** | Problema cosmético | 2 semanas | - Texto desalineado<br>- Tooltip con typo |

### 7.2 Flujo de Gestión

```
[Bug Detectado] → [Crear Ticket en Jira]
     ↓
[Asignar Severidad + Prioridad]
     ↓
[Asignar a Desarrollador]
     ↓
[Desarrollador: Fix + PR]
     ↓
[QA: Re-test]
     ↓
[Pass] → [Cerrar Ticket] | [Fail] → [Reabrir]
```

### 7.3 Métricas de Calidad

| Métrica | Objetivo | Medición |
|---------|----------|----------|
| **Defect Density** | <5 bugs/US | Total Bugs / Total US |
| **Test Pass Rate** | ≥95% | Casos Passed / Total Casos |
| **Defect Leakage** | <5% | Bugs en Prod / Total Bugs |
| **Code Coverage** | ≥85% | Lines Covered / Total Lines |
| **Test Execution Rate** | 100% P0, ≥90% P1 | Casos Ejecutados / Casos Planificados |

---

## 8. RIESGOS Y MITIGACIÓN

| Riesgo | Probabilidad | Impacto | Mitigación | Plan de Contingencia |
|--------|--------------|---------|------------|---------------------|
| **RabbitMQ inestable en testing** | Media | Alto | - Usar contenedor dedicado<br>- Monitorear logs | - Implementar mock de RabbitMQ<br>- Tests sin dependencia real |
| **Firebase Auth rate limits** | Baja | Medio | - Cachear tokens<br>- Limitar tests paralelos | - Usar Firebase Emulator |
| **Falta de datos de prueba** | Media | Medio | - Scripts de seeds automatizados<br>- DB de test pre-poblada | - Generar datos on-the-fly con Faker.js |
| **Ambiente de staging no disponible** | Baja | Alto | - Infraestructura redundante<br>- Monitoreo proactivo | - Testing en local con Docker Compose |
| **Cambios de última hora** | Alta | Medio | - Freeze de código 48h antes de release | - Suite de smoke tests rápida |
| **Recursos insuficientes** | Media | Alto | - Planificación con buffer 20%<br>- Priorización estricta (P0) | - Escalamiento con freelancers |

---

## 9. ENTREGABLES

### 9.1 Documentos

1. **Test Plan** (este documento) - Estrategia y planificación
2. **Test Cases Document** ([TEST_CASES.md](./TEST_CASES.md)) - Casos detallados
3. **Test Execution Report** - Resultados de ejecución por sprint
4. **Coverage Report** - Informe de Jest/Istanbul con métricas
5. **Bug Report** - Lista de defectos encontrados y resueltos
6. **UAT Sign-off** - Certificado de aceptación del Product Owner

### 9.2 Artefactos de Testing

1. **Automated Test Suites:**
   - `src/__tests__/` - Tests unitarios
   - `src/modules/*/__tests__/` - Tests de integración
   - `cypress/e2e/` - Tests end-to-end

2. **Test Data:**
   - `src/__tests__/seeds/` - Scripts de población de BD
   - `src/__tests__/fixtures/` - Datos mock para tests

3. **CI/CD Pipelines:**
   - `.github/workflows/test.yml` - Pipeline de pruebas automatizadas
   - `.github/workflows/coverage.yml` - Pipeline de cobertura

4. **Reports:**
   - `coverage/` - Reportes HTML de cobertura
   - `test-results/` - JUnit XML para CI/CD
   - `screenshots/` - Evidencias visuales de Cypress

---

## 10. CRITERIOS DE ACEPTACIÓN DEL PLAN

### 10.1 Aprobaciones Requeridas

- [ ] **QA Lead:** Revisión técnica y factibilidad
- [ ] **Tech Lead:** Validación de estrategia de automatización
- [ ] **Product Owner:** Alineación con requisitos de negocio
- [ ] **Project Manager:** Aprobación de cronograma y recursos

### 10.2 Revisión y Actualización

- **Frecuencia:** Cada sprint (2 semanas)
- **Responsable:** QA Lead
- **Proceso:** 
  1. Revisar métricas de ejecución
  2. Identificar desviaciones del plan
  3. Actualizar cronograma/riesgos según sea necesario
  4. Comunicar cambios a stakeholders

---

## 11. ANEXOS

### Anexo A: Glosario

| Término | Definición |
|---------|------------|
| **LCP** | Largest Contentful Paint - Métrica Core Web Vitals |
| **SSE** | Server-Sent Events - Protocolo de notificaciones unidireccionales |
| **UAT** | User Acceptance Testing - Pruebas de aceptación del usuario |
| **SLA** | Service Level Agreement - Acuerdo de nivel de servicio |
| **P0/P1/P2** | Niveles de prioridad (0=Crítico, 1=Alto, 2=Medio) |

### Anexo B: Referencias

- [REFINED_BACKLOG.md](./REFINED_BACKLOG.md) - Historias de usuario con criterios INVEST
- [TEST_CASES.md](./TEST_CASES.md) - Casos de prueba detallados
- [CODE_QUALITY_STANDARDS.md](./CODE_QUALITY_STANDARDS.md) - Estándares de código

### Anexo C: Contactos

| Rol | Nombre | Email | Slack |
|-----|--------|-------|-------|
| QA Lead | TBD | qa-lead@deliciouskitchen.com | @qa-lead |
| Tech Lead | TBD | tech-lead@deliciouskitchen.com | @tech-lead |
| Product Owner | TBD | po@deliciouskitchen.com | @product-owner |

---

**Historial de Cambios:**

| Versión | Fecha | Autor | Cambios |
|---------|-------|-------|---------|
| 1.0 | 2025-12-18 | GitHub Copilot | Creación inicial del plan |

---

**Aprobaciones:**

| Rol | Nombre | Firma | Fecha |
|-----|--------|-------|-------|
| QA Lead | _____________ | _____________ | ___/___/2025 |
| Tech Lead | _____________ | _____________ | ___/___/2025 |
| Product Owner | _____________ | _____________ | ___/___/2025 |
| Project Manager | _____________ | _____________ | ___/___/2025 |
