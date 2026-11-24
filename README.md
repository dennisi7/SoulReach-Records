# SoulReach Records

Next.js application for ROSA UHAS evangelism records, with a public form and an approved-admin dashboard.

The scoped `jwks-rsa` override pins `jose` to its CommonJS-compatible release. Firebase Admin 14 otherwise fails to load in Vercel's runtime when native require-of-ESM support is disabled.

## Firebase setup

Use Firebase project `soulreach-records` with Standard edition Firestore in `europe-west1`. The database is eligible for the free allowance. Email/password authentication is enabled.

Copy `.env.example` to `.env.local`. Set `FIREBASE_SERVICE_ACCOUNT_PATH` to a local service-account JSON file, `FIREBASE_API_KEY` to the registered web app's API key, and `SUBMISSION_HASH_SECRET` to a random secret. On Vercel, set the full credential JSON in the server-only sensitive variable `FIREBASE_SERVICE_ACCOUNT_JSON` instead of a local path.

Run `npm ci`, then `npm run dev`. The public form is at `/`, admin sign-in at `/admin/sign-in`, and records at `/admin`.

Deploy `firebase.json`, `firestore.rules`, and `firestore.indexes.json` with the Firebase CLI. Browser access to Firestore is denied. The server checks Firebase session cookies and the `approved_admins/{uid}` document, which must contain `enabled: true`, before returning or modifying private records. Admin creation and approval require the project owner's access.

## Submission protection

The server validates fields and consent, then atomically reserves one of five submission attempts per client in ten minutes. Vercel's trusted client IP is stored only as a keyed hash. Other hosts can set `SUBMISSION_CLIENT_IP_HEADER` when their proxy overwrites it with a single client IP. Otherwise submissions use a shared quota. Each hash reuses one quota document, bounding storage without paid automatic expiration. Sign-in has a separate ten-attempt window.

Admin changes require a same-origin request and an approved session. Follow-up changes respect the explicit No Contact preference. Historical free-text area values and removed fields remain in migrated storage.

## Migrating existing data

The private export is held in the ignored `credentials/supabase-migration.json` file. It contains records and the existing approved account's bcrypt password hash. Keep this file private as a recovery backup.

Run `node --env-file=.env.local scripts/migrate-to-firebase.cjs` to import it. Original record IDs are preserved. Re-running the script skips existing Firebase records and verifies that all source IDs are present. Approved users retain their IDs and bcrypt hashes, allowing their existing passwords to continue working.

## Verification

Run `npm test` and `npx tsc --noEmit`. PostgreSQL tests remain as checks of the legacy migration source. The Firebase migration was also checked using a temporary account and synthetic record through the local HTTP routes, including submission, approved access, editing, follow-up, deletion, cross-origin rejection, and blocked direct database access.

Before promoting a deployment, confirm admin sign-in, verify the migrated records, submit a synthetic encounter, export it, and remove that exact synthetic record. Credentials and migration backups are excluded from both Git and deployment source.
