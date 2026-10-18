# ForceAim platform setup

The public homepage at `/` and the legal pages remain the existing static site. The agency workspace is served at `/admin`; each invited client's workspace is at `/portal`. Netlify serves the static site and routes API/workspace requests to the `forceaim-api` Netlify Function. Both use the same Netlify deployment, Supabase Auth project, PostgreSQL database, and private Storage bucket.

## Architecture and implementation status

- Supabase Auth handles password sign-in, refreshable sessions, invitation acceptance, password reset, and sign-out.
- Server API routes validate the session and role. PostgreSQL RLS policies scope client rows and files to the authenticated client. Administrator-only notes and encrypted Instagram tokens are not available to client roles.
- The migration creates onboarding, references and assignments, video projects and versions, feedback, calendar entries, performance records, notifications, and activity history.
- Raw and edited videos use private Storage and short-lived upload/download URLs. Upload progress is shown while the browser sends the file. A failed upload can be retried by selecting the file again; resumable uploads are not implemented.
- Reference drafts can be created, edited, assigned, published/unpublished, duplicated, and deleted after assignments are removed. Clients can review assigned references.
- Clients can save onboarding steps and submit a final review. Administrators can invite clients, manage client workspaces, upload edits, view feedback, change statuses, schedule entries, add manual metrics, and view private notes.
- Instagram Login uses Meta's current Instagram Login authorization scope `instagram_business_basic`. The implementation requests basic account identity only. It does not request or claim Instagram insights, publishing, messaging, or comment access. Meta documents the current Instagram Login flow and scope in its [Instagram API collection](https://www.postman.com/meta/instagram/folder/6raa77c/instagram-api-with-instagram-login).
- Metric entry is manual and labeled as manual. Automatic Instagram analytics and Instagram publishing are not implemented. Calendar `Scheduled` and `Published` are workflow labels set by an administrator; they do not trigger Instagram actions.
- Notification emails are not implemented. In-app notifications are stored in the database. Supabase Auth invitation/reset emails use the email provider configured in the Supabase dashboard.

## Environment variables

Copy `.env.example` to `.env` for local development and add the same values under Netlify Project configuration → Environment variables. Keep `.env` out of Git; `.gitignore` excludes it.

Required for login, database access, and local workspace routes:

```text
SUPABASE_URL
SUPABASE_ANON_KEY
SUPABASE_SERVICE_ROLE_KEY
APP_URL
```

The service role key is server-only. Do not put it in `config.js`, HTML, or any client-side variable. It supports admin invitations, private upload URL creation, status updates, and onboarding status updates.

Instagram Login also requires:

```text
META_APP_ID
META_APP_SECRET
META_REDIRECT_URI=https://forceaim.online/api/meta/callback
INSTAGRAM_TOKEN_ENCRYPTION_KEY
```

Generate a 32-byte encryption key, encoded as Base64, with Node.js:

```sh
node -e "console.log(require('node:crypto').randomBytes(32).toString('base64'))"
```

Use a different randomly generated key per environment. Losing it prevents decrypting stored Instagram tokens; rotating it requires re-encrypting tokens or asking clients to reconnect.

`MAX_VIDEO_SIZE_MB` defaults to `500`. Supabase project-wide Storage limits can be lower than this setting; set both limits consistently.

## Supabase setup

1. Create a Supabase project and copy its project URL, anon/publishable key, and service-role key to server environment variables.
2. Apply [`supabase/migrations/202610170001_platform.sql`](supabase/migrations/202610170001_platform.sql) with the Supabase SQL editor or Supabase CLI. It enables RLS and creates the private `client-videos` bucket and file policies.
3. In Supabase Storage settings, allow video uploads up to the value you configure for `MAX_VIDEO_SIZE_MB` (subject to your plan's maximum).
4. In Authentication → URL Configuration, set the site URL to `https://forceaim.online` and add redirect URLs for `https://forceaim.online/invite`, `https://forceaim.online/reset`, and your local invite/reset routes (for example `http://localhost:4173/invite` and `/reset`).
5. Configure SMTP in Supabase Auth before inviting clients or sending reset links. The platform does not send email itself.

The `instagram_tokens` table has RLS enabled with no authenticated-user policies and explicit grants only for `service_role`. The encrypted token is never selected by the browser-facing API.

## Create the first administrator

There is no public registration and no client-facing way to grant an admin role. First create your own user in Supabase Authentication → Users. Then run this SQL in the Supabase SQL editor, replacing the email and name with your own:

```sql
insert into public.profiles (id, role, client_id, full_name, email)
select id, 'admin', null, 'Your Name', email
from auth.users
where lower(email) = lower('you@example.com')
on conflict (id) do update
set role = 'admin', client_id = null, full_name = excluded.full_name, email = excluded.email;
```

Sign in at `https://forceaim.online/login`; admins are sent to `/admin`.

## Invite the first client

1. Open `/admin/clients` and choose **Invite client**.
2. Enter the client's name, email, and business name. The application creates the client workspace and sends a Supabase Auth invitation.
3. The client follows the email link, sets a password at `/invite`, then signs in to `/portal`.

If the invitation fails, verify the Supabase SMTP setup, Auth redirect allow list, and `SUPABASE_SERVICE_ROLE_KEY` in the deployment environment.

## Assign a reference and review a video

1. At `/admin/references`, create a reference. Add an uploaded MP4/MOV or an external Instagram/YouTube URL, then choose a client and select **Assign / publish**.
2. The client opens **My References** at `/portal/references`, reviews the instructions, and uses **Record and upload**. Uploads are private, client-scoped objects.
3. At `/admin/videos`, preview/download the raw footage, add private notes, change its status, and upload an edited MP4. Uploading an edit creates a new version and moves the project to **Ready for Review**.
4. The client previews the edit in **My Videos** and either approves it or submits revision notes. The status, feedback, and timestamp are saved. Earlier versions remain stored.

## Schedule and report metrics

- Use `/admin/calendar` to create and reschedule a content entry. Client users can see only their own entries in `/portal/calendar`.
- Use `/admin/performance` to enter a dated manual report. Records are historical and client-scoped. Clients can view and export their results at `/portal/results`.
- Counts that were not reported remain null; growth percentages are only shown when a nonzero baseline is present. Figures are not inferred from Instagram unless an authorized, supported Meta endpoint is later configured.

## Meta Developer App setup

1. Create a Meta Developer app and add **Instagram API with Instagram Login**. Configure `https://forceaim.online/api/meta/callback` as an allowed OAuth redirect URI in the Instagram Login settings.
2. Add the app ID and app secret to Netlify environment variables as `META_APP_ID` and `META_APP_SECRET`. Set `META_REDIRECT_URI` to the exact same callback URL and set `INSTAGRAM_TOKEN_ENCRYPTION_KEY`.
3. Request only `instagram_business_basic` for the currently implemented profile identity. Use a professional Instagram account (Creator or Business) for the Instagram Login flow.
4. During development, add test accounts/roles as required by the Meta app dashboard. Before allowing unrelated clients to authorize the production app, complete the current Meta app review/Advanced Access requirements applicable to the app and permission.

The authorization code is exchanged server-side, state is random, single-use, and expires after ten minutes, the returned long-lived token is encrypted with AES-256-GCM, and only the authenticated client's connection record is updated. Reconnect or manually use **Refresh token** only after Meta credentials and encryption are configured. API access and account eligibility still depend on Meta's current app mode, permissions, review, and account requirements. No Meta flow can be verified until the Developer App is configured.

## Netlify deployment

Keep the existing Netlify site connected to this GitHub repository. Use the repository root as the Netlify base directory. [`netlify.toml`](netlify.toml) sets `npm run build`, publishes `dist`, registers `netlify/functions`, and rewrites `/api/*`, `/admin/*`, `/portal/*`, `/login`, `/invite`, and `/reset` to the API function. `vercel.json` is retained for history/other environments and is not used by Netlify.

Set the environment variables listed above in Netlify's site environment settings for the required deploy contexts, apply the database migration, and deploy the existing branch. Do not upload `.env`; set secrets through Netlify's environment settings. Netlify Functions have a bounded buffered request/response size, so the app obtains signed Storage URLs and the browser transfers video bytes directly to Supabase instead of sending videos through the function.

## Local development and verification limits

```sh
npm install
npm start
npm run build
```

The local server uses port `4173` by default; set `PORT` to another port if it is occupied. Workspace routes return a setup error until Supabase environment variables are provided. This checkout has no configured Supabase project, Meta credentials, SMTP account, or two test client accounts. The static production build and rendered-route/function-adapter checks can run here, but actual sign-in, invitations, RLS isolation, Storage uploads, email delivery, and Meta consent/token exchange must be verified after connecting those services.
