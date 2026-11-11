<script lang="ts">
  import { getYouTubeData, type YouTubeItem } from '#lib/api/getYouTubeData.remote.ts'
  import { buildsData } from '#lib/BuildsData.svelte.ts'
  import {
    type BuildCandidate,
    getYouTubeVideoId,
    type IntakeChoice,
    searchBuilds,
    suggestBuilds,
  } from '#lib/BuildsProcessing/youtubeIntake.ts'
  import { Button } from '#lib/components/ui/button/index.js'
  import * as Field from '#lib/components/ui/field/index.js'
  import { Input } from '#lib/components/ui/input/index.js'
  import { onDestroy, onMount, tick, untrack } from 'svelte'

  let {
    initialUrl = '',
    initialVideo,
    onchoose,
  }: {
    initialUrl?: string
    initialVideo?: YouTubeItem
    onchoose: (choice: IntakeChoice) => void
  } = $props()

  type LookupState =
    | { kind: 'failure'; reason: 'not-found' | 'request' }
    | { kind: 'idle' }
    | { kind: 'invalid' }
    | { kind: 'loading' }
    | { kind: 'ready'; url: string; video: YouTubeItem }

  const id = $props.id()
  let url = $state(untrack(() => initialUrl))
  let lookup = $state.raw<LookupState>(
    untrack(() =>
      getYouTubeVideoId(initialUrl) === initialVideo?.id
        ? { kind: 'ready', url: initialUrl.trim(), video: initialVideo }
        : { kind: 'idle' },
    ),
  )
  let query = $state('')
  let urlInput = $state<HTMLInputElement | null>(null)
  let previewHeading = $state<HTMLHeadingElement>()
  let generation = 0
  let mounted = false

  const httpUrl = (value: string): string | undefined => {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined
    } catch {
      return undefined
    }
  }
  const candidates = $derived(lookup.kind === 'ready' ? suggestBuilds(buildsData.buildList, lookup.video) : [])
  const searchResults = $derived(searchBuilds(buildsData.buildList, query))
  const thumbnail = $derived(
    lookup.kind === 'ready'
      ? Object.values(lookup.video.snippet.thumbnails).find((image) => image !== undefined && httpUrl(image.url))
      : undefined,
  )
  const status = $derived(
    lookup.kind === 'loading'
      ? 'Loading video details…'
      : lookup.kind === 'ready'
        ? `Video loaded. ${candidates.length} suggested builds.`
        : '',
  )

  const changeUrl = (value: string) => {
    generation += 1
    url = value
    lookup = { kind: 'idle' }
  }

  const findCandidates = async (event: SubmitEvent) => {
    event.preventDefault()
    const request = ++generation
    const requestedUrl = url.trim()
    const videoId = getYouTubeVideoId(requestedUrl)
    if (!videoId) {
      lookup = { kind: 'invalid' }
      urlInput?.focus()
      return
    }

    lookup = { kind: 'loading' }
    try {
      const response = await getYouTubeData(videoId)
      if (!mounted || request !== generation) {
        return
      }

      const video = response.items.find((item) => item.id === videoId)
      if (!video) {
        lookup = { kind: 'failure', reason: 'not-found' }
        return
      }

      lookup = { kind: 'ready', url: requestedUrl, video }
      await tick()
      if (mounted && request === generation) {
        previewHeading?.focus()
      }
    } catch {
      if (mounted && request === generation) {
        lookup = { kind: 'failure', reason: 'request' }
      }
    }
  }

  const choose = (originalUrl?: string) => {
    if (lookup.kind !== 'ready') {
      return
    }

    const { url: selectedUrl, video } = lookup
    generation += 1
    onchoose(
      originalUrl === undefined
        ? { kind: 'new', url: selectedUrl, video }
        : { kind: 'replace', url: selectedUrl, video, originalUrl },
    )
  }

  const manualEntry = () => {
    generation += 1
    lookup = { kind: 'idle' }
    onchoose({ kind: 'manual', url: url.trim() })
  }

  onMount(() => {
    mounted = true
    const focusUrl = async () => {
      await tick()
      if (mounted) {
        urlInput?.focus()
      }
    }

    void focusUrl()
  })

  onDestroy(() => {
    mounted = false
    generation += 1
  })
</script>

<div class="build-intake">
  <form aria-label="YouTube build intake" onsubmit={findCandidates} novalidate>
    <Field.Field>
      <Field.Label for={`${id}-url`}>New YouTube URL</Field.Label>
      <div class="lookup-controls">
        <Input
          id={`${id}-url`}
          name="youtube-url"
          type="url"
          value={url}
          bind:ref={urlInput}
          oninput={(event) => changeUrl(event.currentTarget.value)}
          aria-invalid={lookup.kind === 'invalid'}
          aria-describedby={`${id}-url-help ${id}-lookup-error`}
          autocomplete="off"
          autocapitalize="none"
          spellcheck={false}
          placeholder="https://www.youtube.com/watch?v=…"
          required
        />
        <Button type="submit">Find candidates</Button>
      </div>
      <p id={`${id}-url-help`} class="help">
        Paste a YouTube watch, short, or share link. Review a draft before changing your collection.
      </p>
    </Field.Field>
  </form>

  <div id={`${id}-lookup-error`} class="error" role="alert">
    {#if lookup.kind === 'invalid'}
      Enter a valid HTTP(S) YouTube video URL, or continue with Manual entry.
    {:else if lookup.kind === 'failure'}
      {#if lookup.reason === 'not-found'}
        Video not found. Check that the video is available and the URL is correct, then try Find candidates again or use
        Manual entry.
      {:else}
        Could not load video details. Try Find candidates again, correct the URL, or use Manual entry.
      {/if}
    {/if}
  </div>
  <p class="lookup-status" class:sr-only={!status} role="status" aria-live="polite" aria-atomic="true">{status}</p>

  {#if lookup.kind === 'ready'}
    <section class="video-preview" aria-labelledby={`${id}-video-title`}>
      {#if thumbnail}
        <img src={httpUrl(thumbnail.url)} alt="" width="160" height="90" />
      {/if}
      <div>
        <p class="eyebrow">New video</p>
        <h3 id={`${id}-video-title`} bind:this={previewHeading} tabindex="-1">{lookup.video.snippet.title}</h3>
        <p class="muted">{lookup.video.snippet.channelTitle}</p>
        <a href={httpUrl(lookup.url)} target="_blank" rel="external noopener noreferrer">
          Open new video<span class="sr-only"> in a new tab</span>
        </a>
      </div>
    </section>

    <section aria-labelledby={`${id}-suggestions`}>
      <h3 id={`${id}-suggestions`}>Suggested builds</h3>
      <p class="help">Suggestions are clues, not confirmed matches. Choose a saved build to review its replacement.</p>
      {#if candidates.length}
        <div class="candidate-list">
          {#each candidates as candidate (JSON.stringify([candidate.category, candidate.build.url]))}
            {@render candidateRow(candidate)}
          {/each}
        </div>
      {:else}
        <p class="empty">No suggestions found. Search all saved builds below or add this video as a new build.</p>
      {/if}
    </section>
  {/if}

  <search aria-labelledby={`${id}-search-label`}>
    <Field.Field>
      <Field.Label id={`${id}-search-label`} for={`${id}-search`}>Search all saved builds</Field.Label>
      <Input
        id={`${id}-search`}
        name="saved-build-search"
        type="search"
        bind:value={query}
        aria-describedby={`${id}-search-help`}
        placeholder="Title, author, or guide URL"
        autocomplete="off"
        spellcheck={false}
      />
      <p id={`${id}-search-help`} class="help">
        Search the whole collection, including builds outside suggestions.
        {#if lookup.kind !== 'ready'}Load a video to enable replacement review.{/if}
      </p>
    </Field.Field>
    {#if query.trim()}
      <p class="help" role="status">{searchResults.length} saved builds found.</p>
      {#if searchResults.length}
        <div class="candidate-list">
          {#each searchResults as candidate (JSON.stringify([candidate.category, candidate.build.url]))}
            {@render candidateRow(candidate)}
          {/each}
        </div>
      {:else}
        <p class="empty">No saved builds match your search. Try another title, author, or guide URL.</p>
      {/if}
    {/if}
  </search>

  <div class="intake-actions">
    {#if lookup.kind === 'ready'}
      <Button type="button" variant="success" onclick={() => choose()}>Add as new</Button>
    {/if}
    <Button type="button" onclick={manualEntry}>Manual entry</Button>
    <p class="help">Nothing changes until you save the full editor. Saving to disk remains separate.</p>
  </div>
</div>

{#snippet candidateRow(candidate: BuildCandidate)}
  {@const guideUrl = httpUrl(candidate.build.url)}
  <article class="candidate-row">
    <div class="candidate-details">
      <h4>{candidate.build.title}</h4>
      <p class="muted">
        {candidate.build.author ?? 'No saved author'} · {buildsData.types[candidate.category] ?? candidate.category}
      </p>
      <div class="versions" aria-label="Compatible game versions">
        {#each candidate.build.versions as version, index (`${version}-${index}`)}
          <span class="version">{version}</span>
        {/each}
      </div>
      {#if guideUrl}
        <a href={guideUrl} target="_blank" rel="external noopener noreferrer">
          {candidate.build.url}<span class="sr-only"> (opens in a new tab)</span>
        </a>
      {:else}
        <p class="muted">Guide link unavailable</p>
      {/if}
      <p class="reason">{candidate.reason}</p>
    </div>
    <Button
      type="button"
      disabled={lookup.kind !== 'ready'}
      aria-describedby={lookup.kind === 'ready' ? undefined : `${id}-search-help`}
      onclick={() => choose(candidate.build.url)}>Review replacement</Button
    >
  </article>
{/snippet}

<style>
  .build-intake {
    display: flex;
    flex-direction: column;
    gap: 16px;
    min-width: 0;
    min-height: 0;
    overflow-y: auto;
    overscroll-behavior: contain;
    scrollbar-color: #66758d #0c1525;
    padding: 16px 20px;
    color: #f4f6fa;
    font-size: 14px;
    line-height: 1.5;
  }
  .build-intake :global([data-slot='field']) {
    gap: 8px;
  }
  .build-intake :global([data-slot='field-label']) {
    font-size: 12px;
    font-weight: 600;
  }
  .lookup-controls {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  .lookup-controls :global(input) {
    flex: 1;
  }
  .build-intake :global([data-slot='input']) {
    height: 38px;
    padding: 8px 10px;
    border: 1px solid #66758d;
    border-radius: 6px;
    background: #0c1525;
    color: #f4f6fa;
    font-size: 14px;
    box-shadow: none;
  }
  .build-intake :global([data-slot='input'])::placeholder {
    color: #b4bfd0;
    opacity: 1;
  }
  .build-intake :global([data-slot='input'][aria-invalid='true']) {
    border-color: #f3bdc4;
  }
  .build-intake :global([data-slot='input']):focus-visible,
  a:focus-visible,
  h3:focus-visible {
    outline: 2px solid #c4d9f8;
    outline-offset: 3px;
  }
  h3,
  h4,
  p {
    margin: 0;
  }
  h3 {
    font-size: 16px;
    font-weight: 600;
  }
  h4 {
    font-size: 14px;
    font-weight: 600;
  }
  a {
    color: #c4d9f8;
    text-decoration: underline;
    overflow-wrap: anywhere;
  }
  .help,
  .muted,
  .reason {
    color: #b4bfd0;
  }
  .help,
  .eyebrow,
  .reason {
    font-size: 12px;
  }
  .error {
    color: #f3bdc4;
  }
  .error:empty {
    display: none;
  }
  .video-preview {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px;
    background: #0c1525;
    border: 1px solid #3b4b63;
    border-radius: 6px;
  }
  .video-preview img {
    flex: none;
    object-fit: cover;
    border-radius: 4px;
  }
  .video-preview > div {
    min-width: 0;
  }
  .video-preview h3 {
    margin-block: 4px;
    overflow-wrap: anywhere;
  }
  .eyebrow {
    color: #b4bfd0;
  }
  .candidate-list {
    display: flex;
    flex-direction: column;
    margin-top: 12px;
    border: 1px solid #3b4b63;
    border-radius: 6px;
  }
  .candidate-row {
    display: flex;
    align-items: center;
    gap: 16px;
    padding: 12px;
  }
  .candidate-row + .candidate-row {
    border-top: 1px solid #3b4b63;
  }
  .candidate-details {
    flex: 1;
    min-width: 0;
  }
  .candidate-details h4 {
    overflow-wrap: anywhere;
  }
  .versions {
    display: flex;
    flex-wrap: wrap;
    gap: 4px;
    margin-block: 8px;
  }
  .version {
    border: 1px solid #66758d;
    border-radius: 4px;
    padding: 1px 6px;
    font-size: 11px;
  }
  .reason {
    margin-top: 8px;
  }
  .empty {
    padding-block: 12px;
    color: #b4bfd0;
  }
  .intake-actions {
    display: flex;
    flex-wrap: wrap;
    align-items: center;
    gap: 8px;
    padding-top: 16px;
    border-top: 1px solid #3b4b63;
  }
  .intake-actions p {
    flex-basis: 100%;
  }
  @media (max-width: 580px) {
    .build-intake {
      padding: 14px;
    }
    .lookup-controls,
    .candidate-row {
      align-items: stretch;
      flex-direction: column;
    }
    .video-preview {
      flex-direction: column;
    }
  }
</style>
