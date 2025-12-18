import { Request } from 'express';
import { Validators } from '../utils/validators';
import { CreateOrderRequest } from '../types';

/**
 * Validador para pedidos
 */
export class OrderValidator {
  /**
   * Valida los datos para crear un nuevo pedido
   */
  // eslint-disable-next-line complexity
  static validateCreateOrder(req: Request): { valid: boolean; message?: string } {
    if (Validators.isEmpty(req.body)) {
      return { valid: false, message: 'El cuerpo de la petición está vacío' };
    }

    const { items, customerName, customerEmail } = req.body as CreateOrderRequest; // ← Cambiado a items

    // Validar items (items del pedido)
    const itemsValidation = Validators.validateArray(items, 'items', 1); // ← Cambiado a items
    if (!itemsValidation.valid) {
      return itemsValidation;
    }

    // Validar que cada item tenga los campos requeridos
    if (Array.isArray(items)) { // ← Cambiado a items
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        if (!item.name || typeof item.name !== 'string') { // ← Cambiado a name
          return { valid: false, message: `items[${i}].name es requerido y debe ser una cadena de texto` };
        }
        if (!item.quantity || typeof item.quantity !== 'number' || item.quantity <= 0) {
          return { valid: false, message: `items[${i}].quantity es requerido y debe ser un número mayor a 0` };
        }
        if (!item.price || typeof item.price !== 'number' || item.price <= 0) { // ← Cambiado a price
          return { valid: false, message: `items[${i}].price es requerido y debe ser un número mayor a 0` };
        }
      }
    }

    // Validar customerName
    const nameValidation = Validators.validateRequired(customerName, 'customerName');
    if (!nameValidation.valid) {
      return nameValidation;
    }

    // Validar customerEmail
    const emailValidation = Validators.validateEmail(customerEmail);
    if (!emailValidation.valid) {
      return emailValidation;
    }

    return { valid: true };
  }

  /**
   * Valida que el ID del pedido esté presente
   */
  static validateOrderId(req: Request): { valid: boolean; message?: string } {
    const { id } = req.params;
    if (Validators.isEmpty(id)) {
      return { valid: false, message: 'Se requiere el ID del pedido' };
    }
    return { valid: true };
  }
}