# 📡 Ejemplo de Comunicación Frontend-Backend

## 🔗 Endpoints Disponibles

El API Gateway está configurado en `http://localhost:3000` y actúa como punto de entrada único.

### Endpoints de Pedidos

- `POST /orders` - Crear un nuevo pedido
- `GET /orders` - Obtener todos los pedidos
- `GET /orders/:id` - Obtener un pedido por ID
- `GET /orders/:id/status` - Consultar estado de un pedido

## 💻 Ejemplos de Fetch desde el Frontend

### JavaScript/TypeScript (Vanilla)

```javascript
// Crear un pedido
async function createOrder(customerName, items) {
  try {
    const response = await fetch('http://localhost:3000/orders', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        customerName: customerName,
        items: items
      })
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al crear el pedido');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Obtener un pedido por ID
async function getOrderById(orderId) {
  try {
    const response = await fetch(`http://localhost:3000/orders/${orderId}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener el pedido');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Consultar estado de un pedido
async function getOrderStatus(orderId) {
  try {
    const response = await fetch(`http://localhost:3000/orders/${orderId}/status`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al consultar el estado');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Obtener todos los pedidos
async function getAllOrders(limit = 50, skip = 0) {
  try {
    const response = await fetch(`http://localhost:3000/orders?limit=${limit}&skip=${skip}`);
    
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Error al obtener los pedidos');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

// Ejemplo de uso
createOrder('Juan Pérez', [
  { name: 'Pizza Margherita', quantity: 2, price: 15.99 },
  { name: 'Coca Cola', quantity: 1, price: 2.50 }
])
  .then(order => {
    console.log('Pedido creado:', order);
    return getOrderStatus(order.order.id);
  })
  .then(status => {
    console.log('Estado del pedido:', status);
  })
  .catch(error => {
    console.error('Error:', error);
  });
```

### React (con hooks)

```jsx
import { useState, useEffect } from 'react';

function OrderForm() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [order, setOrder] = useState(null);

  const createOrder = async (customerName, items) => {
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('http://localhost:3000/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          customerName,
          items
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Error al crear el pedido');
      }

      const data = await response.json();
      setOrder(data.order);
      return data;
    } catch (err) {
      setError(err.message);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      {error && <div className="error">{error}</div>}
      {order && (
        <div>
          <h3>Pedido Creado</h3>
          <p>Número: {order.orderNumber}</p>
          <p>Estado: {order.status}</p>
        </div>
      )}
      <button 
        onClick={() => createOrder('Juan Pérez', [
          { name: 'Pizza', quantity: 1, price: 15.99 }
        ])}
        disabled={loading}
      >
        {loading ? 'Creando...' : 'Crear Pedido'}
      </button>
    </div>
  );
}
```

### Axios (si prefieres usar axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000',
  headers: {
    'Content-Type': 'application/json',
  }
});

// Crear pedido
const createOrder = async (customerName, items) => {
  try {
    const response = await api.post('/orders', {
      customerName,
      items
    });
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};

// Obtener pedido
const getOrderById = async (orderId) => {
  try {
    const response = await api.get(`/orders/${orderId}`);
    return response.data;
  } catch (error) {
    if (error.response) {
      throw new Error(error.response.data.error);
    }
    throw error;
  }
};
```

## 🔒 Configuración de CORS

El API Gateway está configurado para aceptar peticiones desde cualquier origen en desarrollo. 

Para producción, actualiza la variable de entorno:
```bash
FRONTEND_URL=http://tu-frontend.com
```

## 📝 Formato de Datos

### Crear Pedido (POST /orders)

**Request:**
```json
{
  "customerName": "Juan Pérez",
  "items": [
    {
      "name": "Pizza Margherita",
      "quantity": 2,
      "price": 15.99,
      "notes": "Sin cebolla" // opcional
    },
    {
      "name": "Coca Cola",
      "quantity": 1,
      "price": 2.50
    }
  ]
}
```

**Response (201):**
```json
{
  "message": "Pedido creado exitosamente",
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1234567890-001",
    "customerName": "Juan Pérez",
    "items": [...],
    "total": 34.48,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Obtener Pedido (GET /orders/:id)

**Response (200):**
```json
{
  "order": {
    "id": "507f1f77bcf86cd799439011",
    "orderNumber": "ORD-1234567890-001",
    "customerName": "Juan Pérez",
    "items": [...],
    "total": 34.48,
    "status": "pending",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
}
```

### Consultar Estado (GET /orders/:id/status)

**Response (200):**
```json
{
  "orderNumber": "ORD-1234567890-001",
  "status": "pending"
}
```

## ⚠️ Manejo de Errores

Todos los endpoints devuelven errores en este formato:

```json
{
  "error": "Mensaje de error",
  "details": "Detalles adicionales (opcional)"
}
```

Códigos de estado HTTP:
- `400` - Error de validación
- `404` - Recurso no encontrado
- `500` - Error interno del servidor
- `503` - Servicio no disponible

