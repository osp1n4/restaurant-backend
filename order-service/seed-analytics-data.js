/**
 * Script para sembrar datos de órdenes en múltiples períodos
 * Esto permitirá que el gráfico de líneas tenga datos para mostrar
 */

const mongoose = require('mongoose');

// Conectar a MongoDB
mongoose.connect('mongodb://localhost:27017/orders', {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

const orderSchema = new mongoose.Schema({
  orderNumber: String,
  customerName: String,
  items: [{
    productId: String,
    name: String,
    quantity: Number,
    price: Number,
    unitPrice: Number
  }],
  total: Number,
  status: String,
  createdAt: Date
});

const Order = mongoose.model('Order', orderSchema);

async function seedData() {
  console.log('🌱 Sembrando datos de órdenes...');

  // Limpiar órdenes existentes (opcional)
  // await Order.deleteMany({});

  const productos = [
    { productId: 'prod-001', name: 'Hamburguesa Clásica', price: 15000 },
    { productId: 'prod-002', name: 'Pizza Margarita', price: 25000 },
    { productId: 'prod-003', name: 'Ensalada César', price: 12000 },
    { productId: 'prod-004', name: 'Pasta Carbonara', price: 18000 },
    { productId: 'prod-005', name: 'Limonada', price: 5000 }
  ];

  const ordenes = [];

  // Crear órdenes para los últimos 6 meses
  for (let mes = 0; mes < 6; mes++) {
    const cantidadOrdenes = Math.floor(Math.random() * 10) + 5; // 5-15 órdenes por mes
    
    for (let i = 0; i < cantidadOrdenes; i++) {
      const fecha = new Date();
      fecha.setMonth(fecha.getMonth() - mes);
      fecha.setDate(Math.floor(Math.random() * 28) + 1); // Día aleatorio del mes
      
      const cantidadItems = Math.floor(Math.random() * 3) + 1; // 1-3 items por orden
      const items = [];
      let total = 0;

      for (let j = 0; j < cantidadItems; j++) {
        const producto = productos[Math.floor(Math.random() * productos.length)];
        const cantidad = Math.floor(Math.random() * 3) + 1;
        const subtotal = producto.price * cantidad;
        
        items.push({
          productId: producto.productId,
          name: producto.name,
          quantity: cantidad,
          price: producto.price,
          unitPrice: producto.price
        });
        
        total += subtotal;
      }

      const orderNumber = `ORD-${fecha.getFullYear()}${String(fecha.getMonth() + 1).padStart(2, '0')}${String(fecha.getDate()).padStart(2, '0')}-${String(i).padStart(4, '0')}`;
      
      ordenes.push({
        orderNumber: orderNumber,
        customerName: `Cliente ${i + 1}`,
        items: items,
        total: total,
        status: 'completed',
        createdAt: fecha
      });
    }
  }

  await Order.insertMany(ordenes);
  
  console.log(`✅ Sembradas ${ordenes.length} órdenes en 6 meses diferentes`);
  
  // Mostrar resumen por mes
  const resumen = await Order.aggregate([
    {
      $group: {
        _id: {
          year: { $year: '$createdAt' },
          month: { $month: '$createdAt' }
        },
        count: { $sum: 1 }
      }
    },
    { $sort: { '_id.year': 1, '_id.month': 1 } }
  ]);

  console.log('\n📊 Resumen de órdenes por mes:');
  resumen.forEach(r => {
    console.log(`  ${r._id.year}-${String(r._id.month).padStart(2, '0')}: ${r.count} órdenes`);
  });

  mongoose.connection.close();
}

seedData().catch(err => {
  console.error('❌ Error:', err);
  process.exit(1);
});
