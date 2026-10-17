# ForceAim website

The site is a dependency-free static website. Vercel builds it to `dist/` and serves those files directly; the local Node.js server is only for local development.

## Run locally

Use Node.js 24.x, then run:

```sh
npm start
```

Open `http://127.0.0.1:4173`. Set `PORT` to use another local port. Set `SITE_DIR=dist` to preview the built output instead of the source files.

To create the same static output used by Vercel, run `npm run build`. The generated site is in `dist/`.

## Configure before launch

Edit `config.js`:

- `bookingUrl`: the real strategy-call scheduler URL. Leave empty until configured; booking buttons will explain that setup is needed.
- `contactEmail`: a public business email address. Leave empty to omit the email link.
- `interestListProvider`: reserved for a mailing-list integration. The current interest form stores an entered address only in that visitor's local browser and does not send it anywhere.

The lead magnet and insight cards are clearly described as previews. Replace those sections when the resource and published content are ready. Review and complete the legal-page drafts with the business's actual details before launch.
