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

## Add or replace a build from YouTube

Set `YOUTUBE_API_KEY` to a
[YouTube Data API v3 key](https://developers.google.com/youtube/v3/getting-started)
to load video details.

1. Click **Add build** in a category and paste the new YouTube URL.
2. Click **Find candidates**. Review the suggestions, or search all saved builds
   by title, author, or guide URL.
3. Choose **Review replacement** for an existing build, or **Add as new**.
4. Review the full editor and click **Save** to apply the draft.
5. Click **Save** in the sidebar when you want to write the collection to disk.

Replacement keeps curated fields and historical version tags, adds the current
version once, and updates the video and thumbnail. A separate written guide URL
stays unchanged. Suggestions never replace a build or merge author names automatically.
For a **New author**, select a similar saved name or keep the new spelling.

**Manual entry** skips lookup and keeps the pasted URL. Direct **Edit** still
opens the full editor. **Reset** restores the saved original for a replacement
or ordinary blank defaults for a new build. Closing the dialog discards the draft.

## Use your collection

Point `JSON_PATH` at your collection directory. It needs `versions.json` and
versioned build data: for `currentVersion` **3.26**, the build file is
`data-3-26.json`.

The sample [versions](tests/fixtures/versions.json) and
[build data](tests/fixtures/data-3-26.json) show the expected format, validated by
the [version schema](src/lib/schema/GameVersion.schema.ts) and
[collection schema](src/lib/schema/BuildsData.schema.ts).

Sidebar **Save** writes `versions.json` and the current version's build file.
Saves run one at a time. Staged files and `.collection-save.json` preserve the
previous contents until both replacements finish. After a failed or interrupted
save, the next load or save restores the previous pair before proceeding.
If restoration fails, keep the recovery files named in the error.

Loading preserves historical build version tags. If the current build file is
missing, the editor searches configured releases newest-first without changing
the current version. An existing corrupt file reports an error instead of falling
back. The next explicit **Save** creates the current version's build file.

Version numbers use two or three dotted components, such as `3.26` and `3.26.1`.
The major component has one digit; the minor and patch components have one or two.

Recovery covers one local server process and process interruption. It does not
protect against independent external writers or arbitrary hardware failure.

After changing `JSON_PATH`, `YOUTUBE_API_KEY`, or `PUBLIC_ORIGIN`, restart the
development server or rebuild production output.

## Optional syncing

**Sync builds** checks game-version tags for Path of Exile forum and Maxroll
links and fetches missing YouTube thumbnails.

Only one sync runs at a time. The action stays disabled until browser shutdown
finishes. Edits, additions, deletions, and category moves made during sync survive.
Fetched fields apply only when their source values are unchanged.

Supported YouTube watch URLs can include query parameters before or after `v`.
An unsupported lookup leaves the stored video and thumbnail unchanged. Removing a
video, manually or after a confirmed not-found result, keeps the collection
save-valid.

- For YouTube thumbnails, set `YOUTUBE_API_KEY` to a
  [YouTube Data API v3 key](https://developers.google.com/youtube/v3/getting-started).
- **Sync builds** launches Puppeteer's Chrome. If Chrome is missing, run
  `bunx puppeteer browsers install`. On Linux it needs a working
  [Chrome sandbox](https://pptr.dev/troubleshooting#setting-up-chrome-linux-sandbox).
