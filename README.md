# ForceAim website and client platform

The existing public website is built as static files in `dist/`. The agency workspace and client portal run through the Netlify Function in `netlify/functions/forceaim-api.mjs`; Supabase provides authentication, PostgreSQL, and private video storage.

## Local development

Use Node.js 24.x, then run:

```sh
npm install
npm start
```

Open `http://127.0.0.1:4173`. Set `PORT` to use another local port. To build the static site, run `npm run build`; the output is in `dist/`.

## Netlify deployment

Keep the repository root as the Netlify base directory. `netlify.toml` configures the build command, `dist` publish directory, function directory, and rewrites to the API function. Configure the Supabase and optional Meta variables from `.env.example` in Netlify's environment-variable settings with function runtime access enabled. Never commit a populated `.env` file or expose the Supabase service-role key to browser code.

Apply `supabase/migrations/202610170001_platform.sql` to the Supabase project before using the private workspace. See [`PLATFORM.md`](PLATFORM.md) for setup, first-admin instructions, client workflow, and integrations that still need external credentials.

## Website content configuration

Edit `config.js`:

- `bookingUrl`: the strategy-call scheduler URL.
- `contactEmail`: the public business email address.
- `interestListProvider`: reserved for a mailing-list integration. The current interest form stores an entered address only in that visitor's local browser and does not send it anywhere.

The lead magnet and insight cards remain previews until real resources are available. Review and complete the legal-page drafts with the business's actual details before launch.
