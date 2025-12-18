import { BaseHttpClient } from './baseHttpClient';
import { CreateOrderRequest, Order, KitchenOrder } from '../types';
import { config } from '../config';

const orderServiceClient = new BaseHttpClient(
  config.services.orderService.url,
  config.services.orderService.timeout
);
const kitchenServiceClient = new BaseHttpClient(
  config.services.kitchenService.url,
  config.services.kitchenService.timeout
);


export const orderService = {
  createOrder: (orderData: CreateOrderRequest) => 
    orderServiceClient.post<Order>('/orders', orderData),
  getOrderById: (orderId: string) => 
    orderServiceClient.get<Order>(`/orders/${orderId}`),
  getOrderStatus: (orderId: string) => 
    orderServiceClient.get(`/orders/${orderId}/status`),
  getAllOrders: () => orderServiceClient.get<Order[]>('/orders'),
  updateOrder: (orderId: string, updateData: Partial<CreateOrderRequest>) => 
    orderServiceClient.put<Order>(`/orders/${orderId}`, updateData),
  cancelOrder: (orderId: string) => 
    orderServiceClient.post(`/orders/${orderId}/cancel`),
};

export const kitchenService = {
  getKitchenOrders: (status?: string) => {
    const url = status 
      ? `/api/kitchen/orders?status=${status}`
      : '/api/kitchen/orders';
    return kitchenServiceClient.get<KitchenOrder[]>(url);
  },
  getKitchenOrderById: (orderId: string) => 
    kitchenServiceClient.get<KitchenOrder>(`/api/kitchen/orders/${orderId}`),
  startPreparing: (orderId: string) => 
    kitchenServiceClient.post(`/api/kitchen/orders/${orderId}/start-preparing`),
  markAsReady: (orderId: string) => 
    kitchenServiceClient.post(`/api/kitchen/orders/${orderId}/ready`),
};
