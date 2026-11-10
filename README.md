# Path of Exile Starters Collection Editor

A local editor for the JSON behind
[Razunter's Path of Exile Starters Collection](https://raz-poebuilds.netlify.app/).

Edit and organize starter-build entries in a browser instead of editing JSON by
hand. This editor saves local collection files; it does not publish the website.

Personal tool shared as-is, with no stability or support commitments.
[MIT licensed](LICENSE).

Built with SvelteKit and TypeScript for a 3440×1440 desktop; no responsive layout.

## Try it locally

Requires [Bun](https://bun.sh/) and [Node.js](https://nodejs.org/) 24.11 or newer.
Commands use a POSIX shell.

From the repository root, install dependencies and copy the sample collection
into a new `data` directory:

```sh
bun install
cp .env.example .env
cp -R tests/fixtures data
```

In `.env`, set `JSON_PATH=./data`. Keep
`PUBLIC_ORIGIN=http://localhost:5173` for this example.
The YouTube key can stay blank for manual editing.

```sh
bun run dev
```

Open http://localhost:5173/. You should see **Melee → Fixture starter**.
Edit its title and save the dialog, then click **Save** in the sidebar to write
the files. Reload to confirm the title was saved.

Dialog **Save** changes the loaded collection; sidebar **Save** writes to disk.

## Use your collection

Point `JSON_PATH` at your collection directory. It needs `versions.json` and
versioned build data: for `currentVersion` **3.26**, the build file is
`data-3-26.json`.

The sample [versions](tests/fixtures/versions.json) and
[build data](tests/fixtures/data-3-26.json) show the expected format, validated by
the [version schema](src/lib/schema/GameVersion.schema.ts) and
[collection schema](src/lib/schema/BuildsData.schema.ts).

Sidebar **Save** overwrites `versions.json` and the current version's build
file in that directory.

After changing `JSON_PATH`, `YOUTUBE_API_KEY`, or `PUBLIC_ORIGIN`, restart the
development server or rebuild production output.

## Optional syncing

**Sync builds** checks game-version tags for Path of Exile forum and Maxroll
links and fetches missing YouTube thumbnails.

- For YouTube thumbnails, set `YOUTUBE_API_KEY` to a
  [YouTube Data API v3 key](https://developers.google.com/youtube/v3/getting-started).
- **Sync builds** launches Puppeteer's Chrome. If Chrome is missing, run
  `bunx puppeteer browsers install`. On Linux it needs a working
  [Chrome sandbox](https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox).
