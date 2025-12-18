
import mongoose, { Schema, Document } from 'mongoose';

// Enum para los estados del pedido
export enum OrderStatus {
  PENDING = 'pending',           // Pedido creado, esperando procesamiento
  PREPARING = 'preparing',       // En cocina, siendo preparado
  READY = 'ready',               // Listo para entregar
  DELIVERED = 'delivered',       // Entregado al cliente
  CANCELLED = 'cancelled'        // Pedido cancelado
}

// Interfaz para el documento Order
export interface IOrder extends Document {
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  items: OrderItem[];
  notes?: string;              // Notas especiales del pedido
  status: OrderStatus;
  total: number;
  preparingStartedAt?: Date;  // Cuando comenzó la preparación
  readyAt?: Date;              // Cuando se marcó como listo
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para los items del pedido
export interface OrderItem {
  name: string;
  quantity: number;
  price: number;
  notes?: string;
}

// Esquema de Mongoose para Order
const OrderItemSchema = new Schema({
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  notes: { type: String }
}, { _id: false });

const OrderSchema = new Schema({
  orderNumber: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  customerName: { 
    type: String, 
    required: true,
    trim: true 
  },
  customerEmail: {
    type: String,
    trim: true
  },
  items: { 
    type: [OrderItemSchema], 
    required: true,
    validate: {
      validator: (items: OrderItem[]) => items.length > 0,
      message: 'El pedido debe tener al menos un item'
    }
  },
  notes: {
    type: String,
    trim: true,
    maxlength: 500
  },
  status: { 
    type: String, 
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    required: true 
  },
  total: { 
    type: Number, 
    required: true, 
    min: 0 
  },
  preparingStartedAt: {
    type: Date,
    default: null
  },
  readyAt: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'orders'
});

// Middleware para calcular el total antes de guardar
OrderSchema.pre('save', function(this: IOrder, next: mongoose.CallbackWithoutResultAndOptionalError) {
  if (this.isModified('items')) {
    this.total = this.items.reduce((sum: number, item: OrderItem) => sum + (item.price * item.quantity), 0);
  }
  next();
});

// Método para generar número de pedido único
OrderSchema.statics.generateOrderNumber = async function(): Promise<string> {
  const timestamp = Date.now();
  const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
  return `ORD-${timestamp}-${random}`;
};

// Modelo de Mongoose
export const Order = mongoose.model<IOrder>('Order', OrderSchema);

