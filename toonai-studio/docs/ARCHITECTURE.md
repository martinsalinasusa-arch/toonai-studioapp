# Architecture

Frontend/PWA and future Android app call the same backend REST API.

## Generation
1. Client requests generation.
2. API authenticates and validates.
3. Server creates project.
4. Server reserves credits transactionally.
5. Server creates a generation job.
6. BullMQ worker calls configured VideoProvider.
7. Worker polls provider asynchronously.
8. Production media pipeline downloads provider output, runs FFmpeg for subtitles/music/muxing, uploads to S3, and stores an object key.
9. Client receives job progress and a temporary signed URL.

## Provider interfaces
`VideoProvider`, `ImageToVideoProvider`, `TextProvider`, `VoiceProvider`, `StorageProvider`.

This prevents provider-specific code from leaking into the frontend or Android app.

## Security
- JWT access token
- bcrypt password hashing
- server-side credit ledger
- idempotent purchase tokens
- signed storage URLs
- file validation
- rate limiting should be enabled at the edge/API gateway before production
- secrets only in environment variables
