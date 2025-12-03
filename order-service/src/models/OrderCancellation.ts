import mongoose, { Schema, Document } from 'mongoose';

export interface IOrderCancellation extends Document {
  orderId: string;
  orderNumber: string;
  customerName: string;
  customerEmail?: string;
  reason?: string;
  previousStatus: string;
  cancelledAt: Date;
  cancelledBy?: string; // 'customer' o 'admin'
}

const OrderCancellationSchema = new Schema({
  orderId: { 
    type: String, 
    required: true,
    index: true 
  },
  orderNumber: { 
    type: String, 
    required: true,
    index: true 
  },
  customerName: { 
    type: String, 
    required: true 
  },
  customerEmail: String,
  reason: String,
  previousStatus: { 
    type: String, 
    required: true 
  },
  cancelledAt: { 
    type: Date, 
    default: Date.now 
  },
  cancelledBy: {
    type: String,
    enum: ['customer', 'admin'],
    default: 'customer'
  }
}, { 
  timestamps: true,
  collection: 'order_cancellations'
});

export const OrderCancellation = mongoose.model<IOrderCancellation>(
  'OrderCancellation',
  OrderCancellationSchema
);
