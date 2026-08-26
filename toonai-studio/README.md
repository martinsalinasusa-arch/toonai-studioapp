# ToonAI Studio

Production-oriented full-stack MVP scaffold for an Indian AI animation/video platform.

## Stack
- Frontend: React + TypeScript + Vite + Tailwind-ready PWA
- Backend: Node.js + TypeScript + Fastify
- Database: PostgreSQL + Prisma
- Jobs: BullMQ + Redis
- Media: S3-compatible storage
- Processing: FFmpeg
- Android-ready REST API and Google Play Billing verification architecture

## Important
This project intentionally does **not** fake AI generation or payments. If an AI provider is not configured, generation fails with a clear configuration error. Payment endpoints are server-side verification architecture and must be connected to your Google Play service credentials before production.

## Quick start
1. Copy `.env.example` to `.env` and fill secrets.
2. Start PostgreSQL and Redis.
3. `cd backend && npm install`
4. `npx prisma generate && npx prisma migrate dev`
5. `npm run dev`
6. `cd ../frontend && npm install && npm run dev`
7. `cd ../admin && npm install && npm run dev`

For production, run the backend API and BullMQ worker separately, put HTTPS in front, configure S3, an AI provider, email/OTP provider, Google OAuth, Google Play service account, rewarded ads server verification, and FFmpeg.
