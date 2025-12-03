# Solución: Tabla con Todos los Datos (Periodo × Producto)

## Problema Identificado

La tabla del Dashboard de Analíticas no muestra todos los datos correctamente porque:

1. **Backend actual** devuelve:
   - `series`: Agregado por periodo (totalOrders, totalRevenue por periodo)
   - `productsSold`: Top N productos con cantidad TOTAL (no por periodo)

2. **Frontend** hace producto cartesiano: periodo × producto
   - Esto genera filas duplicadas con información incorrecta
   - Ejemplo: Si hay 10 periodos y 5 productos, muestra 50 filas
   - Cada producto aparece con la misma cantidad en todos los periodos (incorrecto)

## Solución Recomendada

### Opción A: Agregar nuevo endpoint en el backend (Mejor solución)

Crear `/internal/analytics/detailed` que devuelva datos por periodo×producto:

```typescript
// En AnalyticsRepository.ts
async getDetailedAnalytics(query: AnalyticsQueryDTO) {
  const { from, to, groupBy, top = 10 } = query;
  const fromDate = new Date(`${from}T00:00:00.000Z`);
  const toDate = new Date(`${to}T23:59:59.999Z`);

  // Validar rango
  const monthsDiff = (toDate.getTime() - fromDate.getTime()) / (1000 * 60 * 60 * 24 * 30);
  if (monthsDiff > 12) {
    throw Object.assign(new Error('El rango de fechas excede el máximo permitido'), { code: 'RANGE_EXCEEDED' });
  }

  const strategy = GroupingStrategyFactory.create(groupBy);
  const periodExpr = strategy.getPeriodExpression();

  // Pipeline que agrega por periodo Y producto
  const detailedPipeline: any[] = [
    { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
    { $unwind: '$items' },
    {
      $addFields: {
        period: periodExpr,
        itemRevenue: { $multiply: ['$items.quantity', { $ifNull: ['$items.unitPrice', '$items.price'] }] }
      }
    },
    {
      $group: {
        _id: {
          period: '$period',
          productId: { $ifNull: ['$items.productId', '$items.name'] },
          productName: '$items.name'
        },
        totalOrders: { $addToSet: '$_id' },
        quantity: { $sum: '$items.quantity' },
        revenue: { $sum: '$itemRevenue' }
      }
    },
    {
      $project: {
        _id: 0,
        period: '$_id.period',
        productId: '$_id.productId',
        productName: '$_id.productName',
        totalOrders: { $size: '$totalOrders' },
        quantity: 1,
        revenue: 1
      }
    },
    { $sort: { period: 1, quantity: -1 } }
  ];

  // Si se especifica top, filtrar solo los top N productos globalmente
  if (top) {
    // Primero obtener los top N productos del periodo completo
    const topProductsPipeline: any[] = [
      { $match: { createdAt: { $gte: fromDate, $lte: toDate } } },
      { $unwind: '$items' },
      {
        $group: {
          _id: { $ifNull: ['$items.productId', '$items.name'] },
          quantity: { $sum: '$items.quantity' }
        }
      },
      { $sort: { quantity: -1 } },
      { $limit: top },
      { $project: { _id: 1 } }
    ];
    
    const topProducts = await this.orderModel.aggregate(topProductsPipeline).exec();
    const topProductIds = topProducts.map(p => p._id);
    
    // Agregar filtro para incluir solo productos top
    const detailedData = await this.orderModel.aggregate(detailedPipeline).exec();
    return detailedData.filter(row => topProductIds.includes(row.productId));
  }

  return await this.orderModel.aggregate(detailedPipeline).exec();
}
```

### Opción B: Modificar el frontend para mostrar correctamente (Solución rápida)

Cambiar `getTableData()` para no hacer producto cartesiano:

```jsx
const getTableData = () => {
  if (!data?.productsSold || data.productsSold.length === 0) return [];
  
  // Mostrar solo productos (sin repetir por periodo)
  // Agregar información del rango de fechas como contexto
  return data.productsSold.map(product => ({
    period: `${filters.from} / ${filters.to}`,
    totalOrders: data.summary?.totalOrders || 0,
    totalRevenue: data.summary?.totalRevenue || 0,
    productId: product.productId,
    productName: product.name,
    quantity: product.quantity,
    avgPrepTime: data.summary?.avgPrepTime || null
  }));
};
```

### Opción C: Limitar filas en la tabla (Workaround temporal)

Si quieres mantener la estructura actual pero evitar mostrar demasiadas filas:

```jsx
const getTableData = () => {
  if (!data?.series || !data?.productsSold) return [];
  
  const tableRows = [];
  const maxProducts = Math.min(data.productsSold.length, filters.top || 5);
  
  data.series.forEach(seriesItem => {
    // Solo mostrar los top N productos
    data.productsSold.slice(0, maxProducts).forEach(product => {
      tableRows.push({
        period: seriesItem.period,
        totalOrders: seriesItem.totalOrders,
        totalRevenue: seriesItem.totalRevenue,
        productId: product.productId,
        productName: product.name,
        quantity: product.quantity,
        avgPrepTime: seriesItem.avgPrepTime || null
      });
    });
  });
  
  return tableRows;
};
```

## Recomendación

**Implementar Opción A**: Crear endpoint detallado en el backend que devuelva datos reales por periodo×producto. Esto:
- ✅ Muestra datos precisos (cantidad vendida de cada producto en cada periodo)
- ✅ Permite análisis temporal real
- ✅ Es la solución correcta arquitectónicamente
- ✅ Permite exportar CSV con datos correctos

## Implementación Inmediata (Opción B)

Para solucionar rápidamente, usa la Opción B que ya apliqué en el código.
