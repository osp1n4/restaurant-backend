import { ServiceResponse } from '../types';

/**
 * Interface para cliente HTTP de servicios
 * Cumple con Dependency Inversion Principle
 */
export interface IServiceClient {
  get<T = any>(url: string): Promise<ServiceResponse<T>>;
  post<T = any>(url: string, data?: any): Promise<ServiceResponse<T>>;
  put<T = any>(url: string, data?: any): Promise<ServiceResponse<T>>;
  delete<T = any>(url: string): Promise<ServiceResponse<T>>;
}
