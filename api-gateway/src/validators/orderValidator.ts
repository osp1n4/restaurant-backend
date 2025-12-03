import { Request } from 'express';
import { Validators } from '../utils/validators';

export class OrderValidator {
  static validateCreateOrder(req: Request): { valid: boolean; message?: string } {
    const { items, customerName, customerEmail } = req.body;

    // Validar customerName
    const nameValidation = Validators.validateRequired(customerName, 'customerName');
    if (!nameValidation.valid) {
      return nameValidation;
    }

    // Validar items
    const itemsValidation = Validators.validateArray(items, 'items', 1);
    if (!itemsValidation.valid) {
      return itemsValidation;
    }

    // Validar estructura de cada item
    for (const item of items) {
      if (!item.name || !item.quantity || item.price === undefined) {
        return {
          valid: false,
          message: 'Cada item debe tener name, quantity y price'
        };
      }
      if (item.quantity < 1) {
        return {
          valid: false,
          message: 'La cantidad debe ser mayor a 0'
        };
      }
      if (item.price < 0) {
        return {
          valid: false,
          message: 'El precio no puede ser negativo'
        };
      }
    }

    // Validar email si se proporciona
    if (customerEmail) {
      const emailValidation = Validators.validateEmail(customerEmail);
      if (!emailValidation.valid) {
        return emailValidation;
      }
    }

    return { valid: true };
  }

  static validateOrderId(req: Request): { valid: boolean; message?: string } {
    const { id } = req.params;
    return Validators.validateRequired(id, 'Order ID');
  }
}