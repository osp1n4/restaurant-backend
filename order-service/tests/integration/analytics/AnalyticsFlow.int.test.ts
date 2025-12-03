/**
 * PRUEBAS DE INTEGRACIÓN - Dashboard de Analíticas
 *
 * Nivel: INTEGRACIÓN (sin mocks)
 * Alcance: Validar flujo real de analíticas con MongoDB y endpoints HTTP
 * Por qué: Garantizar que la funcionalidad del dashboard opera con datos reales
 * FIRST: Rápidas, Aisladas, Repetibles, Auto-validantes, Oportunas
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { connectDatabase, closeDatabase } from '../../../src/config/database';
import { Order, IOrder, OrderStatus } from '../../../src/models/Order';
import express from 'express';
import orderRoutes from '../../../src/routes/orderRoutes';

// Construimos una app Express solo para pruebas de integración
const app = express();
app.use(express.json());
app.use('/', orderRoutes);

/**
 * Utilidad: limpia la colección entre tests para mantener aislamiento y repetibilidad
 */
async function clearData() {
  await Order.deleteMany({});
}

/**
 * Semilla de datos: crea órdenes reales para el período solicitado
 */
async function seedOrders(): Promise<IOrder[]> {
  const orders: Partial<IOrder>[] = [
    {
      orderNumber: 'ORD-INT-001',
      customerName: 'Ana',
      status: OrderStatus.DELIVERED,
      items: [
        { name: 'Hamburguesa', quantity: 2, price: 15 },
        { name: 'Papas', quantity: 1, price: 5 }
      ] as any,
      total: (2 * 15) + (1 * 5),
      createdAt: new Date('2025-11-05T10:00:00Z')
    },
    {
      orderNumber: 'ORD-INT-002',
      customerName: 'Luis',
      status: OrderStatus.DELIVERED,
      items: [
        { name: 'Pizza', quantity: 1, price: 20 },
        { name: 'Gaseosa', quantity: 3, price: 3 }
      ] as any,
      total: (1 * 20) + (3 * 3),
      createdAt: new Date('2025-11-20T18:30:00Z')
    },
    {
      orderNumber: 'ORD-INT-003',
      customerName: 'María',
      status: OrderStatus.READY,
      items: [
        { name: 'Hamburguesa', quantity: 1, price: 15 },
        { name: 'Gaseosa', quantity: 1, price: 3 }
      ] as any,
      total: (1 * 15) + (1 * 3),
      createdAt: new Date('2025-12-01T12:00:00Z')
    }
  ];

  // Crear documentos reales
  const docs = await Order.insertMany(orders);
  return docs as IOrder[];
}

beforeAll(async () => {
  // Conectar a la BD real (usa MONGODB_URL si está definida)
  await connectDatabase();
});

afterAll(async () => {
  await clearData();
  await closeDatabase();
  await mongoose.disconnect();
});

beforeEach(async () => {
  await clearData();
});

describe('INTEGRACIÓN: GET /internal/analytics', () => {
  test('debe retornar analíticas por mes con datos reales', async () => {
    // Qué valida: Agregación real por mes y productos top
    // Por qué: Verificar pipeline y mapeo con MongoDB y Express

    await seedOrders();

    const from = '2025-11-01';
    const to = '2025-12-02';
    const groupBy = 'month';
    const top = 3;

    const res = await request(app)
      .get('/internal/analytics')
      .query({ from, to, groupBy, top })
      .expect('Content-Type', /json/)
      .expect(200);

    // Auto-validante: estructura esperada
    expect(res.body).toHaveProperty('series');
    expect(res.body).toHaveProperty('productsSold');
    expect(Array.isArray(res.body.series)).toBe(true);
    expect(Array.isArray(res.body.productsSold)).toBe(true);

    // La serie debe contener al menos 2 períodos (noviembre y diciembre)
    const periods = res.body.series.map((s: any) => s.period);
    expect(periods).toEqual(expect.arrayContaining(['2025-11', '2025-12']));

    // Validación de métricas calculadas
    // Total de órdenes: ORD-INT-001 y ORD-INT-002 en noviembre, ORD-INT-003 en diciembre
    const nov = res.body.series.find((s: any) => s.period === '2025-11');
    const dec = res.body.series.find((s: any) => s.period === '2025-12');
    expect(nov.totalOrders).toBe(2);
    expect(dec.totalOrders).toBe(1);

    // Top productos por cantidad
    const productNames = res.body.productsSold.map((p: any) => p.name);
    expect(productNames.length).toBeLessThanOrEqual(top);
    expect(productNames).toEqual(expect.arrayContaining(['Hamburguesa', 'Gaseosa']));
  }, 12000);

  test('debe responder 204 cuando no hay datos en rango', async () => {
    // Qué valida: Manejo de ausencia de datos
    // Por qué: Garantizar respuesta semántica sin errores

    const res = await request(app)
      .get('/internal/analytics')
      .query({ from: '2024-01-01', to: '2024-01-31', groupBy: 'month' })
      .expect(204);

    // Para 204 No Content, no debe esperarse cuerpo JSON
    expect(res.text === '' || res.body == null).toBe(true);
  }, 8000);
});

describe('INTEGRACIÓN: POST /internal/analytics/export', () => {
  test('debe devolver CSV válido con BOM y delimitador ";"', async () => {
    // Qué valida: Exportación CSV real vía streaming HTTP
    // Por qué: Evidencia de compatibilidad con Excel y locales ES

    await seedOrders();

    const res = await request(app)
      .post('/internal/analytics/export')
      .send({ from: '2025-11-01', to: '2025-12-02', groupBy: 'month', top: 5 })
      .expect('Content-Type', /text\/csv/)
      .expect(200);

    // El cuerpo debe comenzar con BOM UTF-8
    const text = res.text as string;
    expect(text.charCodeAt(0)).toBe(0xFEFF);

    // Debe contener encabezados separados por punto y coma (con comillas)
    // CSVExporter utiliza comillas para cada campo, validar con regex acorde
    expect(text).toMatch(/"period";"totalOrders";"totalRevenue"/);

    // Debe contener al menos un período
    expect(text).toMatch(/2025-11|2025-12/);
  }, 12000);
});
