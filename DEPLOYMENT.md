# Suzuki Bike E-Commerce Deployment Guide

## Prerequisites
- GitHub account (for code hosting)
- Vercel account (for hosting)
- PostgreSQL database (Supabase recommended)
- Clerk account (already configured)

## Environment Variables

### Required for Production

```env
# Database
DATABASE_URL=postgresql://user:password@host:port/dbname

# Authentication
CLERK_SECRET_KEY=your_clerk_secret_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_publishable_key
NEXT_PUBLIC_CLERK_SIGN_IN_URL=/sign-in
NEXT_PUBLIC_CLERK_SIGN_UP_URL=/sign-up

# eSewa Payment
ESEWA_MERCHANT_CODE=your_merchant_code
ESEWA_SECRET_KEY=your_secret_key
NEXT_PUBLIC_ESEWA_URL=https://esewa.com.np/api/payment

# Email Service
EMAIL_SERVICE=gmail
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_app_password

# API
NEXT_PUBLIC_API_URL=https://yourdomain.com
```

## Deployment Steps

### 1. Push to GitHub
```bash
git remote add origin https://github.com/username/suzuki-bike.git
git branch -M main
git push -u origin main
```

### 2. Deploy to Vercel
1. Go to vercel.com
2. Import project from GitHub
3. Select repository
4. Configure environment variables
5. Deploy

### 3. Database Setup
1. Create PostgreSQL database on Supabase
2. Update DATABASE_URL
3. Run migrations:
   ```bash
   npx prisma migrate deploy
   ```

### 4. Post-Deployment
- Verify Clerk auth working
- Test eSewa payment (test mode first)
- Test email notifications
- Verify webhooks deliver

## Verification Checklist

- [ ] Site loads at domain
- [ ] Clerk sign-in/up works
- [ ] Database connected
- [ ] Cart functions
- [ ] Payment gateway responds
- [ ] Admin panel accessible
- [ ] API docs at /api-docs
- [ ] Webhooks configured
- [ ] Email sending works

## Performance Optimization

Already configured:
- Image optimization (Next.js)
- Code splitting
- Dark mode support
- Responsive design

## Security Checks

- [ ] HTTPS enabled
- [ ] Secrets not in code
- [ ] Environment variables set
- [ ] CORS configured
- [ ] SQL injection protected (Prisma)
- [ ] XSS protection enabled
- [ ] 2FA available

## Monitoring

Set up monitoring for:
- Error tracking (Sentry optional)
- Analytics (built-in)
- Database performance
- API health

## Rollback Plan

Keep previous deployments:
- Vercel auto-keeps 10 deployments
- Can revert instantly from dashboard

## Support

For issues:
1. Check logs in Vercel dashboard
2. Check database connection
3. Verify environment variables
4. Review Clerk settings
