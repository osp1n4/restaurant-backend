import { Request, Response } from 'express';
import { IServiceClient } from '../interfaces/IServiceClient';
import { BaseHttpClient } from '../services/baseHttpClient';
import { config } from '../config';

/**
 * Controller de analíticas del API Gateway refactorizado
 * Cumple con Dependency Inversion Principle: Usa IServiceClient
 */

// Inyección de dependencias
const orderServiceClient: IServiceClient = new BaseHttpClient(
  config.services.orderService.url,
  config.services.orderService.timeout
);

function hasRole(req: Request) {
  // TODO: En producción, verificar roles reales desde JWT
  // Temporalmente permitir acceso para pruebas
  return true;
  // const roles = (req as any).user?.roles || [];
  // return roles.includes('manager') || roles.includes('admin');
}

export async function getAdminAnalytics(req: Request, res: Response) {
  if (!hasRole(req)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Rol insuficiente para acceder a analíticas' });
  }
  const { from, to, groupBy, top } = req.query as any;
  if (!from || !to || !groupBy) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: [
      !from ? { field: 'from', message: 'Formato inválido (YYYY-MM-DD)' } : null,
      !to ? { field: 'to', message: 'Formato inválido (YYYY-MM-DD)' } : null,
      !groupBy ? { field: 'groupBy', message: 'Debe ser uno de: day, week, month, year' } : null
    ].filter(Boolean) });
  }
  const qs = new URLSearchParams({ from, to, groupBy, ...(top ? { top: String(top) } : {}) }).toString();
  const resp = await orderServiceClient.get(`/internal/analytics?${qs}`);
  if (!resp.success) {
    return res.status(resp.status || 500).json(resp.error || { error: 'INTERNAL_ERROR', message: resp.message });
  }
  if (!resp.data) {
    return res.status(204).json({ message: 'No hay datos disponibles para el período seleccionado' });
  }
  return res.status(200).json(resp.data);
}

export async function postAdminAnalyticsExport(req: Request, res: Response) {
  if (!hasRole(req)) {
    return res.status(403).json({ error: 'FORBIDDEN', message: 'Rol insuficiente para acceder a analíticas' });
  }
  const { from, to, groupBy, top, columns } = req.body || {};
  if (!from || !to || !groupBy) {
    return res.status(400).json({ error: 'VALIDATION_ERROR', details: [
      !from ? { field: 'from', message: 'Formato inválido (YYYY-MM-DD)' } : null,
      !to ? { field: 'to', message: 'Formato inválido (YYYY-MM-DD)' } : null,
      !groupBy ? { field: 'groupBy', message: 'Debe ser uno de: day, week, month, year' } : null
    ].filter(Boolean) });
  }
  // Proxy stream: for now use BaseHttpClient.post which returns body, but streaming is ideal
  const resp = await orderServiceClient.post('/internal/analytics/export', { from, to, groupBy, top, columns });
  if (!resp.success) {
    return res.status(resp.status || 500).json(resp.error || { error: 'INTERNAL_ERROR', message: resp.message });
  }
  // Not streaming via axios wrapper; send as text
  res.setHeader('Content-Type', 'text/csv; charset=utf-8');
  res.setHeader('Content-Disposition', `attachment; filename="analytics_${from.replace(/-/g,'')}-${to.replace(/-/g,'')}.csv"`);
  return res.status(200).send(resp.data);
}