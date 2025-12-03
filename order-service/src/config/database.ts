import mongoose from 'mongoose';

/**
 * Conecta a MongoDB
 */
export async function connectDatabase(): Promise<void> {
  try {
    const mongoUrl = process.env.MONGODB_URL || 'mongodb://localhost:27017/orders';
    
    console.log('🔄 Conectando a MongoDB...');
    
    await mongoose.connect(mongoUrl);

    console.log('✅ Conectado a MongoDB exitosamente');
    console.log(`📊 Base de datos: ${mongoose.connection.name}`);
  } catch (error) {
    console.error('❌ Error conectando a MongoDB:', error);
    throw error;
  }
}

/**
 * Cierra la conexión a MongoDB
 */
export async function closeDatabase(): Promise<void> {
  try {
    await mongoose.connection.close();
    console.log('🔌 Conexión a MongoDB cerrada');
  } catch (error) {
    console.error('❌ Error cerrando conexión a MongoDB:', error);
    throw error;
  }
}

// Manejar eventos de conexión
mongoose.connection.on('error', (error) => {
  console.error('❌ Error de MongoDB:', error);
});

mongoose.connection.on('disconnected', () => {
  console.warn('⚠️ MongoDB desconectado');
});

mongoose.connection.on('reconnected', () => {
  console.log('🔄 MongoDB reconectado');
});

