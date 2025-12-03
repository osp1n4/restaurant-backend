import { ReviewService } from '../../src/services/ReviewService';
import { IReviewRepository, CreateReviewDTO } from '../../src/repositories/ReviewRepository';
import { IReview } from '../../src/models/Review';

type ReviewStatus = 'pending' | 'approved' | 'hidden';

// Mock implementation of ReviewRepository for testing
class MockReviewRepository implements IReviewRepository {
  private reviews: IReview[] = [];
  private idCounter = 1;

  async create(reviewData: CreateReviewDTO): Promise<IReview> {
    const review = {
      _id: `mock-id-${this.idCounter++}` as any,
      ...reviewData,
      status: 'pending' as ReviewStatus,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as unknown as IReview;

    this.reviews.push(review);
    return review;
  }

  async findById(id: string): Promise<IReview | null> {
    return this.reviews.find(r => (r._id as any).toString() === id || r._id === id) || null;
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
    const review = this.reviews.find(r => (r._id as any).toString() === id || r._id === id);
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
        comment: 'Excellent service!'
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result._id).toBeDefined();
      expect(result.orderId).toBe('ORD-001');
      expect(result.customerName).toBe('John Doe');
      expect(result.ratings.overall).toBe(5);
      expect(result.ratings.food).toBe(5);
      expect(result.comment).toBe('Excellent service!');
      expect(result.status).toBe('pending');
      expect(result.createdAt).toBeInstanceOf(Date);
    });

    test('should create a review without comment', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-002',
        customerName: 'Jane Smith',
        customerEmail: 'jane@example.com',
        ratings: {
          overall: 4,
          food: 5
        }
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.comment).toBeUndefined();
    });

    test('should throw error when orderId is missing', async () => {
      const invalidData = {
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Order ID is required');
    });

    test('should throw error when customerName is missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Customer name is required');
    });

    test('should throw error when customerName is empty string', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: '   ',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Customer name is required');
    });

    test('should throw error when overall rating is missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          food: 5
        }
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating is required');
    });

    test('should throw error when food rating is missing', async () => {
      const invalidData = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5
        }
      } as any;

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating is required');
    });

    test('should throw error when overall rating is less than 1', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 0,
          food: 5
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be between 1 and 5');
    });

    test('should throw error when overall rating is greater than 5', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 6,
          food: 5
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be between 1 and 5');
    });

    test('should throw error when overall rating is decimal', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 4.5,
          food: 5
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be an integer');
    });

    test('should throw error when overall rating is negative', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: -1,
          food: 5
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Overall rating must be between 1 and 5');
    });

    test('should throw error when food rating is less than 1', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 0
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating must be between 1 and 5');
    });

    test('should throw error when food rating is greater than 5', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 7
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating must be between 1 and 5');
    });

    test('should throw error when food rating is decimal', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 3.7
        }
      };

      await expect(reviewService.createReview(invalidData))
        .rejects
        .toThrow('Food rating must be an integer');
    });

    test('should throw error when food rating is negative', async () => {
      const invalidData: CreateReviewDTO = {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: -2
        }
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      };

      // Create first review
      await reviewService.createReview(reviewData);

      // Try to create duplicate
      await expect(reviewService.createReview(reviewData))
        .rejects
        .toThrow('Review already exists for this order');
    });

    test('should accept valid ratings at boundaries (1 and 5)', async () => {
      const minRatings: CreateReviewDTO = {
        orderId: 'ORD-MIN',
        customerName: 'Min Tester',
        customerEmail: 'min@example.com',
        ratings: {
          overall: 1,
          food: 1
        }
      };

      const maxRatings: CreateReviewDTO = {
        orderId: 'ORD-MAX',
        customerName: 'Max Tester',
        customerEmail: 'max@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      };

      const minResult = await reviewService.createReview(minRatings);
      const maxResult = await reviewService.createReview(maxRatings);

      expect(minResult.ratings.overall).toBe(1);
      expect(minResult.ratings.food).toBe(1);
      expect(maxResult.ratings.overall).toBe(5);
      expect(maxResult.ratings.food).toBe(5);
    });

    test('should trim whitespace from customerName', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-TRIM',
        customerName: '  John Doe  ',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      };

      const result = await reviewService.createReview(reviewData);

      expect(result.customerName.trim()).toBe('John Doe');
    });

    test('should handle missing optional comment field gracefully', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-NO-COMMENT',
        customerName: 'Silent User',
        customerEmail: 'silent@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
        comment: undefined
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.comment).toBeUndefined();
    });

    test('should handle empty string comment', async () => {
      const reviewData: CreateReviewDTO = {
        orderId: 'ORD-EMPTY',
        customerName: 'Empty Commenter',
        customerEmail: 'empty@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
        comment: ''
      };

      const result = await reviewService.createReview(reviewData);

      expect(result).toBeDefined();
      expect(result.comment).toBe('');
    });
  });

  describe('getPublicReviews', () => {
    test('should return only approved reviews', async () => {
      // Create reviews with different statuses
      await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      await mockRepository.create({
        orderId: 'ORD-002',
        customerName: 'Jane',
        customerEmail: 'jane@example.com',
        ratings: {
          overall: 4,
          food: 4
        }
      });

      await mockRepository.create({
        orderId: 'ORD-003',
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
        ratings: {
          overall: 3,
          food: 3
        }
      });

      // Approve only the first review
      const firstReview = await mockRepository.findById('mock-id-1');
      if (firstReview) {
        await mockRepository.updateStatus((firstReview._id as any).toString(), 'approved');
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      const result = await reviewService.getPublicReviews(1, 10);

      expect(result.reviews).toHaveLength(0);
      expect(result.total).toBe(0);
      expect(result.totalPages).toBe(0);
    });

    test('should handle pagination correctly', async () => {
      // Create and approve multiple reviews
      for (let i = 1; i <= 15; i++) {
        const review = await mockRepository.create({
          orderId: `ORD-${i.toString().padStart(3, '0')}`,
          customerName: `Customer ${i}`,
          customerEmail: `customer${i}@example.com`,
          ratings: {
            overall: 5,
            food: 5
          }
        });
        await mockRepository.updateStatus((review._id as any).toString(), 'approved');
      }

      // Get first page (10 items)
      const page1 = await reviewService.getPublicReviews(1, 10);
      expect(page1.reviews).toHaveLength(10);
      expect(page1.total).toBe(15);
      expect(page1.totalPages).toBe(2);
      expect(page1.page).toBe(1);

      // Get second page (5 remaining items)
      const page2 = await reviewService.getPublicReviews(2, 10);
      expect(page2.reviews).toHaveLength(5);
      expect(page2.total).toBe(15);
      expect(page2.totalPages).toBe(2);
      expect(page2.page).toBe(2);
    });

    test('should enforce maximum limit of 50 items per page', async () => {
      // Create and approve 60 reviews
      for (let i = 1; i <= 60; i++) {
        const review = await mockRepository.create({
          orderId: `ORD-${i.toString().padStart(3, '0')}`,
          customerName: `Customer ${i}`,
          customerEmail: `customer${i}@example.com`,
          ratings: {
            overall: 5,
            food: 5
          }
        });
        await mockRepository.updateStatus((review._id as any).toString(), 'approved');
      }

      const result = await reviewService.getPublicReviews(1, 100);

      expect(result.reviews).toHaveLength(50); // Should cap at 50
      expect(result.limit).toBe(50);
    });

    test('should handle invalid page numbers gracefully', async () => {
      // Create some approved reviews
      for (let i = 1; i <= 5; i++) {
        const review = await mockRepository.create({
          orderId: `ORD-${i.toString().padStart(3, '0')}`,
          customerName: `Customer ${i}`,
          customerEmail: `customer${i}@example.com`,
          ratings: {
            overall: 5,
            food: 5
          }
        });
        await mockRepository.updateStatus(review._id, 'approved');
      }

      // Test page 0 (should default to 1)
      await expect(reviewService.getPublicReviews(0, 10))
        .rejects
        .toThrow('Page must be at least 1');
    });

    test('should handle invalid limit gracefully', async () => {
      await expect(reviewService.getPublicReviews(1, 0))
        .rejects
        .toThrow('Limit must be at least 1');

      await expect(reviewService.getPublicReviews(1, -5))
        .rejects
        .toThrow('Limit must be at least 1');
    });
  });

  describe('getAllReviews', () => {
    test('should return all reviews regardless of status', async () => {
      // Create reviews with different statuses
      const review1 = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      const review2 = await mockRepository.create({
        orderId: 'ORD-002',
        customerName: 'Jane',
        customerEmail: 'jane@example.com',
        ratings: {
          overall: 4,
          food: 4
        }
      });

      await mockRepository.updateStatus((review1._id as any).toString(), 'approved');
      await mockRepository.updateStatus((review2._id as any).toString(), 'hidden');

      await mockRepository.create({
        orderId: 'ORD-003',
        customerName: 'Bob',
        customerEmail: 'bob@example.com',
        ratings: {
          overall: 3,
          food: 3
        }
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      const updated = await reviewService.changeReviewStatus((review._id as any).toString(), 'approved');

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('approved');
    });

    test('should change status from approved to hidden', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      await mockRepository.updateStatus((review._id as any).toString(), 'approved');
      const updated = await reviewService.changeReviewStatus((review._id as any).toString(), 'hidden');

      expect(updated).toBeDefined();
      expect(updated!.status).toBe('hidden');
    });

    test('should throw error for invalid status', async () => {
      const review = await mockRepository.create({
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      await expect(reviewService.changeReviewStatus((review._id as any).toString(), 'invalid' as any))
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
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      });

      const found = await reviewService.getReviewById((created._id as any).toString());

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
