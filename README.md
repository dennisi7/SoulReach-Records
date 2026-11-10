# Evangelism Records

Next.js app for recording evangelism encounters and managing them through an approved-admin dashboard.

## Local setup

1. Use a dedicated Supabase project for Evangelism Records. Keep the Data API enabled.
2. Copy `.env.example` to `.env.local` and set the project URL, publishable key, and server-only service role key. Enter the service role key directly in the local file or hosting environment settings.
3. Apply the SQL files in `supabase/migrations/` in filename order. If the initial migration has already run, apply only the new migration.
4. Create the first email/password user in Supabase Auth and copy its user ID. Run the following in the project's SQL editor with the actual ID.

   ```sql
   insert into public.approved_admins (user_id)
   values ('REPLACE_WITH_AUTH_USER_UUID')
   on conflict (user_id) do nothing;
   ```

5. Disable public sign-ups in Supabase Auth if all accounts will be provisioned by the project owner. Run `npm ci` and `npm run dev`.

The public form is at `/`, the sign-in screen is at `/admin/sign-in`, and the records dashboard is at `/admin`. The development dashboard uses fictional records when Supabase is unconfigured. In production, the dashboard requires configuration and approval. Public submissions require the server credential and both migrations.

The database shares a quota of five validated submission attempts per client in each ten-minute window. Vercel uses its platform-supplied client IP header. On other hosts, set `SUBMISSION_CLIENT_IP_HEADER` only when a trusted proxy overwrites that header with a single IP and prevents direct access to the app. Otherwise requests share a single fallback quota. The quota stores keyed hashes and expires old buckets as requests arrive.

## Deployment checklist

- Add `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`, and `SUPABASE_SERVICE_ROLE_KEY` as deployment environment variables. The service role key must stay server-only.
- Apply both migrations before opening the public form.
- Create the first Supabase Auth user, then add its UUID to `approved_admins`.
- Submit a fictional record and confirm it appears in the admin list. Open its details, edit it, verify follow-up behavior including **No Contact**, export it, and delete it.
- Verify that signed-out visitors and signed-in users absent from `approved_admins` cannot read or change records through either the app or the Supabase Data API.
- Replace the draft privacy and consent copy in the form with the ministry-approved wording. See `outputs/design.md` for the design and draft.

Run `npm test` for isolated PostgreSQL checks of database permissions and submission quotas. The tests simulate Supabase Auth identities. The hosted checks above exercise actual Supabase sessions and API requests.
