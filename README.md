# Resumate

Resumate is an AI-assisted resume workspace. Authenticated users can turn free-form career notes into an editable resume, tailor a saved resume to a job, draft a factual cover letter, save independent document versions, and download selectable-text PDFs.

## Stack

- React + Vite + JavaScript + Tailwind CSS
- Node.js + Express API
- Supabase Auth and PostgreSQL

## Project structure

```
src/                 React application
  components/        Shared UI and route guards
  context/           Auth/session state
  lib/               Supabase browser client
  pages/             Landing, auth, dashboard, resume, and application routes
server/src/          Express API and middleware
supabase/schema.sql  Optional Phase 1 profile schema and RLS policies
```

## Local installation

1. Install Node.js 20.19+ (or 22.12+).
2. Copy `.env.example` to `.env.local` and enter your Supabase project URL and **publishable key**.
3. Install and run:

```bash
npm install
npm run dev
```

The web app runs at `http://localhost:5173`; the API health check is `http://localhost:3001/api/health`.

To build the frontend for production:

```bash
npm run build
```

Run the API alone with `npm start` (ensure `CLIENT_ORIGIN` is set for its deployed frontend).

## Environment variables

Set browser-safe values when building the frontend, and server values only in the API host. Never commit a populated environment file.

```bash
SUPABASE_URL=https://your-project-ref.supabase.co
SUPABASE_PUBLISHABLE_KEY=your-publishable-key
GEMINI_MODEL=gemini-2.5-flash
```

`GEMINI_API_KEY` must be set on the backend host and must not have a `VITE_` prefix. The service refuses to generate content when it is unavailable; it never fabricates a resume.

## Supabase setup

1. Create a Supabase project.
2. In **Connect**, copy the Project URL and publishable key into `.env.local` as `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
3. In **Authentication → Providers → Email**, enable email/password sign-in. Configure SMTP if required by your project.
4. In **Authentication → URL Configuration**, add `http://localhost:5173/login` and the deployed frontend's `/login` URL as redirect URLs.
5. Run [`supabase/schema.sql`](supabase/schema.sql) in the Supabase SQL Editor before using persistence. It creates the `profiles`, `resumes`, and `applications` tables with owner-only RLS policies.

### Security and RLS requirements

- The browser receives only a Supabase Project URL and publishable (or legacy anon) key. These are intentionally public identifiers; they are not administrator credentials.
- Never put `SUPABASE_SERVICE_ROLE_KEY` in a `VITE_*` variable or any frontend file. A service-role key bypasses RLS and belongs only in a protected server runtime when a future server-only operation requires it.
- Enable RLS on every table in `public` or another exposed schema. The included `profiles` SQL enables it and creates owner-only select/insert/update policies using `auth.uid()`.
- Limit table grants to the operations the app needs. `schema.sql` revokes all access from `anon` and grants only select/insert/update to `authenticated`.
- Future resume, job, and document tables must include an owning `user_id` and use both `USING ((select auth.uid()) = user_id)` and `WITH CHECK ((select auth.uid()) = user_id)` for update policies. Add a select policy whenever an update policy exists.
- Do not use editable `user_metadata` to authorize database access. Prefer ownership columns or trusted app metadata.

## API and deployment

`GET /api/health` returns the API health and timestamp. The API uses an allowlisted `CLIENT_ORIGIN`, JSON body limits, disabled `X-Powered-By`, consistent JSON 404s, and centralized error handling. Expand the allowed methods/origins deliberately as future API routes are added.

All protected endpoints require `Authorization: Bearer <Supabase access token>`. The server verifies the token with Supabase before processing it and creates a per-request Supabase client with that same token, so RLS—not a client-supplied user ID—governs reads and writes.

Deploy the frontend and Express API as separate services (or configure a single host with a proxy). In the frontend host, set `VITE_SUPABASE_URL`, `VITE_SUPABASE_PUBLISHABLE_KEY`, and `VITE_API_URL` at build time. In the API host, set `SUPABASE_URL`, `SUPABASE_PUBLISHABLE_KEY`, `GEMINI_API_KEY`, `GEMINI_MODEL`, `CLIENT_ORIGIN`, `PORT`, and `NODE_ENV=production`. Set `CLIENT_ORIGIN` to the exact deployed frontend origin; do not use a wildcard.

## Resume workflow

1. Open **Resume builder** from the dashboard and paste free-form career information.
2. Generate an editable, fact-preserving structured resume.
3. Save it to Supabase, reopen it after a refresh, or download a selectable-text PDF.
4. In **Applications**, choose a saved resume and job details, then generate a tailored resume and/or cover letter independently. Each application is saved separately from its source resume.

The AI prompt treats pasted information as data rather than instructions and explicitly prohibits invented claims. Empty fields stay empty; ambiguous material and rewritten suggestions are surfaced for confirmation.

## Current boundaries

The application accepts pasted career and job information. It does not implement resume uploads, OCR, or job-URL extraction.
