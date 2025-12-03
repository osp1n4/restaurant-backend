/**
 * Integration Tests - Review Module
 * Tests the complete flow: API → Controller → Service → Repository → MongoDB
 *
 * These tests verify:
 * - Real HTTP requests/responses
 * - Complete data flow through all layers
 * - MongoDB integration with real database
 * - RabbitMQ message publishing
 * - Error handling across the stack
 */

import request from 'supertest';
import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import app from '../../src/app';
import Review from '../../src/models/Review';
import { publishReviewCreated } from '../../src/rabbitmq/publishers';

// Mock RabbitMQ publisher
jest.mock('../../src/rabbitmq/publishers', () => ({
  publishReviewCreated: jest.fn(),
}));

describe('Review Module - Integration Tests', () => {
  let mongoServer: MongoMemoryServer;

  beforeAll(async () => {
    // Disconnect any existing connections
    await mongoose.disconnect();

    // Start MongoDB Memory Server
    mongoServer = await MongoMemoryServer.create();
    const mongoUri = mongoServer.getUri();

    // Connect to the in-memory database
    await mongoose.connect(mongoUri);
  });

  afterAll(async () => {
    await mongoose.disconnect();
    await mongoServer.stop();
  });

  beforeEach(async () => {
    // Clear database before each test
    await Review.deleteMany({});
    jest.clearAllMocks();
  });

  describe('POST /api/reviews - Create Review', () => {
    const validReviewData = {
      orderId: 'ORD-12345',
      customerName: 'John Doe',
      customerEmail: 'john.doe@example.com',
      ratings: {
        overall: 5,
        food: 5,
      },
      comment: 'Excellent service and delicious food!',
    };

    test('should create a review with valid data and return 201', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .send(validReviewData)
        .expect('Content-Type', /json/)
        .expect(201);

      // Verify response structure
      expect(response.body).toHaveProperty('success', true);
      expect(response.body).toHaveProperty('data');
      expect(response.body).toHaveProperty('message');

      // Verify review data
      const { data } = response.body;
      expect(data).toHaveProperty('_id');
      expect(data.orderId).toBe(validReviewData.orderId);
      expect(data.customerName).toBe(validReviewData.customerName);
      expect(data.customerEmail).toBe(validReviewData.customerEmail);
      expect(data.ratings.overall).toBe(validReviewData.ratings.overall);
      expect(data.ratings.food).toBe(validReviewData.ratings.food);
      expect(data.comment).toBe(validReviewData.comment);
      expect(data.status).toBe('pending');

      // Verify review was saved in database
      const savedReview = await Review.findOne({ orderId: validReviewData.orderId });
      expect(savedReview).toBeTruthy();
      expect(savedReview!.customerName).toBe(validReviewData.customerName);

      // Verify RabbitMQ message was published
      expect(publishReviewCreated).toHaveBeenCalledWith(expect.objectContaining({
        orderId: validReviewData.orderId,
        customerName: validReviewData.customerName,
      }));
    });

    test('should create a review without comment', async () => {
      const dataWithoutComment = {
        ...validReviewData,
        comment: undefined,
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(dataWithoutComment)
        .expect(201);

      expect(response.body.data).not.toHaveProperty('comment');

      // Verify in database
      const savedReview = await Review.findOne({ orderId: validReviewData.orderId });
      expect(savedReview!.comment).toBeUndefined();
    });

    test('should return 400 for missing required fields', async () => {
      const invalidData = {
        orderId: 'ORD-123',
        // Missing customerName, customerEmail, ratings
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400);

      expect(response.body).toHaveProperty('success', false);
      expect(response.body).toHaveProperty('message');

      // Verify no review was saved
      const count = await Review.countDocuments();
      expect(count).toBe(0);
    });

    test('should return 400 for invalid rating values', async () => {
      const invalidRatings = {
        ...validReviewData,
        ratings: {
          overall: 6, // Invalid: greater than 5
          food: 5,
        },
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidRatings)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('rating');
    });

    test('should return 409 when review already exists for order', async () => {
      // Create first review
      await request(app).post('/api/reviews').send(validReviewData).expect(201);

      // Attempt to create duplicate review
      const response = await request(app)
        .post('/api/reviews')
        .send(validReviewData)
        .expect(409);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('already');

      // Verify only one review exists
      const count = await Review.countDocuments({ orderId: validReviewData.orderId });
      expect(count).toBe(1);
    });

    test('should reject comment exceeding 500 characters', async () => {
      const longComment = 'a'.repeat(501);
      const invalidData = {
        ...validReviewData,
        comment: longComment,
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(invalidData)
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('500');
    });

    test('should trim whitespace from customerName', async () => {
      const dataWithWhitespace = {
        ...validReviewData,
        customerName: '  John Doe  ',
      };

      const response = await request(app)
        .post('/api/reviews')
        .send(dataWithWhitespace)
        .expect(201);

      expect(response.body.data.customerName).toBe('John Doe');
    });
  });

  describe('GET /api/reviews - Get Public Reviews', () => {
    beforeEach(async () => {
      // Seed database with test reviews
      await Review.create([
        {
          orderId: 'ORD-001',
          customerName: 'Alice',
          customerEmail: 'alice@example.com',
          ratings: { overall: 5, food: 5 },
          comment: 'Great!',
          status: 'approved',
        },
        {
          orderId: 'ORD-002',
          customerName: 'Bob',
          customerEmail: 'bob@example.com',
          ratings: { overall: 4, food: 4 },
          status: 'approved',
        },
        {
          orderId: 'ORD-003',
          customerName: 'Charlie',
          customerEmail: 'charlie@example.com',
          ratings: { overall: 3, food: 3 },
          status: 'pending', // Should not be returned
        },
        {
          orderId: 'ORD-004',
          customerName: 'David',
          customerEmail: 'david@example.com',
          ratings: { overall: 2, food: 2 },
          status: 'hidden', // Should not be returned
        },
      ]);
    });

    test('should return only approved reviews', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data).toBeInstanceOf(Array);
      expect(response.body.data.length).toBe(2);

      // Verify all returned reviews are approved
      response.body.data.forEach((review: any) => {
        expect(review.status).toBe('approved');
      });
    });

    test('should support pagination with page and limit', async () => {
      const response = await request(app)
        .get('/api/reviews?page=1&limit=1')
        .expect(200);

      expect(response.body.data.length).toBe(1);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 1,
        total: 2,
      });
    });

    test('should return empty array when no approved reviews exist', async () => {
      // Delete all approved reviews
      await Review.deleteMany({ status: 'approved' });

      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(response.body.data).toEqual([]);
      expect(response.body.pagination.total).toBe(0);
    });

    test('should order reviews by creation date (newest first)', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      const reviews = response.body.data;
      for (let i = 0; i < reviews.length - 1; i++) {
        const currentDate = new Date(reviews[i].createdAt);
        const nextDate = new Date(reviews[i + 1].createdAt);
        expect(currentDate.getTime()).toBeGreaterThanOrEqual(nextDate.getTime());
      }
    });

    test('should use default pagination when parameters not provided', async () => {
      const response = await request(app)
        .get('/api/reviews')
        .expect(200);

      expect(response.body.pagination.page).toBe(1);
      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('GET /api/reviews/:id - Get Review by ID', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await Review.create({
        orderId: 'ORD-100',
        customerName: 'Test User',
        customerEmail: 'test@example.com',
        ratings: { overall: 4, food: 4 },
        status: 'approved',
      });
      reviewId = review._id.toString();
    });

    test('should return review when found', async () => {
      const response = await request(app)
        .get(`/api/reviews/${reviewId}`)
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data._id).toBe(reviewId);
      expect(response.body.data.orderId).toBe('ORD-100');
    });

    test('should return 404 when review not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .get(`/api/reviews/${fakeId}`)
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should return 400 for invalid ObjectId format', async () => {
      const response = await request(app)
        .get('/api/reviews/invalid-id-format')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });

  describe('GET /api/admin/reviews - Get All Reviews (Admin)', () => {
    beforeEach(async () => {
      // Seed database with reviews in different statuses
      await Review.create([
        {
          orderId: 'ORD-A1',
          customerName: 'User A',
          customerEmail: 'a@example.com',
          ratings: { overall: 5, food: 5 },
          status: 'approved',
        },
        {
          orderId: 'ORD-A2',
          customerName: 'User B',
          customerEmail: 'b@example.com',
          ratings: { overall: 4, food: 4 },
          status: 'pending',
        },
        {
          orderId: 'ORD-A3',
          customerName: 'User C',
          customerEmail: 'c@example.com',
          ratings: { overall: 3, food: 3 },
          status: 'hidden',
        },
      ]);
    });

    test('should return all reviews regardless of status', async () => {
      const response = await request(app)
        .get('/api/admin/reviews')
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.length).toBe(3);

      // Verify all statuses are present
      const statuses = response.body.data.map((r: any) => r.status);
      expect(statuses).toContain('approved');
      expect(statuses).toContain('pending');
      expect(statuses).toContain('hidden');
    });

    test('should support pagination for admin endpoint', async () => {
      const response = await request(app)
        .get('/api/admin/reviews?page=1&limit=2')
        .expect(200);

      expect(response.body.data.length).toBe(2);
      expect(response.body.pagination.total).toBe(3);
    });

    test('should use default limit of 10 for admin', async () => {
      const response = await request(app)
        .get('/api/admin/reviews')
        .expect(200);

      expect(response.body.pagination.limit).toBe(10);
    });
  });

  describe('PATCH /api/reviews/:id/status - Change Review Status', () => {
    let reviewId: string;

    beforeEach(async () => {
      const review = await Review.create({
        orderId: 'ORD-STATUS',
        customerName: 'Status Test',
        customerEmail: 'status@example.com',
        ratings: { overall: 4, food: 4 },
        status: 'pending',
      });
      reviewId = review._id.toString();
    });

    test('should change status from pending to approved', async () => {
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}/status`)
        .send({ status: 'approved' })
        .expect(200);

      expect(response.body.success).toBe(true);
      expect(response.body.data.status).toBe('approved');

      // Verify in database
      const updatedReview = await Review.findById(reviewId);
      expect(updatedReview!.status).toBe('approved');
    });

    test('should change status from approved to hidden', async () => {
      // First approve the review
      await Review.findByIdAndUpdate(reviewId, { status: 'approved' });

      const response = await request(app)
        .patch(`/api/reviews/${reviewId}/status`)
        .send({ status: 'hidden' })
        .expect(200);

      expect(response.body.data.status).toBe('hidden');

      // Verify in database
      const updatedReview = await Review.findById(reviewId);
      expect(updatedReview!.status).toBe('hidden');
    });

    test('should return 400 for invalid status value', async () => {
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}/status`)
        .send({ status: 'invalid-status' })
        .expect(400);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('Invalid');
    });

    test('should return 400 when status field is missing', async () => {
      const response = await request(app)
        .patch(`/api/reviews/${reviewId}/status`)
        .send({}) // Empty body
        .expect(400);

      expect(response.body.success).toBe(false);
    });

    test('should return 404 when review not found', async () => {
      const fakeId = new mongoose.Types.ObjectId();
      const response = await request(app)
        .patch(`/api/reviews/${fakeId}/status`)
        .send({ status: 'approved' })
        .expect(404);

      expect(response.body.success).toBe(false);
      expect(response.body.message).toContain('not found');
    });

    test('should handle concurrent status updates correctly', async () => {
      // Simulate concurrent requests
      const promises = [
        request(app).patch(`/api/reviews/${reviewId}/status`).send({ status: 'approved' }),
        request(app).patch(`/api/reviews/${reviewId}/status`).send({ status: 'hidden' }),
      ];

      const responses = await Promise.all(promises);

      // At least one should succeed
      const successCount = responses.filter((r) => r.status === 200).length;
      expect(successCount).toBeGreaterThan(0);

      // Final status should be one of the requested values
      const finalReview = await Review.findById(reviewId);
      expect(['approved', 'hidden']).toContain(finalReview!.status);
    });
  });

  describe('End-to-End Flow - Complete Review Lifecycle', () => {
    test('should handle complete review lifecycle', async () => {
      // Step 1: Create a review
      const createResponse = await request(app)
        .post('/api/reviews')
        .send({
          orderId: 'ORD-E2E',
          customerName: 'E2E Test User',
          customerEmail: 'e2e@example.com',
          ratings: { overall: 5, food: 5 },
          comment: 'End-to-end test review',
        })
        .expect(201);

      const reviewId = createResponse.body.data._id;
      expect(reviewId).toBeTruthy();

      // Step 2: Verify review is NOT visible in public list (status: pending)
      const publicListBefore = await request(app).get('/api/reviews').expect(200);
      const isVisibleBefore = publicListBefore.body.data.some(
        (r: any) => r._id === reviewId
      );
      expect(isVisibleBefore).toBe(false);

      // Step 3: Approve the review
      await request(app)
        .patch(`/api/reviews/${reviewId}/status`)
        .send({ status: 'approved' })
        .expect(200);

      // Step 4: Verify review is NOW visible in public list
      const publicListAfter = await request(app).get('/api/reviews').expect(200);
      const isVisibleAfter = publicListAfter.body.data.some(
        (r: any) => r._id === reviewId
      );
      expect(isVisibleAfter).toBe(true);

      // Step 5: Get review by ID
      const getByIdResponse = await request(app)
        .get(`/api/reviews/${reviewId}`)
        .expect(200);
      expect(getByIdResponse.body.data.status).toBe('approved');

      // Step 6: Hide the review
      await request(app)
        .patch(`/api/reviews/${reviewId}/status`)
        .send({ status: 'hidden' })
        .expect(200);

      // Step 7: Verify review is NO LONGER visible in public list
      const publicListFinal = await request(app).get('/api/reviews').expect(200);
      const isVisibleFinal = publicListFinal.body.data.some(
        (r: any) => r._id === reviewId
      );
      expect(isVisibleFinal).toBe(false);

      // Step 8: Verify admin can still see the hidden review
      const adminList = await request(app).get('/api/admin/reviews').expect(200);
      const adminCanSee = adminList.body.data.some((r: any) => r._id === reviewId);
      expect(adminCanSee).toBe(true);
    });
  });

  describe('Performance Tests', () => {
    test('should handle bulk review creation efficiently', async () => {
      const startTime = Date.now();
      const promises = [];

      // Create 50 reviews
      for (let i = 0; i < 50; i++) {
        promises.push(
          request(app)
            .post('/api/reviews')
            .send({
              orderId: `ORD-BULK-${i}`,
              customerName: `Bulk User ${i}`,
              customerEmail: `bulk${i}@example.com`,
              ratings: { overall: 5, food: 5 },
            })
        );
      }

      await Promise.all(promises);
      const duration = Date.now() - startTime;

      // Verify all reviews were created
      const count = await Review.countDocuments();
      expect(count).toBe(50);

      // Performance assertion: Should complete in reasonable time
      expect(duration).toBeLessThan(10000); // Less than 10 seconds
    });

    test('should paginate large datasets efficiently', async () => {
      // Create 100 approved reviews
      const reviews = Array.from({ length: 100 }, (_, i) => ({
        orderId: `ORD-PAGE-${i}`,
        customerName: `User ${i}`,
        customerEmail: `user${i}@example.com`,
        ratings: { overall: 5, food: 5 },
        status: 'approved',
      }));
      await Review.insertMany(reviews);

      const startTime = Date.now();
      const response = await request(app)
        .get('/api/reviews?page=5&limit=10')
        .expect(200);
      const duration = Date.now() - startTime;

      expect(response.body.data.length).toBe(10);
      expect(response.body.pagination.total).toBe(100);
      expect(response.body.pagination.totalPages).toBe(10);

      // Should respond quickly even with large dataset
      expect(duration).toBeLessThan(1000); // Less than 1 second
    });
  });

  describe('Error Handling', () => {
    test('should handle MongoDB connection errors gracefully', async () => {
      // Close MongoDB connection to simulate error
      await mongoose.connection.close();

      const response = await request(app)
        .get('/api/reviews')
        .expect(500);

      expect(response.body.success).toBe(false);

      // Reconnect for other tests
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri);
    });

    test('should handle malformed JSON in request body', async () => {
      const response = await request(app)
        .post('/api/reviews')
        .set('Content-Type', 'application/json')
        .send('{ invalid json }')
        .expect(400);

      expect(response.body.success).toBe(false);
    });
  });
});
