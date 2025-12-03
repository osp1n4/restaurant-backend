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
  status: OrderStatus;
  total: number;
  preparingStartedAt?: Date;
  readyAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

// Interfaz para los items del pedido
export interface OrderItem {
  productId?: string;
  name: string;
  quantity: number;
  price: number;
  unitPrice?: number;
  notes?: string;
}

// Esquema de Mongoose para Order
const OrderItemSchema = new Schema({
  productId: { type: String },
  name: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true, min: 0 },
  unitPrice: { type: Number },
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
    required: true,
    trim: true,
    lowercase: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  items: {
    type: [OrderItemSchema],
    required: true,
    validate: {
      validator: (items: OrderItem[]) => items.length > 0,
      message: 'El pedido debe tener al menos un item'
    }
  },
  status: {
    type: String,
    enum: Object.values(OrderStatus),
    default: OrderStatus.PENDING,
    required: true
  },
  preparingStartedAt: { 
    type: Date,
    required: false
  },
  readyAt: { 
    type: Date,
    required: false
  },
  total: { 
    type: Number, 
    required: true, 
    min: 0 
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

// Modelo de Mongoose
export const Order = mongoose.model<IOrder>('Order', OrderSchema);
