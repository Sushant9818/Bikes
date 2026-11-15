import { NextResponse } from 'next/server';

const spec = {
  openapi: '3.0.0',
  info: {
    title: 'Suzuki Bike E-Commerce API',
    description: 'Complete enterprise e-commerce platform',
    version: '1.0.0',
    contact: { name: 'Support', email: 'support@suzukibike.com' },
  },
  servers: [
    { url: process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000', description: 'API Server' },
  ],
  components: {
    securitySchemes: {
      bearerAuth: { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
    },
  },
  tags: [
    { name: 'Cart', description: 'Shopping cart operations' },
    { name: 'Orders', description: 'Order management' },
    { name: 'Wishlist', description: 'Wishlist operations' },
    { name: 'Loyalty', description: 'Loyalty points' },
    { name: 'Notifications', description: 'User notifications' },
    { name: 'Support', description: 'Customer support tickets' },
    { name: 'Admin', description: 'Admin operations' },
    { name: 'Referral', description: 'Referral system' },
  ],
  paths: {
    '/api/cart': {
      get: {
        summary: 'Get shopping cart',
        tags: ['Cart'],
        security: [{ bearerAuth: [] }],
        responses: {
          200: { description: 'Cart items' },
          401: { description: 'Unauthorized' },
        },
      },
    },
    '/api/orders': {
      get: {
        summary: 'Get user orders',
        tags: ['Orders'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Orders' } },
      },
    },
    '/api/wishlist': {
      get: {
        summary: 'Get wishlist',
        tags: ['Wishlist'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Wishlist items' } },
      },
    },
    '/api/loyalty': {
      get: {
        summary: 'Get loyalty account',
        tags: ['Loyalty'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Loyalty data' } },
      },
    },
    '/api/notifications': {
      get: {
        summary: 'Get notifications',
        tags: ['Notifications'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Notifications' } },
      },
    },
    '/api/support/tickets': {
      get: {
        summary: 'List support tickets',
        tags: ['Support'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Tickets' } },
      },
    },
    '/api/admin/inventory': {
      get: {
        summary: 'Get inventory',
        tags: ['Admin'],
        security: [{ bearerAuth: [] }],
        responses: { 200: { description: 'Inventory' } },
      },
    },
  },
};

export async function GET() {
  return NextResponse.json(spec);
}
