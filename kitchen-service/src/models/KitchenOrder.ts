import mongoose, { Schema, Document } from 'mongoose';

export interface IKitchenOrder extends Document {
  orderId: string;
  orderNumber?: string;
  userId: string;
  customerName?: string;
  customerEmail?: string;
  items: Array<{
    name: string;
    quantity: number;
    price?: number;
  }>;
  status: 'RECEIVED' | 'PREPARING' | 'READY' | 'CANCELLED';
  receivedAt: Date;
  preparingAt?: Date;
  readyAt?: Date;
  cancelledAt?: Date;
  estimatedTime?: number; // en minutos
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const KitchenOrderSchema = new Schema({
  orderId: { 
    type: String, 
    required: true, 
    unique: true,
    index: true 
  },
  orderNumber: {
    type: String,
    index: true
  },
  userId: { 
    type: String, 
    required: true 
  },
  customerName: String,
  customerEmail: String,
  items: [{
    name: { type: String, required: true },
    quantity: { type: Number, required: true },
    price: Number
  }],
  status: { 
    type: String, 
    enum: ['RECEIVED', 'PREPARING', 'READY', 'CANCELLED'],
    default: 'RECEIVED',
    index: true
  },
  receivedAt: { 
    type: Date, 
    default: Date.now 
  },
  preparingAt: Date,
  readyAt: Date,
  cancelledAt: Date,
  estimatedTime: Number,
  notes: String
}, { 
  timestamps: true 
});

export const KitchenOrder = mongoose.model<IKitchenOrder>('KitchenOrder', KitchenOrderSchema);