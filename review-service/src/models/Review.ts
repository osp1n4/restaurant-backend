import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  orderId: string;
  userName: string;
  userEmail: string;
  rating: number;
  foodQuality?: number;
  comment?: string;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: Date;
  updatedAt: Date;
}

const ReviewSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      required: true,
    },
    userName: {
      type: String,
      required: true,
    },
    userEmail: {
      type: String,
      required: true,
    },
    rating: {
      type: Number,
      required: true,
      min: 1,
      max: 5,
    },
    foodQuality: {
      type: Number,
      min: 1,
      max: 5,
    },
    comment: {
      type: String,
      maxlength: 500,
    },
    status: {
      type: String,
      enum: ['pending', 'approved', 'hidden'],
      default: 'pending',
    },
  },
  {
    timestamps: true,
  }
);

// Índices para mejorar rendimiento
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ orderId: 1 });
ReviewSchema.index({ userEmail: 1 });

export default mongoose.model<IReview>('Review', ReviewSchema);
