# Deployment checklist

- PostgreSQL with backups
- Redis
- API HTTPS
- separate BullMQ worker
- S3-compatible private bucket
- CDN/temporary signed URLs
- FFmpeg installed in worker image
- AI provider credentials
- Google OAuth credentials
- OTP provider
- Google Play service account
- rate limiting/WAF
- error monitoring
- privacy/terms URLs
- data deletion workflow
- moderation provider/rules
- rewarded-ad server verification
- Play Console product/subscription configuration

Never mark a payment completed from the frontend alone.
