# Foto's website

The landing page for Foto, the Mac menu-bar app that turns screenshots into actions, live at https://www.foto-ai.store. It is a static page built with Vite and TypeScript, with no framework. Vercel builds and serves it from `main` on the custom domain (`foto-ai.store` redirects to `www`), and GitHub Pages publishes the same build at https://sohmeh.github.io/foto-site/ (`.github/workflows/pages.yml`).

## Run it

```bash
npm ci
npm run dev
```

The page is then at http://127.0.0.1:5310. `npm run build` type-checks and builds to `dist/`.

## What's where

- `index.html` holds the page and all of its copy.
- `src/demo/` holds the interactive parts. `desk.ts` is the pretend desktop in the hero, where dragging across something works like ⌘⇧4. `card.ts` rebuilds Foto's top-right helper card from the app's own markup and wording. `checks.ts` is the calendar checks demo, `reads.ts` the sample screenshots, and `menubar.ts` the menu bar with Foto's own menu.
- `src/styles/tokens.css` and `src/styles/app.css` are copied from the app's `src/styles.css`, so the site and the app share one visual language. `src/styles/site.css` is the page around them. Its muted gray is one step darker than the app's, so small text clears WCAG AA.
- `public/shots/` holds real screenshots of the app. They were taken from its development mock with invented data (`?mock=1&scene=showcase`).
- `public/og.png` is the social preview, drawn by `scripts/og.html` with the dev server running.
- `public/download/` holds the disk image and its SHA-256.
- `src/config.ts` holds the waitlist link, the releases link, and the download's version and size.

Every person, business and address on the page is invented, and email addresses use the reserved `.example` domain.

## Publishing a new version of Foto

In the app's repository, run `npm run pack && sh scripts/release-mac.sh`. Copy `release/Foto-<version>-arm64.dmg` into `public/download/` and write its checksum next to it. Then update `src/config.ts` and the download link in `index.html`. GitHub refuses files over 100 MB; the 0.1.0 image is 85 MB.

## The waitlist

Paste the form's link into `waitlistUrl` in `src/config.ts`. Until it is set, the waitlist section says the list opens soon and links to this repository instead.
