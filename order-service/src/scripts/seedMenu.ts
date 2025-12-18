import mongoose from 'mongoose';
import { MenuItem } from '../models/MenuItem';

const MENU_ITEMS = [
  // Pizzas
  { name: 'Pizza Margherita', description: 'Salsa de tomate, mozzarella fresca y albahaca', price: 28000, category: 'pizza', imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pizza Pepperoni', description: 'Salsa de tomate, mozzarella y pepperoni', price: 32000, category: 'pizza', imageUrl: 'https://images.unsplash.com/photo-1628840042765-356cda07504e?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pizza Cuatro Quesos', description: 'Mozzarella, gorgonzola, parmesano y provolone', price: 35000, category: 'pizza', imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pizza Hawaiana', description: 'Jamón, piña y queso mozzarella', price: 30000, category: 'pizza', imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pizza Vegetariana', description: 'Pimientos, cebolla, champiñones y aceitunas', price: 29000, category: 'pizza', imageUrl: 'https://images.unsplash.com/photo-1511689660979-10d2b1aada49?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  
  // Hamburguesas
  { name: 'Hamburguesa Clásica', description: 'Carne de res, lechuga, tomate, cebolla y salsa especial', price: 20000, category: 'burger', imageUrl: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Cheeseburger', description: 'Carne de res con queso cheddar derretido', price: 22000, category: 'burger', imageUrl: 'https://images.unsplash.com/photo-1572802419224-296b0aeee0d9?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Bacon Burger', description: 'Carne de res, bacon crujiente y queso', price: 25000, category: 'burger', imageUrl: 'https://images.unsplash.com/photo-1553979459-d2229ba7433b?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'BBQ Burger', description: 'Carne de res, cebolla caramelizada y salsa BBQ', price: 24000, category: 'burger', imageUrl: 'https://images.unsplash.com/photo-1571091718767-18b5b1457add?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Veggie Burger', description: 'Hamburguesa vegetariana con aguacate', price: 21000, category: 'burger', imageUrl: 'https://images.unsplash.com/photo-1520072959219-c595dc870360?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  
  // Pastas
  { name: 'Pasta Carbonara', description: 'Pasta con huevo, panceta y parmesano', price: 30000, category: 'pasta', imageUrl: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pasta Alfredo', description: 'Fettuccine con salsa cremosa de queso', price: 28000, category: 'pasta', imageUrl: 'https://images.unsplash.com/photo-1645112411341-6c4fd023714a?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pasta Boloñesa', description: 'Spaghetti con ragú de carne', price: 27000, category: 'pasta', imageUrl: 'https://images.unsplash.com/photo-1598866594230-a7c12756260f?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pasta Pesto', description: 'Linguine con salsa pesto de albahaca', price: 29000, category: 'pasta', imageUrl: 'https://images.unsplash.com/photo-1473093295043-cdd812d0e601?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Pasta Arrabiata', description: 'Penne con salsa de tomate picante', price: 26000, category: 'pasta', imageUrl: 'https://images.unsplash.com/photo-1621996346565-e3dbc646d9a9?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  
  // Ensaladas
  { name: 'Ensalada César', description: 'Lechuga romana, crutones, parmesano y aderezo césar', price: 18000, category: 'salad', imageUrl: 'https://images.unsplash.com/photo-1546793665-c74683f339c1?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Ensalada Griega', description: 'Tomate, pepino, cebolla, aceitunas y queso feta', price: 19000, category: 'salad', imageUrl: 'https://images.unsplash.com/photo-1540189549336-e6e99c3679fe?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Ensalada Caprese', description: 'Tomate, mozzarella fresca y albahaca', price: 20000, category: 'salad', imageUrl: 'https://images.unsplash.com/photo-1572695157366-5e585ab2b69f?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Ensalada de Pollo', description: 'Pollo a la parrilla, lechuga mixta y vinagreta', price: 22000, category: 'salad', imageUrl: 'https://images.unsplash.com/photo-1604909052743-94e838986d24?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Ensalada Mediterránea', description: 'Vegetales frescos con vinagreta de limón', price: 19000, category: 'salad', imageUrl: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  
  // Bebidas
  { name: 'Coca Cola', description: 'Refresco 350ml', price: 6000, category: 'beverage', imageUrl: 'https://images.unsplash.com/photo-1554866585-cd94860890b7?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Jugo Natural de Naranja', description: 'Jugo recién exprimido', price: 8000, category: 'beverage', imageUrl: 'https://images.unsplash.com/photo-1600271886742-f049cd451bba?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Limonada Natural', description: 'Limonada casera con menta', price: 7000, category: 'beverage', imageUrl: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Agua Mineral', description: 'Agua con gas 500ml', price: 5000, category: 'beverage', imageUrl: 'https://images.unsplash.com/photo-1548839140-29a749e1cf4d?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Té Helado', description: 'Té frío de durazno', price: 7000, category: 'beverage', imageUrl: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  
  // Postres
  { name: 'Brownie con Helado', description: 'Brownie de chocolate caliente con helado de vainilla', price: 15000, category: 'dessert', imageUrl: 'https://images.unsplash.com/photo-1607920591413-4ec007e70023?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Cheesecake', description: 'Tarta de queso con frutos rojos', price: 16000, category: 'dessert', imageUrl: 'https://images.unsplash.com/photo-1524351199678-941a58a3df50?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Tiramisú', description: 'Postre italiano de café y mascarpone', price: 17000, category: 'dessert', imageUrl: 'https://images.unsplash.com/photo-1571877227200-a0d98ea607e9?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Helado', description: 'Tres bolas de helado a elección', price: 12000, category: 'dessert', imageUrl: 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400&h=300&fit=crop&q=75&auto=format', available: true },
  { name: 'Flan', description: 'Flan casero con caramelo', price: 10000, category: 'dessert', imageUrl: 'https://images.unsplash.com/photo-1624353365286-3f8d62daad51?w=400&h=300&fit=crop&q=75&auto=format', available: true },
];

export async function seedMenu() {
  try {
    const MONGODB_URL = process.env.MONGODB_URL || 'mongodb://localhost:27017/orders';
    
    await mongoose.connect(MONGODB_URL);
    console.log('✅ Conectado a MongoDB');

    // Limpiar colección existente
    await MenuItem.deleteMany({});
    console.log('🗑️  Productos anteriores eliminados');

    // Insertar nuevos productos
    await MenuItem.insertMany(MENU_ITEMS);
    console.log(`✅ ${MENU_ITEMS.length} productos insertados exitosamente`);

    // Mostrar resumen por categoría
    const categories = await MenuItem.aggregate([
      { $group: { _id: '$category', count: { $sum: 1 } } },
      { $sort: { _id: 1 } }
    ]);

    console.log('\n📊 Resumen por categoría:');
    categories.forEach(cat => {
      console.log(`   - ${cat._id}: ${cat.count} productos`);
    });

    await mongoose.connection.close();
    console.log('\n✅ Seed completado. Base de datos cerrada.');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error al poblar la base de datos:', error);
    process.exit(1);
  }
}

// Ejecutar si se llama directamente
if (require.main === module) {
  seedMenu();
}
