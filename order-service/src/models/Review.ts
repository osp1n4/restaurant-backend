import mongoose, { Schema, Document } from 'mongoose';

/**
 * Interface que define la estructura de una reseña
 * Principio SOLID: Interface Segregation - Define contrato claro
 */
export interface IReview extends Document {
  orderId: string;
  customerName: string;
  customerEmail: string;
  ratings: {
    overall: number;
    food: number;
  };
  comment?: string;
  status: 'pending' | 'approved' | 'hidden';
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Esquema Mongoose para Review
 * Principio SOLID: Single Responsibility - Solo define la estructura de datos
 *
 * Validaciones:
 * - orderId: requerido, único (previene duplicados)
 * - customerName: requerido, min 2 caracteres
 * - customerEmail: requerido, formato email
 * - ratings.overall: requerido, rango 1-5
 * - ratings.food: requerido, rango 1-5
 * - comment: opcional, máx 500 caracteres
 * - status: enum [pending, approved, hidden], default pending
 */
const ReviewSchema: Schema = new Schema(
  {
    orderId: {
      type: String,
      required: [true, 'Order ID is required'],
      unique: true,
      index: true,
      trim: true
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      minlength: [2, 'Customer name must be at least 2 characters'],
      maxlength: [100, 'Customer name must not exceed 100 characters'],
      trim: true
    },
    customerEmail: {
      type: String,
      required: [true, 'Customer email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
    },
    ratings: {
      overall: {
        type: Number,
        required: [true, 'Overall rating is required'],
        min: [1, 'Overall rating must be between 1 and 5'],
        max: [5, 'Overall rating must be between 1 and 5']
      },
      food: {
        type: Number,
        required: [true, 'Food rating is required'],
        min: [1, 'Food rating must be between 1 and 5'],
        max: [5, 'Food rating must be between 1 and 5']
      }
    },
    comment: {
      type: String,
      maxlength: [500, 'Comment must not exceed 500 characters'],
      trim: true,
      default: ''
    },
    status: {
      type: String,
      enum: {
        values: ['pending', 'approved', 'hidden'],
        message: 'Status must be pending, approved, or hidden'
      },
      default: 'pending',
      index: true
    }
  },
  {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    versionKey: false // Elimina __v
  }
);

/**
 * Índices compuestos para optimización de consultas
 * - status + createdAt: Para listar reseñas aprobadas ordenadas por fecha
 * - customerEmail + orderId: Para prevenir duplicados del mismo cliente
 */
ReviewSchema.index({ status: 1, createdAt: -1 });
ReviewSchema.index({ customerEmail: 1, orderId: 1 });

/**
 * Método de instancia para convertir a JSON
 * Oculta campos internos y formatea la respuesta
 */
ReviewSchema.methods.toJSON = function() {
  const review = this.toObject();
  review.id = review._id.toString();
  delete review._id;
  return review;
};

/**
 * Método estático para validar si un pedido ya tiene reseña
 * Principio SOLID: Open/Closed - Extensible sin modificar el esquema
 */
ReviewSchema.statics.hasReview = async function(orderId: string): Promise<boolean> {
  const count = await this.countDocuments({ orderId });
  return count > 0;
};

/**
 * Exportación del modelo
 * Patrón: Active Record (modelo con lógica de persistencia integrada)
 */
export const Review = mongoose.model<IReview>('Review', ReviewSchema);
