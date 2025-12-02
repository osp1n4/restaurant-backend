import { ReviewService } from '../../src/services/ReviewService';
import { IReviewRepository } from '../../src/repositories/ReviewRepository';
import { CreateReviewDTO, IReview, ReviewStatus } from '../../src/types/review';

// Mock implementation of ReviewRepository for testing
class MockReviewRepository implements IReviewRepository {
  private reviews: IReview[] = [];
  private idCounter = 1;

  async create(reviewData: CreateReviewDTO): Promise<IReview> {
    const review: IReview = {
      _id: `mock-id-${this.idCounter++}`,
      ...reviewData,
      status: 'pending' as ReviewStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as IReview;

    this.reviews.push(review);
    return review;
  }

  async findById(id: string): Promise<IReview | null> {
    return this.reviews.find(r => r._id === id) || null;
  }

  async findApproved(page: number, limit: number): Promise<IReview[]> {
    const approved = this.reviews.filter(r => r.status === 'approved');
    const start = (page - 1) * limit;
    return approved.slice(start, start + limit);
  }

  async findAll(page: number, limit: number): Promise<IReview[]> {
    const start = (page - 1) * limit;
    return this.reviews.slice(start, start + limit);
  }

  async updateStatus(id: string, status: ReviewStatus): Promise<IReview | null> {
    const review = this.reviews.find(r => r._id === id);
    if (review) {
      review.status = status;
      review.updatedAt = new Date();
    }
    return review || null;
  }

  async countApproved(): Promise<number> {
    return this.reviews.filter(r => r.status === 'approved').length;
  }

  async countAll(): Promise<number> {
    return this.reviews.length;
  }

  async hasReviewForOrder(orderId: string): Promise<boolean> {
    return this.reviews.some(r => r.orderId === orderId);
  }

  // Helper method for tests to reset state
  reset(): void {
    this.reviews = [];
    this.idCounter = 1;
  }
}

describe('ReviewService - Unit Tests', () => {
  let reviewService: ReviewService;
  let mockRepository: MockReviewRepository;

  beforeEach(() => {
    mockRepository = new MockReviewRepository();
    reviewService = new ReviewService(mockRepository);
  });

  afterEach(() => {
    mockRepository.reset();
  });

  describe('createReview', () => {
    test('should create a review with valid data', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5,
        comment: 'Excellent service!'
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.orderId).toBe('ORD-001');
      expect(result.customerName).toBe('John Doe');
      expect(result.overallRating).toBe(5);
      expect(result.foodRating).toBe(5);
      expect(result.comment).toBe('Excellent service!');
      expect(result.status).toBe('pending');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('should create a review without comment', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-002',
        customerName: 'Jane Smith',
        overallRating: 4,
        foodRating: 5
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.comment).toBeUndefined();
    });

    test('should throw error when orderId is missing', async () => {
      const invalidData = {
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Order ID is required');
    });

    test('should throw error when customerName is missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        overallRating: 5,
        foodRating: 5
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Customer name is required');
    });

    test('should throw error when customerName is empty string', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: '   ',
        overallRating: 5,
        foodRating: 5
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Customer name is required');
    });

    test('should throw error when overall rating is missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        foodRating: 5
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating is required');
    });

    test('should throw error when food rating is missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating is required');
    });

    test('should throw error when overall rating is less than 1', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 0,
        foodRating: 5
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be between 1 and 5');
    });

    test('should throw error when overall rating is greater than 5', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 6,
        foodRating: 5
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be between 1 and 5');
    });

    test('should throw error when food rating is less than 1', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 0
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating must be between 1 and 5');
    });

    test('should throw error when food rating is greater than 5', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 7
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating must be between 1 and 5');
    });

    test('should throw error when comment exceeds 500 characters', async () => {
      const longComment = 'a'.repeat(501);
      const invalidData: CreateReviewDTO = {
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

    test('should accept comment with exactly 500 characters', async () => {
      const maxComment = 'a'.repeat(500);
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5,
        comment: maxComment
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.comment).toBe(maxComment);
    });

    test('should throw error when review already exists for order', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        overallRating: 5,
        foodRating: 5
      };

      // Create first review
      await reviewService.createReview(reviewData);

      // Try to create duplicate
      await expect(reviewService.createReview(reviewData))
        .rejects
        .toThrow('Review already exists for this order');
    });
  });

  describe('getPublicReviews', () => {
    test('should return only approved reviews', async () => {
      // Create reviews with different statuses
      await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      await mockRepository.create({
        orderId: 'ORD-002',
        customerName: 'Jane',
        overallRating: 4,
        foodRating: 4
      });

      await mockRepository.create({
        orderId: 'ORD-003',
        customerName: 'Bob',
        overallRating: 3,
        foodRating: 3
      });

      // Approve only the first review
      const firstReview = await mockRepository.findById('mock-id-1');
      if (firstReview) {
        await mockRepository.updateStatus(firstReview._id, 'approved');
      }

      const result = await reviewService.getPublicReviews(1, 10);

      expect(result.reviews).toHaveLength(1);
      expect(result.reviews[0].status).toBe('approved');
      expect(result.reviews[0].orderId).toBe('ORD-001');
    });

    test('should return empty array when no approved reviews exist', async () => {
      // Create only pending reviews
      await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      const result = await reviewService.getPublicReviews(1, 10);

      expect(result.reviews).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.hasMore).toBe(false);
    });

    test('should handle pagination correctly', async () => {
      // Create and approve multiple reviews
      for (let i = 1; i <= 15; i++) {
        const review = await mockRepository.create({
          orderId: `ORD-${i.toString().padStart(3, '0')}`,
          customerName: `Customer ${i}`,
          overallRating: 5,
          foodRating: 5
        });
        await mockRepository.updateStatus(review._id, 'approved');
      }

      // Get first page (10 items)
      const page1 = await reviewService.getPublicReviews(1, 10);
      expect(page1.reviews).toHaveLength(10);
      expect(page1.total).toBe(15);
      expect(page1.hasMore).toBe(true);
      expect(page1.page).toBe(1);

      // Get second page (5 remaining items)
      const page2 = await reviewService.getPublicReviews(2, 10);
      expect(page2.reviews).toHaveLength(5);
      expect(page2.total).toBe(15);
      expect(page2.hasMore).toBe(false);
      expect(page2.page).toBe(2);
    });
  });

  describe('getAllReviews', () => {
    test('should return all reviews regardless of status', async () => {
      // Create reviews with different statuses
      const review1 = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      const review2 = await mockRepository.create({
        orderId: 'ORD-002',
        customerName: 'Jane',
        overallRating: 4,
        foodRating: 4
      });

      await mockRepository.updateStatus(review1._id, 'approved');
      await mockRepository.updateStatus(review2._id, 'hidden');

      await mockRepository.create({
        orderId: 'ORD-003',
        customerName: 'Bob',
        overallRating: 3,
        foodRating: 3
      }); // Stays pending

      const result = await reviewService.getAllReviews(1, 50);

      expect(result.reviews).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  describe('changeReviewStatus', () => {
    test('should change status from pending to approved', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      const updated = await reviewService.changeReviewStatus(review._id, 'approved');

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('approved');
    });

    test('should change status from approved to hidden', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      await mockRepository.updateStatus(review._id, 'approved');
      const updated = await reviewService.changeReviewStatus(review._id, 'hidden');

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('hidden');
    });

    test('should throw error for invalid status', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      await expect(reviewService.changeReviewStatus(review._id, 'invalid' as any))
        .rejects
        .toThrow('Invalid status');
    });

    test('should throw error when review not found', async () => {
      await expect(reviewService.changeReviewStatus('non-existent-id', 'approved'))
        .rejects
        .toThrow('Review not found');
    });
  });

  describe('getReviewById', () => {
    test('should return review when it exists', async () => {
      const created = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        overallRating: 5,
        foodRating: 5
      });

      const found = await reviewService.getReviewById(created._id);

      expect(found).toBeDefined();
      expect(found!._id).toBe(created._id);
      expect(found!.orderId).toBe('ORD-001');
    });

    test('should return null when review does not exist', async () => {
      const found = await reviewService.getReviewById('non-existent-id');

      expect(found).toBeNull();
    });
  });
});
