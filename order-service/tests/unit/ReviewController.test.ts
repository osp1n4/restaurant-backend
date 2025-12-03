import { Request, Response } from 'express';
import { ReviewController } from '../../src/controllers/ReviewController';
import { ReviewService } from '../../src/services/ReviewService';
import { CreateReviewDTO } from '../../src/repositories/ReviewRepository';
import { IReview } from '../../src/models/Review';

type ReviewStatus = 'pending' | 'approved' | 'hidden';

// Mock ReviewService
jest.mock('../../src/services/ReviewService');

describe('ReviewController - Unit Tests', () => {
  let controller: ReviewController;
  let mockService: jest.Mocked<ReviewService>;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockJson: jest.Mock;
  let mockStatus: jest.Mock;

  beforeEach(() => {
    // Create mock service
    mockService = new ReviewService(null as any) as jest.Mocked<ReviewService>;

    // Create controller with mocked service
    controller = new ReviewController(mockService);

    // Setup mock response
    mockJson = jest.fn();
    mockStatus = jest.fn().mockReturnValue({ json: mockJson });
    mockResponse = {
      status: mockStatus,
      json: mockJson,
    };

    // Setup mock request
    mockRequest = {
      body: {},
      params: {},
      query: {},
    };
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('createReview', () => {
    test('should create review and return 201 status', async () => {
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

      const createdReview: IReview = {
        _id: 'mock-id-123',
        ...reviewData,
        status: 'pending' as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IReview;

      mockRequest.body = reviewData;
      mockService.createReview = jest.fn().mockResolvedValue(createdReview);

      await controller.createReview(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.createReview).toHaveBeenCalledWith(reviewData);
      expect(mockStatus).toHaveBeenCalledWith(201);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Review created successfully',
        review: createdReview,
      });
    });

    test('should return 400 for validation errors', async () => {
      mockRequest.body = {
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 6, // Invalid
          food: 5
        }
      };

      const validationError = new Error('Overall rating must be between 1 and 5');
      mockService.createReview = jest.fn().mockRejectedValue(validationError);

      await controller.createReview(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Overall rating must be between 1 and 5',
      });
    });

    test('should return 409 for duplicate review', async () => {
      mockRequest.body = {
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      };

      const duplicateError = new Error('Review already exists for this order');
      mockService.createReview = jest.fn().mockRejectedValue(duplicateError);

      await controller.createReview(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(409);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Review already exists for this order',
      });
    });

    test('should return 500 for unexpected errors', async () => {
      mockRequest.body = {
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        }
      };

      const unexpectedError = new Error('Database connection failed');
      mockService.createReview = jest.fn().mockRejectedValue(unexpectedError);

      await controller.createReview(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to create review',
      });
    });

    test('should handle missing required fields', async () => {
      mockRequest.body = {
        orderId: 'ORD-001',
        // Missing customerName and ratings
      };

      const error = new Error('Customer name is required');
      mockService.createReview = jest.fn().mockRejectedValue(error);

      await controller.createReview(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Customer name is required',
      });
    });
  });

  describe('getPublicReviews', () => {
    test('should return approved reviews with pagination', async () => {
      const mockReviews = [
        {
          _id: '1',
          orderId: 'ORD-001',
          customerName: 'John',
          customerEmail: 'john@example.com',
          ratings: {
            overall: 5,
            food: 5
          },
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          _id: '2',
          orderId: 'ORD-002',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          ratings: {
            overall: 4,
            food: 5
          },
          status: 'approved',
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ] as IReview[];

      const mockResponseData = {
        reviews: mockReviews,
        total: 2,
        page: 1,
        limit: 10,
        hasMore: false,
      };

      mockRequest.query = { page: '1', limit: '10' };
      mockService.getPublicReviews = jest.fn().mockResolvedValue(mockResponseData);

      await controller.getPublicReviews(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getPublicReviews).toHaveBeenCalledWith(1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResponseData);
    });

    test('should use default pagination values when not provided', async () => {
      mockRequest.query = {};

      const mockResponseData = {
        reviews: [],
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false,
      };

      mockService.getPublicReviews = jest.fn().mockResolvedValue(mockResponseData);

      await controller.getPublicReviews(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getPublicReviews).toHaveBeenCalledWith(1, 10);
      expect(mockStatus).toHaveBeenCalledWith(200);
    });

    test('should return 500 on service error', async () => {
      mockRequest.query = { page: '1', limit: '10' };
      mockService.getPublicReviews = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await controller.getPublicReviews(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to fetch reviews',
      });
    });

    test('should handle invalid pagination parameters', async () => {
      mockRequest.query = { page: 'invalid', limit: 'notanumber' };

      const mockResponseData = {
        reviews: [],
        total: 0,
        page: 1,
        limit: 10,
        hasMore: false,
      };

      mockService.getPublicReviews = jest.fn().mockResolvedValue(mockResponseData);

      await controller.getPublicReviews(
        mockRequest as Request,
        mockResponse as Response
      );

      // Should default to page 1, limit 10 when parsing fails
      expect(mockService.getPublicReviews).toHaveBeenCalled();
      expect(mockStatus).toHaveBeenCalledWith(200);
    });
  });

  describe('getReviewById', () => {
    test('should return review when found', async () => {
      const mockReview: IReview = {
        _id: 'review-123',
        orderId: 'ORD-001',
        customerName: 'John Doe',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
        status: 'approved' as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IReview;

      mockRequest.params = { id: 'review-123' };
      mockService.getReviewById = jest.fn().mockResolvedValue(mockReview);

      await controller.getReviewById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getReviewById).toHaveBeenCalledWith('review-123');
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockReview);
    });

    test('should return 404 when review not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockService.getReviewById = jest.fn().mockResolvedValue(null);

      await controller.getReviewById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Review not found',
      });
    });

    test('should return 500 on service error', async () => {
      mockRequest.params = { id: 'review-123' };
      mockService.getReviewById = jest.fn().mockRejectedValue(
        new Error('Database error')
      );

      await controller.getReviewById(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to fetch review',
      });
    });
  });

  describe('getAllReviews', () => {
    test('should return all reviews for admin', async () => {
      const mockReviews = [
        {
          _id: '1',
          orderId: 'ORD-001',
          customerName: 'John',
          customerEmail: 'john@example.com',
          ratings: {
            overall: 5,
            food: 5
          },
          status: 'approved',
        },
        {
          _id: '2',
          orderId: 'ORD-002',
          customerName: 'Jane',
          customerEmail: 'jane@example.com',
          ratings: {
            overall: 4,
            food: 4
          },
          status: 'pending',
        },
        {
          _id: '3',
          orderId: 'ORD-003',
          customerName: 'Bob',
          customerEmail: 'bob@example.com',
          ratings: {
            overall: 3,
            food: 3
          },
          status: 'hidden',
        },
      ] as IReview[];

      const mockResponseData = {
        reviews: mockReviews,
        total: 3,
        page: 1,
        limit: 50,
        hasMore: false,
      };

      mockRequest.query = { page: '1', limit: '50' };
      mockService.getAllReviews = jest.fn().mockResolvedValue(mockResponseData);

      await controller.getAllReviews(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getAllReviews).toHaveBeenCalledWith(1, 50);
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith(mockResponseData);
    });

    test('should use default pagination for admin', async () => {
      mockRequest.query = {};

      const mockResponseData = {
        reviews: [],
        total: 0,
        page: 1,
        limit: 50,
        hasMore: false,
      };

      mockService.getAllReviews = jest.fn().mockResolvedValue(mockResponseData);

      await controller.getAllReviews(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.getAllReviews).toHaveBeenCalledWith(1, 50);
    });
  });

  describe('changeReviewStatus', () => {
    test('should change status to approved', async () => {
      const updatedReview: IReview = {
        _id: 'review-123',
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
        status: 'approved' as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IReview;

      mockRequest.params = { id: 'review-123' };
      mockRequest.body = { status: 'approved' };
      mockService.changeReviewStatus = jest.fn().mockResolvedValue(updatedReview);

      await controller.changeReviewStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockService.changeReviewStatus).toHaveBeenCalledWith(
        'review-123',
        'approved'
      );
      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Review status updated successfully',
        review: updatedReview,
      });
    });

    test('should change status to hidden', async () => {
      const updatedReview: IReview = {
        _id: 'review-123',
        orderId: 'ORD-001',
        customerName: 'John',
        customerEmail: 'john@example.com',
        ratings: {
          overall: 5,
          food: 5
        },
        status: 'hidden' as ReviewStatus,
        createdAt: new Date(),
        updatedAt: new Date(),
      } as IReview;

      mockRequest.params = { id: 'review-123' };
      mockRequest.body = { status: 'hidden' };
      mockService.changeReviewStatus = jest.fn().mockResolvedValue(updatedReview);

      await controller.changeReviewStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(200);
      expect(mockJson).toHaveBeenCalledWith({
        message: 'Review status updated successfully',
        review: updatedReview,
      });
    });

    test('should return 400 for invalid status', async () => {
      mockRequest.params = { id: 'review-123' };
      mockRequest.body = { status: 'invalid-status' };

      mockService.changeReviewStatus = jest.fn().mockRejectedValue(
        new Error('Invalid status')
      );

      await controller.changeReviewStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Invalid status',
      });
    });

    test('should return 404 when review not found', async () => {
      mockRequest.params = { id: 'non-existent' };
      mockRequest.body = { status: 'approved' };

      mockService.changeReviewStatus = jest.fn().mockRejectedValue(
        new Error('Review not found')
      );

      await controller.changeReviewStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(404);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Review not found',
      });
    });

    test('should return 500 on unexpected error', async () => {
      mockRequest.params = { id: 'review-123' };
      mockRequest.body = { status: 'approved' };

      mockService.changeReviewStatus = jest.fn().mockRejectedValue(
        new Error('Database connection lost')
      );

      await controller.changeReviewStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(500);
      expect(mockJson).toHaveBeenCalledWith({
        error: 'Failed to update review status',
      });
    });

    test('should handle missing status in request body', async () => {
      mockRequest.params = { id: 'review-123' };
      mockRequest.body = {}; // Missing status

      mockService.changeReviewStatus = jest.fn().mockRejectedValue(
        new Error('Status is required')
      );

      await controller.changeReviewStatus(
        mockRequest as Request,
        mockResponse as Response
      );

      expect(mockStatus).toHaveBeenCalledWith(400);
    });
  });
});
