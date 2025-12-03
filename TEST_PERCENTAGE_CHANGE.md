# Test: Cambio Porcentual Dinámico

## ✅ Cambios Implementados

### Backend (Order Service)

1. **DTO actualizado** (`src/dtos/analytics.ts`)
   - Agregados campos `totalOrdersChange`, `totalRevenueChange`, `totalProductsSoldChange` a `summary`

2. **Repository** (`src/repositories/AnalyticsRepository.ts`)
   - Nuevo método `getPreviousPeriodSummary()` para calcular período anterior
   - Cálculo automático del rango anterior basado en la duración del período actual
   - Ejemplo: Si consultas del 1-10 dic (10 días), el período anterior será del 21-30 nov (10 días)

3. **Mapper** (`src/mappers/AnalyticsResponseMapper.ts`)
   - Nuevo método `calculatePercentageChanges()` 
   - Fórmula: `((actual - anterior) / anterior) * 100`
   - Maneja casos donde no hay datos anteriores (devuelve `null`)

### Frontend (React)

1. **StatCard Component** (`src/components/analytics/StatCard.jsx`)
   - Ahora detecta automáticamente si el cambio es positivo (verde) o negativo (rojo)
   - Removido prop `isPositive` (ya no es necesario)

2. **Dashboard** (`src/views/SalesAnalyticsDashboard/index.jsx`)
   - Usa valores dinámicos del backend:
     - `data.summary.totalOrdersChange`
     - `data.summary.totalRevenueChange`
     - `data.summary.totalProductsSoldChange`

## 🧪 Cómo Probar

### 1. Reiniciar Backend

```powershell
# Detener servicios
cd 'c:\Users\nevardo.ospina\Documents\TRAINING IA NATIVE DEV Y QA\Taller 2 Scramble  Refactor - El Reto\Restaurant Grupo 2\restaurant-backend'
docker-compose down

# Reconstruir y levantar
docker-compose up -d --build
```

### 2. Verificar Logs

```powershell
# Ver logs del order-service
docker-compose logs -f order-service
```

### 3. Probar desde Frontend

1. **Abre el navegador** en `http://localhost:5173`
2. **Navega al Dashboard de Analytics**
3. **Selecciona un rango de fechas**:
   - Ejemplo: Del `2025-11-01` al `2025-12-03`
4. **Presiona "Consultar métricas"**

### 4. Verificar Respuesta del Backend

Puedes probar directamente con curl/Postman:

```bash
# Ejemplo con últimos 30 días
curl "http://localhost:3000/admin/analytics?from=2025-11-01&to=2025-12-03&groupBy=month&top=10"
```

**Respuesta esperada:**
```json
{
  "range": {
    "from": "2025-11-01",
    "to": "2025-12-03",
    "groupBy": "month"
  },
  "summary": {
    "totalOrders": 17,
    "totalRevenue": 361000,
    "avgPrepTime": null,
    "totalOrdersChange": 12.5,      // ✅ NUEVO: Cambio dinámico
    "totalRevenueChange": 8.3,      // ✅ NUEVO: Cambio dinámico
    "totalProductsSoldChange": 15.2 // ✅ NUEVO: Cambio dinámico
  },
  "series": [...],
  "productsSold": [...],
  "topNProducts": [...]
}
```

## 📊 Interpretación de Resultados

### Valores Positivos (Verde)
```
+12.5% → Crecimiento del 12.5% respecto al período anterior
```

### Valores Negativos (Rojo)
```
-5.3% → Decrecimiento del 5.3% respecto al período anterior
```

### Valor Null
```
null → No hay datos del período anterior para comparar
```

## 🔍 Ejemplos de Cálculo

### Escenario 1: Crecimiento
- **Período actual** (1-10 dic): 20 órdenes
- **Período anterior** (21-30 nov): 18 órdenes
- **Cálculo**: ((20 - 18) / 18) * 100 = **+11.1%** ✅

### Escenario 2: Decrecimiento
- **Período actual** (1-10 dic): 15 órdenes
- **Período anterior** (21-30 nov): 20 órdenes
- **Cálculo**: ((15 - 20) / 20) * 100 = **-25.0%** ⚠️

### Escenario 3: Sin cambio
- **Período actual**: 10 órdenes
- **Período anterior**: 10 órdenes
- **Cálculo**: ((10 - 10) / 10) * 100 = **0.0%** ⚪

### Escenario 4: Sin datos anteriores
- **Período actual**: 10 órdenes
- **Período anterior**: No hay datos
- **Resultado**: **null** (no se muestra porcentaje)

## 🎨 Visualización en el Dashboard

### Tarjeta con Crecimiento
```
┌─────────────────────┐
│ TOTAL ÓRDEN     🛒  │
│                     │
│ 17                  │
│ +12.5%  ← Verde     │
└─────────────────────┘
```

### Tarjeta con Decrecimiento
```
┌─────────────────────┐
│ TOTAL INCOME    💰  │
│                     │
│ $361,000            │
│ -5.3%   ← Rojo      │
└─────────────────────┘
```

## ✅ Checklist de Verificación

- [ ] Backend compilado sin errores TypeScript
- [ ] Servicios Docker reiniciados
- [ ] Frontend recargado (F5)
- [ ] Tarjetas muestran porcentajes dinámicos (no siempre +5.2%)
- [ ] Colores correctos: verde para positivo, rojo para negativo
- [ ] Si no hay datos anteriores, no muestra porcentaje

## 🐛 Troubleshooting

### Problema: Siempre muestra null
- **Causa**: No hay datos en el período anterior
- **Solución**: Ejecuta `node seed-analytics-data.js` para agregar más datos históricos

### Problema: Error al calcular período anterior
- **Causa**: Fechas inválidas
- **Solución**: Verifica el formato YYYY-MM-DD en los filtros

### Problema: Frontend no muestra cambios
- **Causa**: Caché del navegador
- **Solución**: Recarga con Ctrl+F5 (hard reload)

---

**Autor**: AI Assistant  
**Fecha**: 03/12/2025  
**Versión**: 1.0.0
