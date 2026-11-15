export const swaggerSpec = {
  openapi: '3.0.0',
  info: {
    title: 'Suzuki Bike E-Commerce API',
    description: 'Complete e-commerce platform API documentation',
    version: '1.0.0',
    contact: {
      name: 'Suzuki Bike Support',
      email: 'support@suzukibike.com',
    },
  },
  servers: [
    {
      url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000',
      description: 'API Server',
    },
  ],
  components: {
    securitySchemes: {
      bearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
      },
    },
  },
  paths: {
    '/api/cart': {
      get: {
        summary: 'Get user cart',
        tags: ['Cart'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Cart retrieved successfully' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add item to cart',
        tags: ['Cart'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  partId: { type: 'number' },
                  quantity: { type: 'number' },
                  price: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Item added to cart' },
          400: { description: 'Invalid input' },
        },
      },
    },
    '/api/orders': {
      get: {
        summary: 'Get user orders',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Orders retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/wishlist': {
      get: {
        summary: 'Get user wishlist',
        tags: ['Wishlist'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Wishlist retrieved' },
          401: { description: 'Unauthorized' },
        },
      },
      post: {
        summary: 'Add to wishlist',
        tags: ['Wishlist'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  partId: { type: 'number' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Added to wishlist' },
        },
      },
    },
    '/api/loyalty': {
      get: {
        summary: 'Get loyalty account',
        tags: ['Loyalty'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Loyalty account retrieved' },
        },
      },
    },
    '/api/notifications': {
      get: {
        summary: 'Get user notifications',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        parameters: [
          {
            name: 'unread',
            in: 'query',
            schema: { type: 'boolean' },
          },
        ],
        responses: {
          200: { description: 'Notifications retrieved' },
        },
      },
    },
    '/api/support/tickets': {
      get: {
        summary: 'List support tickets',
        tags: ['Support'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Tickets retrieved' },
        },
      },
      post: {
        summary: 'Create support ticket',
        tags: ['Support'],
        security: [{ bearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  title: { type: 'string' },
                  description: { type: 'string' },
                  category: { type: 'string' },
                  priority: { type: 'string' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Ticket created' },
        },
      },
    },
    '/api/admin/inventory': {
      get: {
        summary: 'Get inventory (Admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Inventory retrieved' },
          403: { description: 'Forbidden' },
        },
      },
    },
    '/api/admin/analytics': {
      get: {
        summary: 'Get analytics (Admin)',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Analytics retrieved' },
        },
      },
    },
    '/api/referrals': {
      get: {
        summary: 'Get referral data',
        tags: ['Referral'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Referral data retrieved' },
        },
      },
      post: {
        summary: 'Create referral code',
        tags: ['Referral'],
        security: [{ bearerAuth: [] }],
        responses: {
          201: { description: 'Referral code created' },
        },
      },
    },
  },
};
