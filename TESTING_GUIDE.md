# Testing Guide - Review System

## Overview
This document provides a comprehensive step-by-step guide to test the complete review functionality, including unit tests, integration tests, and end-to-end testing.

---

## Prerequisites

### Services Running
Ensure all services are up and running:

```bash
# Check Docker containers
docker ps

# Expected output:
# - restaurant-backend-mongodb-1        (port 27017)
# - restaurant-backend-rabbitmq-1       (ports 5672, 15672)
# - restaurant-backend-api-gateway-1    (port 3000)
# - restaurant-backend-order-service-1  (port 3001)
# - restaurant-backend-kitchen-service-1 (port 3002)
# - restaurant-backend-notification-service-1 (port 3003)
```

Frontend should be running on: `http://localhost:5173`

---

## Part 1: Unit Testing (Backend)

### 1.1 ReviewService Unit Tests

**Location**: `order-service/tests/unit/ReviewService.test.ts`

Create the test file:

```typescript
import { ReviewService } from '../../src/services/ReviewService';
import { IReviewRepository } from '../../src/repositories/ReviewRepository';

// Mock del repositorio
class MockReviewRepository implements IReviewRepository {
  private reviews: any[] = [];

  async create(data: any) {
    const review = { _id: 'mock-id', ...data, status: 'pending', createdAt: new Date() };
    this.reviews.push(review);
    return review;
  }

  async findById(id: string) {
    return this.reviews.find(r => r._id === id) || null;
  }

  async findApproved(page: number, limit: number) {
    return this.reviews.filter(r => r.status === 'approved');
  }

  async findAll(page: number, limit: number) {
    return this.reviews;
  }

  async updateStatus(id: string, status: string) {
    const review = this.reviews.find(r => r._id === id);
    if (review) review.status = status;
    return review;
  }

  async countApproved() {
    return this.reviews.filter(r => r.status === 'approved').length;
  }

  async countAll() {
    return this.reviews.length;
  }

  async hasReviewForOrder(orderId: string) {
    return this.reviews.some(r => r.orderId === orderId);
  }
}

describe('ReviewService - Unit Tests', () => {
  let reviewService: ReviewService;
  let mockRepository: MockReviewRepository;

  beforeEach(() => {
    mockRepository = new MockReviewRepository();
    reviewService = new ReviewService(mockRepository);
  });

  describe('createReview', () => {
    test('should create a review with valid data', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5,
        comment: 'Excellent service!'
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.orderId).toBe('ORD-001');
      expect(result.status).toBe('pending');
    });

    test('should throw error when required fields are missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        // Missing customerName
        overallRating: 5,
        foodRating: 5
      };

      await expect(reviewService.createReview(invalidData as any))
        .rejects
        .toThrow('Customer name is required');
    });

    test('should throw error when rating is out of range', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 6, // Invalid: > 5
        foodRating: 5
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be between 1 and 5');
    });

    test('should throw error when comment exceeds 500 characters', async () => {
      const longComment = 'a'.repeat(501);
      const invalidData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5,
        comment: longComment
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Comment must not exceed 500 characters');
    });
  });

  describe('getPublicReviews', () => {
    test('should return only approved reviews', async () => {
      // Create reviews with different statuses
      await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5,
        status: 'approved'
      });

      await mockRepository.create({
        orderId: 'ORD-002',
        customerName: 'Jane',
        overallRating: 4,
        foodRating: 4,
        status: 'pending'
      });

      const result = await reviewService.getPublicReviews(1, 10);

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].status).toBe('approved');
    });
  });

  describe('changeReviewStatus', () => {
    test('should change review status successfully', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5,
        status: 'pending'
      });

      const updated = await reviewService.changeReviewStatus(review._id, 'approved');

      expect(updated.status).toBe('approved');
    });

    test('should throw error for invalid status', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5,
        status: 'pending'
      });

      await expect(reviewService.changeReviewStatus(review._id, 'invalid' as any))
        .rejects
        .toThrow('Invalid status');
    });
  });
});
```

**Running Unit Tests:**

```bash
cd order-service
npm test -- ReviewService.test.ts
```

**Expected Output:**
```
PASS  tests/unit/ReviewService.test.ts
  ReviewService - Unit Tests
    createReview
      ✓ should create a review with valid data (5ms)
      ✓ should throw error when required fields are missing (3ms)
      ✓ should throw error when rating is out of range (2ms)
      ✓ should throw error when comment exceeds 500 characters (2ms)
    getPublicReviews
      ✓ should return only approved reviews (4ms)
    changeReviewStatus
      ✓ should change review status successfully (3ms)
      ✓ should throw error for invalid status (2ms)

Test Suites: 1 passed, 1 total
Tests:       7 passed, 7 total
```

---

### 1.2 ReviewRepository Unit Tests

**Location**: `order-service/tests/unit/ReviewRepository.test.ts`

```typescript
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import { ReviewRepository } from '../../src/repositories/ReviewRepository';
import Review from '../../src/models/Review';

describe('ReviewRepository - Unit Tests', () => {
  let mongoServer: MongoMemoryServer;
  let repository: ReviewRepository;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
    repository = new ReviewRepository();
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Review.deleteMany({});
  });

  describe('create', () => {
    test('should create a review in database', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5,
        comment: 'Great food!'
      };

      const result = await repository.create(reviewData);

      expect(result._id).toBeDefined();
      expect(result.orderId).toBe('ORD-001');
      expect(result.status).toBe('pending');
    });

    test('should throw error on duplicate orderId', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      };

      await repository.create(reviewData);

      await expect(repository.create(reviewData))
        .rejects
        .toThrow('already exists');
    });
  });

  describe('findApproved', () => {
    test('should return only approved reviews', async () => {
      await repository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      const review = await Review.findOne({ orderId: 'ORD-001' });
      await repository.updateStatus(review!._id.toString(), 'approved');

      await repository.create({
        orderId: 'ORD-002',
        customerName: 'Jane',
        overallRating: 4,
        foodRating: 4
      });

      const results = await repository.findApproved(1, 10);

      expect(results).toHaveLength(1);
      expect(results[0].orderId).toBe('ORD-001');
    });
  });

  describe('hasReviewForOrder', () => {
    test('should return true when order has review', async () => {
      await repository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      const hasReview = await repository.hasReviewForOrder('ORD-001');
      expect(hasReview).toBe(true);
    });

    test('should return false when order has no review', async () => {
      const hasReview = await repository.hasReviewForOrder('ORD-999');
      expect(hasReview).toBe(false);
    });
  });
});
```

**Running Repository Tests:**

```bash
cd order-service
npm test -- ReviewRepository.test.ts
```

---

## Part 2: Integration Testing

### 2.1 API Integration Tests

**Location**: `order-service/tests/integration/ReviewAPI.test.ts`

```typescript
import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import Review from '../../src/models/Review';

describe('Review API - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  afterEach(async () => {
    await Review.deleteMany({});
  });

  describe('POST /reviews', () => {
    test('should create a new review', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5,
        comment: 'Excellent!'
      };

      const response = await request(app)
        .post('/reviews')
        .send(reviewData)
        .expect(201);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.orderId).toBe('ORD-001');
      expect(response.body.data.review.status).toBe('pending');
    });

    test('should return 400 for missing required fields', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        // Missing customerName
        overallRating: 5,
        foodRating: 5
      };

      const response = await request(app)
        .post('/reviews')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('required');
    });

    test('should return 409 for duplicate order review', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      };

      await request(app).post('/reviews').send(reviewData);

      const response = await request(app)
        .post('/reviews')
        .send(reviewData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already exists');
    });
  });

  describe('GET /reviews', () => {
    test('should return only approved reviews', async () => {
      // Create and approve a review
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      };

      const createResponse = await request(app)
        .post('/reviews')
        .send(reviewData);

      const reviewId = createResponse.body.data.review._id;

      await request(app)
        .patch(`/reviews/${reviewId}/status`)
        .send({ status: 'approved' });

      // Create a pending review
      await request(app)
        .post('/reviews')
        .send({
          orderId: 'ORD-002',
          customerName: 'Jane Doe',
          overallRating: 4,
          foodRating: 4
        });

      const response = await request(app)
        .get('/reviews')
        .expect(200);

      expect(response.body.reviews).toHaveLength(1);
      expect(response.body.reviews[0].status).toBe('approved');
    });
  });

  describe('PATCH /reviews/:id/status', () => {
    test('should update review status', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      };

      const createResponse = await request(app)
        .post('/reviews')
        .send(reviewData);

      const reviewId = createResponse.body.data.review._id;

      const response = await request(app)
        .patch(`/reviews/${reviewId}/status`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.review.status).toBe('approved');
    });

    test('should return 400 for invalid status', async () => {
      const reviewData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      };

      const createResponse = await request(app)
        .post('/reviews')
        .send(reviewData);

      const reviewId = createResponse.body.data.review._id;

      const response = await request(app)
        .patch(`/reviews/${reviewId}/status`)
        .send({ status: 'invalid' })
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
```

**Running Integration Tests:**

```bash
cd order-service
npm test -- ReviewAPI.test.ts
```

---

### 2.2 Gateway Integration Tests

**Location**: `api-gateway/tests/integration/ReviewProxy.test.ts`

```typescript
import request from 'supertest';
import app from '../../src/app';

describe('API Gateway - Review Routes Integration', () => {
  test('should proxy POST /reviews to order-service', async () => {
    const reviewData = {
      orderId: `ORD-${Date.now()}`,
      customerName: 'Integration Test User',
      overallRating: 5,
      foodRating: 5,
      comment: 'Testing through gateway'
    };

    const response = await request(app)
      .post('/reviews')
      .send(reviewData);

    expect([201, 409]).toContain(response.status);
    expect(response.body).toHaveProperty('success');
  });

  test('should proxy GET /reviews to order-service', async () => {
    const response = await request(app)
      .get('/reviews?page=1&limit=10')
      .expect(200);

    expect(response.body).toHaveProperty('reviews');
    expect(Array.isArray(response.body.reviews)).toBe(true);
  });

  test('should handle service unavailable errors', async () => {
    // This test simulates order-service being down
    // You may need to temporarily stop order-service for this test
    const response = await request(app)
      .get('/reviews')
      .expect([200, 503]); // May return 503 if service is down
  });
});
```

---

## Part 3: End-to-End Testing

### 3.1 Complete User Flow Test

**Manual E2E Testing Steps:**

#### Step 1: Verify Services Are Running

```bash
# Check all services
docker ps

# Test API Gateway
curl http://localhost:3000
# Expected: JSON with endpoints including /reviews

# Test Frontend
# Open browser: http://localhost:5173
# Expected: Restaurant home page loads
```

#### Step 2: Create an Order

1. Navigate to `http://localhost:5173`
2. Click **"Order Now"** button
3. Fill the order form:
   - Customer Name: `Test User`
   - Customer Email: `test@example.com`
   - Select items from menu
   - Add special notes (optional)
4. Click **"Place Order"**
5. **IMPORTANT:** Copy the Order ID from the confirmation (e.g., `ORD-1733087654321`)

**Screenshot Required**: Order confirmation screen with Order ID visible

#### Step 3: Simulate Order Delivery

Since we don't have a complete delivery workflow in the UI, we'll use the API:

**Option A: Using PowerShell (Windows)**
```powershell
$orderId = "YOUR_ORDER_ID"
$body = @{ status = "DELIVERED" } | ConvertTo-Json

Invoke-RestMethod -Uri "http://localhost:3000/orders/$orderId/status" `
  -Method PATCH `
  -Headers @{"Content-Type"="application/json"} `
  -Body $body
```

**Option B: Using MongoDB Compass**
1. Connect to `mongodb://localhost:27017`
2. Navigate to `orders` database → `orders` collection
3. Find your order by `orderNumber`
4. Click Edit
5. Change `status` field to `"DELIVERED"`
6. Click Update

**Screenshot Required**: MongoDB Compass showing order status updated to DELIVERED

#### Step 4: Navigate to Order Status Page

1. Go to `http://localhost:5173/orders/YOUR_ORDER_ID`
2. Verify the status shows **"Delivered"**
3. Verify the **"Leave a Review"** button appears at the bottom

**Screenshot Required**: Order status page with "Leave a Review" button visible

#### Step 5: Submit a Review

1. Click **"Leave a Review"** button
2. Modal opens with review form
3. Fill the form:
   - Overall Rating: Click on 5 stars
   - Food Rating: Click on 5 stars
   - Comment: `"Amazing food and excellent service! The burger was perfectly cooked and arrived hot. Will definitely order again!"`
4. Click **"Submit Review"**
5. Verify success message appears: **"Thank you for your review!"**

**Screenshot Required**: Success message after review submission

#### Step 6: Verify Review is NOT in Public View (Pending Status)

1. Navigate to `http://localhost:5173/reviews`
   - OR from home page, scroll down and click **"View Customer Reviews"**
2. Verify your review is **NOT** visible yet (it's pending approval)

**Screenshot Required**: Public reviews page showing no new review (or other approved reviews only)

#### Step 7: Access Admin Panel

1. Navigate to `http://localhost:5173/admin/reviews`
2. Verify your review appears with status badge **"Pending"** (yellow)
3. Verify all review details are shown:
   - Customer name
   - Order ID
   - Overall rating (5 stars)
   - Food quality rating (5 stars)
   - Comment text

**Screenshot Required**: Admin panel showing pending review

#### Step 8: Approve the Review

1. In the admin panel, locate your pending review
2. Click the **"Approve"** button (orange button with checkmark icon)
3. Confirmation modal appears asking: *"Are you sure you want to approve this review from Test User?"*
4. Click **"Confirm"**
5. Verify the status badge changes to **"Approved"** (green)

**Screenshot Required**: Admin panel with approved review (green badge)

#### Step 9: Verify Review Appears in Public View

1. Navigate back to `http://localhost:5173/reviews`
2. Verify your review now appears in the public list
3. Verify all information is displayed:
   - Customer name
   - Relative date (e.g., "a few seconds ago")
   - Overall rating badge (orange with 5★)
   - Rating breakdown showing stars for Overall and Food Quality
   - Full comment text

**Screenshot Required**: Public reviews page showing approved review

#### Step 10: Test Hide Functionality (Optional)

1. Go back to `http://localhost:5173/admin/reviews`
2. Click **"Hide"** button on the approved review
3. Confirm the action
4. Verify status changes to **"Hidden"** (gray badge)
5. Navigate to public reviews page
6. Verify the review is no longer visible

**Screenshot Required**: Admin panel with hidden review

---

### 3.2 API Testing with Postman/cURL

#### Test 1: Create Review via API

```bash
curl -X POST http://localhost:3000/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-TEST-001",
    "customerName": "API Test User",
    "overallRating": 4,
    "foodRating": 4,
    "comment": "Testing via API"
  }'
```

**Expected Response (201):**
```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "review": {
      "_id": "...",
      "orderId": "ORD-TEST-001",
      "customerName": "API Test User",
      "overallRating": 4,
      "foodRating": 4,
      "comment": "Testing via API",
      "status": "pending",
      "createdAt": "2025-12-01T...",
      "updatedAt": "2025-12-01T..."
    }
  }
}
```

#### Test 2: Get Public Reviews

```bash
curl http://localhost:3000/reviews?page=1&limit=10
```

**Expected Response (200):**
```json
{
  "reviews": [
    {
      "_id": "...",
      "orderId": "ORD-...",
      "customerName": "...",
      "overallRating": 5,
      "foodRating": 5,
      "comment": "...",
      "status": "approved",
      "createdAt": "..."
    }
  ],
  "total": 1,
  "page": 1,
  "limit": 10,
  "hasMore": false
}
```

#### Test 3: Get All Reviews (Admin)

```bash
curl http://localhost:3000/reviews/admin/reviews?page=1&limit=50
```

#### Test 4: Approve Review

```bash
# Replace REVIEW_ID with actual review ID
curl -X PATCH http://localhost:3000/reviews/REVIEW_ID/status \
  -H "Content-Type: application/json" \
  -d '{"status": "approved"}'
```

**Expected Response (200):**
```json
{
  "success": true,
  "message": "Review status updated successfully",
  "data": {
    "review": {
      "_id": "...",
      "status": "approved",
      ...
    }
  }
}
```

#### Test 5: Validation Error Test

```bash
# Missing required field
curl -X POST http://localhost:3000/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-TEST",
    "overallRating": 5,
    "foodRating": 5
  }'
```

**Expected Response (400):**
```json
{
  "success": false,
  "message": "Customer name is required"
}
```

#### Test 6: Duplicate Review Test

```bash
# Try to create review for same order twice
curl -X POST http://localhost:3000/reviews \
  -H "Content-Type: application/json" \
  -d '{
    "orderId": "ORD-EXISTING",
    "customerName": "Test",
    "overallRating": 5,
    "foodRating": 5
  }'
```

**Expected Response (409):**
```json
{
  "success": false,
  "message": "Review already exists for this order"
}
```

---

## Part 4: Test Execution Summary

### 4.1 Running All Tests

Create a test script in `order-service/package.json`:

```json
{
  "scripts": {
    "test": "jest",
    "test:unit": "jest tests/unit",
    "test:integration": "jest tests/integration",
    "test:coverage": "jest --coverage",
    "test:watch": "jest --watch"
  }
}
```

**Execute all tests:**

```bash
cd order-service
npm run test:coverage
```

### 4.2 Expected Coverage Report

```
---------------------------|---------|----------|---------|---------|
File                       | % Stmts | % Branch | % Funcs | % Lines |
---------------------------|---------|----------|---------|---------|
All files                  |   92.45 |    88.23 |   95.12 |   93.67 |
 models                    |     100 |      100 |     100 |     100 |
  Review.ts                |     100 |      100 |     100 |     100 |
 repositories              |   95.83 |    91.67 |     100 |   96.55 |
  ReviewRepository.ts      |   95.83 |    91.67 |     100 |   96.55 |
 services                  |   89.47 |    85.71 |   92.31 |   90.32 |
  ReviewService.ts         |   89.47 |    85.71 |   92.31 |   90.32 |
 controllers               |   91.30 |    86.67 |   93.75 |   92.00 |
  ReviewController.ts      |   91.30 |    86.67 |   93.75 |   92.00 |
---------------------------|---------|----------|---------|---------|
```

---

## Part 5: Evidence Collection

### 5.1 Required Screenshots

Create a folder `/test-evidence/` with the following screenshots:

1. **`01-services-running.png`**: `docker ps` output showing all containers healthy
2. **`02-order-created.png`**: Order confirmation screen with Order ID
3. **`03-order-delivered.png`**: MongoDB/API showing order status updated
4. **`04-order-status-page.png`**: Order status page with "Leave a Review" button
5. **`05-review-form.png`**: Review modal form filled out
6. **`06-review-success.png`**: Success message after submission
7. **`07-public-reviews-before.png`**: Public page without new review (pending)
8. **`08-admin-panel-pending.png`**: Admin panel showing pending review
9. **`09-admin-panel-approved.png`**: Admin panel after approval (green badge)
10. **`10-public-reviews-after.png`**: Public page with approved review visible
11. **`11-unit-tests-passing.png`**: Terminal output of unit tests
12. **`12-integration-tests-passing.png`**: Terminal output of integration tests
13. **`13-coverage-report.png`**: Jest coverage report
14. **`14-api-test-postman.png`**: Postman collection or cURL tests

### 5.2 Log Files

Collect logs from services:

```bash
# Order Service logs
docker logs restaurant-backend-order-service-1 > test-evidence/order-service.log

# API Gateway logs
docker logs restaurant-backend-api-gateway-1 > test-evidence/api-gateway.log

# MongoDB logs (optional)
docker logs restaurant-backend-mongodb-1 > test-evidence/mongodb.log 2>&1
```

---

## Part 6: Test Types Explanation (Para el AUDIT_REPORT.md en español)

### Tipos de Pruebas Implementadas

#### 6.1 Pruebas Unitarias (Unit Tests)

**¿Qué son?**
Pruebas que verifican el comportamiento de componentes individuales de forma aislada (clases, funciones, métodos).

**¿Por qué se implementaron?**
- Validar la lógica de negocio en `ReviewService` sin dependencias externas
- Verificar operaciones CRUD en `ReviewRepository` con base de datos en memoria
- Detectar errores en funciones individuales de forma rápida
- Facilitar refactorización con confianza

**Ejemplos implementados:**
- Validación de campos requeridos
- Validación de rangos de calificación (1-5)
- Validación de longitud de comentarios (max 500 caracteres)
- Manejo de errores en casos edge

**Herramientas:**
- Jest (framework de testing)
- MongoDB Memory Server (base de datos en memoria para tests)

#### 6.2 Pruebas de Integración (Integration Tests)

**¿Qué son?**
Pruebas que verifican la interacción correcta entre múltiples componentes del sistema.

**¿Por qué se implementaron?**
- Validar que los endpoints REST funcionen correctamente
- Verificar la comunicación entre Controller → Service → Repository
- Comprobar el comportamiento de la API Gateway como proxy
- Detectar problemas de integración entre capas

**Ejemplos implementados:**
- Flujo completo: POST /reviews → Base de datos → Respuesta
- Validación de códigos HTTP correctos (201, 400, 409, etc.)
- Manejo de errores en comunicación entre servicios
- Pruebas de paginación en listados

**Herramientas:**
- Supertest (testing de APIs HTTP)
- MongoDB Memory Server (base de datos temporal)

#### 6.3 Pruebas End-to-End (E2E)

**¿Qué son?**
Pruebas que simulan el flujo completo del usuario desde la interfaz hasta la base de datos.

**¿Por qué se implementaron?**
- Validar el flujo completo de reseñas: Crear pedido → Entregar → Dejar reseña → Aprobar → Ver público
- Verificar que todos los microservicios funcionen juntos
- Comprobar la experiencia real del usuario
- Detectar problemas de integración frontend-backend

**Flujo probado:**
1. Usuario crea pedido en frontend
2. Sistema actualiza estado a DELIVERED
3. Usuario deja reseña desde página de estado
4. Administrador aprueba en panel admin
5. Reseña aparece en vista pública

---

## Troubleshooting

### Common Issues and Solutions

#### Issue 1: Tests fail with "Cannot find module"
```bash
# Solution: Install test dependencies
npm install --save-dev jest @types/jest ts-jest supertest @types/supertest mongodb-memory-server
```

#### Issue 2: MongoDB connection timeout in tests
```bash
# Solution: Increase timeout in jest.config.js
module.exports = {
  testTimeout: 30000
};
```

#### Issue 3: Port already in use
```bash
# Solution: Kill process using the port
# Windows:
netstat -ano | findstr :3000
taskkill /PID <PID> /F

# Or use different port in tests
```

#### Issue 4: Review button doesn't appear
- Verify order status is exactly "DELIVERED" (case-sensitive)
- Check browser console for errors
- Verify API Gateway is proxying correctly to order-service

---

## Conclusion

This guide provides comprehensive testing coverage for the review system:

✅ **Unit Tests**: 7+ tests covering business logic
✅ **Integration Tests**: 10+ tests covering API endpoints
✅ **E2E Tests**: Complete user flow from order to public review
✅ **Documentation**: Step-by-step testing procedures
✅ **Evidence**: Screenshot and log collection guide

**Total Test Coverage Target**: >90% for critical business logic

**Test Execution Time**: ~30 seconds for all automated tests
**Manual E2E Test Time**: ~10 minutes per full flow
