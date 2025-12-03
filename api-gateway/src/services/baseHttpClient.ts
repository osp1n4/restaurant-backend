import axios, { AxiosInstance, AxiosError } from 'axios';
import { ServiceResponse } from '../types';
import { IServiceClient } from '../interfaces/IServiceClient';

/**
 * Cliente HTTP base reutilizable para comunicación con servicios backend
 * Aplica DRY y Single Responsibility Principle
 * Cumple con Dependency Inversion Principle: Implementa IServiceClient
 */
export class BaseHttpClient implements IServiceClient {
  private client: AxiosInstance;

  constructor(baseURL: string, timeout: number = 10000) {
    this.client = axios.create({
      baseURL,
      timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  /**
   * Maneja errores de axios de forma consistente
   */
  private handleError(error: AxiosError): ServiceResponse {
    if (error.response) {
      return {
        success: false,
        status: error.response.status,
        message: (error.response.data as any)?.message || error.message,
        error: error.response.data,
      };
    }

    if (error.request) {
      return {
        success: false,
        status: 503,
        message: 'El servicio no está disponible. Por favor, intente más tarde.',
      };
    }

    return {
      success: false,
      status: 500,
      message: error.message || 'Error desconocido',
    };
  }

  /**
   * Realiza una petición GET
   */
  async get<T = any>(url: string): Promise<ServiceResponse<T>> {
    try {
      const response = await this.client.get<T>(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Realiza una petición POST
   */
  async post<T = any>(url: string, data?: any): Promise<ServiceResponse<T>> {
    try {
      const response = await this.client.post<T>(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Realiza una petición PUT
   */
  async put<T = any>(url: string, data?: any): Promise<ServiceResponse<T>> {
    try {
      const response = await this.client.put<T>(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Realiza una petición PATCH
   */
  async patch<T = any>(url: string, data?: any): Promise<ServiceResponse<T>> {
    try {
      const response = await this.client.patch<T>(url, data);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }

  /**
   * Realiza una petición DELETE
   */
  async delete<T = any>(url: string): Promise<ServiceResponse<T>> {
    try {
      const response = await this.client.delete<T>(url);
      return {
        success: true,
        data: response.data,
      };
    } catch (error) {
      return this.handleError(error as AxiosError);
    }
  }
}
