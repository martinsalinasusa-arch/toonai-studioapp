# Android readiness

Use Kotlin + Jetpack Compose as a separate client of the same API.

Recommended:
- HTTPS only
- Android Keystore for token protection
- no AI keys in APK
- Google Play Billing Library for purchases/subscriptions
- send purchase token to `/payments/google-play/verify`
- backend verifies with Google Play Developer API before granting credits
- support pending/completed/cancelled/refunded and restore purchases
- use WorkManager for resilient upload/status refresh
- request only necessary permissions
- provide account deletion from app and web
- signed AAB for Play release
