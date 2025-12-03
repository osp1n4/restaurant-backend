// Script de inicialización para MongoDB
// Fuerza la visibilidad de las bases de datos en Compass

// Conectar a la base de datos orders
db = db.getSiblingDB('orders');

// Asegurar que existen las colecciones con al menos un documento
if (db.orders.countDocuments() === 0) {
  db.orders.insertOne({
    orderNumber: 'SAMPLE-001',
    customerName: 'Usuario de Prueba',
    items: [
      { name: 'Pizza', quantity: 1, price: 25000 }
    ],
    status: 'pending',
    total: 25000,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('✓ Orden de ejemplo creada');
} else {
  print('✓ Órdenes existentes: ' + db.orders.countDocuments());
}

if (db.reviews.countDocuments() === 0) {
  db.reviews.insertOne({
    orderNumber: 'SAMPLE-001',
    rating: 5,
    comment: 'Ejemplo de reseña',
    createdAt: new Date()
  });
  print('✓ Reseña de ejemplo creada');
} else {
  print('✓ Reseñas existentes: ' + db.reviews.countDocuments());
}

// Crear índices para mejorar performance y visibilidad
db.orders.createIndex({ orderNumber: 1 }, { unique: true });
db.orders.createIndex({ status: 1 });
db.reviews.createIndex({ orderNumber: 1 });

print('\n=================================');
print('Base de datos: orders');
print('Colecciones disponibles:');
db.getCollectionNames().forEach(function(col) {
  print('  - ' + col + ' (' + db[col].countDocuments() + ' documentos)');
});
print('=================================\n');

// Conectar a la base de datos kitchen
db = db.getSiblingDB('kitchen');

if (db.kitchenorders.countDocuments() === 0) {
  db.kitchenorders.insertOne({
    orderNumber: 'SAMPLE-001',
    items: [
      { name: 'Pizza', quantity: 1 }
    ],
    status: 'pending',
    createdAt: new Date(),
    updatedAt: new Date()
  });
  print('✓ Orden de cocina de ejemplo creada');
} else {
  print('✓ Órdenes de cocina existentes: ' + db.kitchenorders.countDocuments());
}

db.kitchenorders.createIndex({ orderNumber: 1 });
db.kitchenorders.createIndex({ status: 1 });

print('\n=================================');
print('Base de datos: kitchen');
print('Colecciones disponibles:');
db.getCollectionNames().forEach(function(col) {
  print('  - ' + col + ' (' + db[col].countDocuments() + ' documentos)');
});
print('=================================\n');

print('✅ Inicialización completada');
print('\nConecta en Compass con:');
print('mongodb://127.0.0.1:27017');
