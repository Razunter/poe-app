<script lang="ts">
  import type { YouTubeItem } from '#lib/api/getYouTubeData.remote.ts'
  import { buildsData, getAllBuildAuthors } from '#lib/BuildsData.svelte.ts'
  import { checkBuildsForDuplicates } from '#lib/BuildsProcessing/checkBuildsForDuplicates.ts'
  import {
    getYouTubeVideoId,
    type IntakeChoice,
    newBuildDraft,
    replacementDraft,
    similarAuthors,
  } from '#lib/BuildsProcessing/youtubeIntake.ts'
  import BuildIntake from '#lib/components/BuildIntake.svelte'
  import { Button } from '#lib/components/ui/button/index.ts'
  import { Checkbox } from '#lib/components/ui/checkbox/index.ts'
  // noinspection ES6UnusedImports
  import * as Dialog from '#lib/components/ui/dialog/index.ts'
  // noinspection ES6UnusedImports
  import * as Field from '#lib/components/ui/field/index.ts'
  import { Input } from '#lib/components/ui/input/index.ts'
  import { type Build, BuildSchema } from '#lib/schema/Build.schema.ts'
  import backupRestore from '@iconify-icons/mdi/backup-restore'
  import contentSave from '@iconify-icons/mdi/content-save'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import Icon from '@iconify/svelte'
  import Svelecte from 'svelecte'
  import { tick, untrack } from 'svelte'

  type Original = { readonly url: string; readonly category: string; readonly build: Build }
  type Flow =
    | { stage: 'editor'; original?: Original; choice?: IntakeChoice }
    | { stage: 'intake'; url: string; video?: YouTubeItem }

  let {
    buildUrl = '',
    modalOpen = $bindable(false),
    buildType = $bindable(),
  }: {
    buildUrl?: string
    modalOpen?: boolean
    buildType?: string
  } = $props()

  const authorsArray: string[] = $derived.by(() => {
    const deriveAuthorsArray: string[] = [...getAllBuildAuthors().values()]
    return deriveAuthorsArray.toSorted((a, b) => a.localeCompare(b))
  })

  const buildTypesArray: Array<{ value: string; label: string }> = $derived.by(() => {
    const deriveBuildTypesArray: Array<{ value: string; label: string }> = []
    for (const typeKey in buildsData.types) {
      if (Object.hasOwn(buildsData.types, typeKey)) {
        deriveBuildTypesArray.push({ value: typeKey, label: buildsData.types[typeKey] })
      }
    }

    return deriveBuildTypesArray
  })

  const blankBuild = (): Build => ({
    title: '',
    url: '',
    versions: [buildsData.currentVersion],
    pin: false,
    skip: false,
  })

  const findOriginal = (url: string): Original | undefined => {
    for (const category of buildsData.buildList) {
      const original = category.builds.find((entry) => entry.url === url)
      if (original) {
        return { url, category: category.type, build: $state.snapshot(original) }
      }
    }

    return undefined
  }

  const httpUrl = (value: string): string | undefined => {
    try {
      const parsed = new URL(value)
      return parsed.protocol === 'https:' || parsed.protocol === 'http:' ? parsed.href : undefined
    } catch {
      return undefined
    }
  }

  const openingCategory = untrack(() => buildType)
  const openingUrl = untrack(() => buildUrl)
  const openingOriginal = openingUrl ? findOriginal(openingUrl) : undefined
  let flow: Flow = $state(
    openingUrl
      ? {
          stage: 'editor',
          original: openingOriginal ?? { url: openingUrl, category: openingCategory ?? '', build: blankBuild() },
        }
      : { stage: 'intake', url: '' },
  )
  let build: Build = $state(openingOriginal ? structuredClone(openingOriginal.build) : blankBuild())
  let draftCategory: string | undefined = $state(openingOriginal?.category ?? openingCategory)
  const authorOptions = $derived(
    build.author && !authorsArray.includes(build.author) ? [...authorsArray, build.author] : authorsArray,
  )

  const versionsArray: string[] = $derived([
    ...new Set([
      ...buildsData.versions.map((version) => version.version).toReversed(),
      ...(flow.stage === 'editor' ? (flow.original?.build.versions ?? []) : []),
      ...build.versions,
    ]),
  ])
  const authorSuggestions = $derived(
    build.author && !authorsArray.includes(build.author) ? similarAuthors(build.author, authorsArray) : [],
  )
  let form = $state<HTMLFormElement>()
  let invalidUrl = $state('')
  let saveError = $state('')

  const chooseIntake = async (choice: IntakeChoice) => {
    const original = choice.kind === 'replace' ? findOriginal(choice.originalUrl) : undefined
    if (choice.kind === 'replace' && !original) {
      saveError = 'The original build no longer exists. Choose another build.'
      return
    }

    build =
      choice.kind === 'replace' && original
        ? replacementDraft(original.build, choice.url, choice.video, buildsData.currentVersion)
        : choice.kind === 'new'
          ? newBuildDraft(choice.url, choice.video, buildsData.currentVersion)
          : { ...blankBuild(), url: choice.url, ...(getYouTubeVideoId(choice.url) ? { video: choice.url } : {}) }
    draftCategory = original?.category ?? openingCategory
    invalidUrl = ''
    saveError = ''
    flow = { stage: 'editor', original, choice }
    await tick()
    form?.querySelector<HTMLInputElement>('#editBuildTitle')?.focus()
  }

  const backToSuggestions = () => {
    if (flow.stage !== 'editor' || !flow.choice) {
      return
    }

    const choice = flow.choice
    flow = { stage: 'intake', url: choice.url, ...(choice.kind === 'manual' ? {} : { video: choice.video }) }
    invalidUrl = ''
    saveError = ''
  }

  const resetBuild = () => {
    if (flow.stage !== 'editor') {
      return
    }

    build = flow.original ? $state.snapshot(flow.original.build) : blankBuild()
    draftCategory = flow.original?.category ?? openingCategory
    invalidUrl = ''
    saveError = ''
  }

  const saveBuild = () => {
    if (flow.stage !== 'editor') {
      return false
    }

    const originalUrl = flow.original?.url
    const sourceCategory = originalUrl
      ? buildsData.buildList.find((entryCategory) => entryCategory.builds.some((entry) => entry.url === originalUrl))
      : undefined
    const sourceIndex = sourceCategory?.builds.findIndex((entry) => entry.url === originalUrl) ?? -1
    if (originalUrl && (!sourceCategory || sourceIndex < 0)) {
      saveError = 'The original build no longer exists. Close the editor and try again.'
      return false
    }

    const category = draftCategory?.trim()
    if (!category) {
      saveError = 'Choose or create a Type before saving.'
      return false
    }

    if (!build.title.trim() || !build.url.trim() || !build.versions?.length) {
      saveError = 'Enter a Title and URL, and select at least one compatible game version.'
      return false
    }

    const savedBuild = $state.snapshot(build)
    if (!savedBuild.author) {
      delete savedBuild.author
    }

    if (savedBuild.video === '') {
      delete savedBuild.video
      delete savedBuild.videothumb
    }

    const validation = BuildSchema.safeParse(savedBuild)
    if (!validation.success) {
      saveError = validation.error.issues.map((issue) => issue.message).join(' ')
      return false
    }

    const type = Object.hasOwn(buildsData.types, category) ? category : category.toLowerCase()
    let destination = buildsData.buildList.find((entry) => entry.type === type)
    if (!destination) {
      buildsData.types[type] = buildsData.types[type] ?? category
      const destinationIndex = buildsData.buildList.push({ type, builds: [] }) - 1
      destination = buildsData.buildList[destinationIndex]
    }

    if (sourceCategory === destination) {
      destination.builds[sourceIndex] = savedBuild
    } else {
      if (sourceCategory) {
        sourceCategory.builds.splice(sourceIndex, 1)
      }

      destination.builds.push(savedBuild)
    }

    return true
  }

  const formSubmit = async (event: SubmitEvent) => {
    event.preventDefault()
    saveError = ''

    if (!form?.reportValidity()) {
      return
    }

    invalidUrl = checkBuildsForDuplicates(
      buildsData.buildList,
      build.url,
      flow.stage === 'editor' ? flow.original?.url : undefined,
    )
    if (invalidUrl) {
      form?.querySelector<HTMLInputElement>('#editBuildURL')?.focus()
      return
    }

    if (saveBuild()) {
      modalOpen = false
    } else {
      await tick()
      form?.querySelector<HTMLElement>('[role="alert"]')?.focus()
    }
  }
</script>

{#if modalOpen}
  <Dialog.Root bind:open={modalOpen}>
    <Dialog.Content class="build-editor-modal sm:max-w-[800px] max-h-[90dvh]">
      <div class="build-editor">
        <Dialog.Header>
          <Dialog.Title>
            <Icon icon={pencilIcon} class="inline mr-2" />
            {flow.stage === 'intake'
              ? 'Add build'
              : flow.choice?.kind === 'replace'
                ? 'Review replacement'
                : 'Edit build'}
          </Dialog.Title>
        </Dialog.Header>
        {#if flow.stage === 'intake'}
          {#if saveError}<p role="alert" class="editor-intake-error">{saveError}</p>{/if}
          <BuildIntake initialUrl={flow.url} initialVideo={flow.video} onchoose={chooseIntake} />
        {:else}
          <form
            id="build-editor-form"
            bind:this={form}
            onsubmit={formSubmit}
            class="build-editor-form"
            aria-label="Build editor"
          >
            {#if saveError}
              <p role="alert" tabindex="-1">{saveError}</p>
            {/if}
            {#if flow.choice}
              <section
                class="editor-review"
                aria-label={flow.choice.kind === 'replace'
                  ? 'Replacement review'
                  : flow.choice.kind === 'new'
                    ? 'New build review'
                    : 'Manual entry review'}
              >
                <Button type="button" onclick={backToSuggestions}>Back to suggestions</Button>
                {#if flow.original}
                  <h3>Replacing {flow.original.build.title}</h3>
                  <p>
                    {flow.original.build.author ?? 'No author'} · {buildsData.types[flow.original.category] ??
                      flow.original.category}
                  </p>
                  <a href={httpUrl(flow.original.url)} target="_blank" rel="external noopener noreferrer"
                    >Original guide</a
                  >
                  <div class="editor-media-comparison">
                    <div>
                      <strong>Old video</strong>
                      {#if flow.original.build.video}
                        <a href={httpUrl(flow.original.build.video)} target="_blank" rel="external noopener noreferrer"
                          >{flow.original.build.video}</a
                        >
                      {:else}<p>No video</p>{/if}
                      {#if flow.original.build.videothumb?.['480w']}
                        <img src={flow.original.build.videothumb['480w']} alt="Original video thumbnail" />
                      {/if}
                    </div>
                    <div>
                      <strong>New video</strong>
                      {#if build.video}
                        <a href={httpUrl(build.video)} target="_blank" rel="external noopener noreferrer"
                          >{build.video}</a
                        >
                      {:else}<p>No video</p>{/if}
                      {#if build.videothumb?.['480w']}
                        <img src={build.videothumb['480w']} alt="Replacement video thumbnail" />
                      {/if}
                    </div>
                  </div>
                {/if}
              </section>
            {/if}
            <Field.Field class="field-title">
              <Field.Label for="editBuildTitle">Title</Field.Label>
              <div class="editor-title-row">
                <Input id="editBuildTitle" required bind:value={build.title} />
                <Button
                  type="button"
                  title="transform to lowercase"
                  class="px-3"
                  variant="default"
                  onclick={() => {
                    build.title = build.title.toLowerCase()
                  }}
                >
                  low
                </Button>
              </div>
            </Field.Field>
            <Field.Field class="field-type">
              <Field.Label for="editBuildType">Type</Field.Label>
              <Svelecte
                inputId="editBuildType"
                class="svelecte--dark"
                options={buildTypesArray}
                bind:value={
                  () => draftCategory ?? null, (category: null | string) => (draftCategory = category ?? undefined)
                }
                allowEditing
                creatable
                creatablePrefix=""
                keepCreated
                onCreateOption={(newOption: App.SvelecteOption) => {
                  draftCategory = newOption.value
                }}
              />
            </Field.Field>
            <Field.Field class="field-author">
              <Field.Label for="editBuildAuthor"
                >Author {#if build.author && !authorsArray.includes(build.author)}<span class="editor-new-author"
                    >New author</span
                  >{/if}</Field.Label
              >
              <Svelecte
                inputId="editBuildAuthor"
                class="svelecte--dark"
                options={authorOptions}
                bind:value={() => build.author ?? null, (author: null | string) => (build.author = author ?? undefined)}
                clearable
                allowEditing
                creatable
                creatablePrefix=""
                keepCreated
                onCreateOption={(newOption: App.SvelecteOption) => {
                  build.author = newOption.value
                }}
              />
              {#if authorSuggestions.length}
                <div class="editor-author-suggestions" aria-label="Similar saved authors">
                  <span>Similar saved authors</span>
                  {#each authorSuggestions as author (author)}
                    <Button
                      type="button"
                      size="sm"
                      onclick={() => {
                        build.author = author
                      }}>Use {author}</Button
                    >
                  {/each}
                </div>
              {/if}
            </Field.Field>
            <Field.Field class="field-video">
              <Field.Label for="editBuildVideoURL">Video URL</Field.Label>
              <Input
                id="editBuildVideoURL"
                bind:value={build.video}
                onpaste={(event) => {
                  const paste = event.clipboardData?.getData('text')
                  if (paste && !build.url) {
                    build.url = paste
                  }
                }}
              />
            </Field.Field>
            <Field.Field class="field-url">
              <Field.Label for="editBuildURL">URL</Field.Label>
              <Input
                id="editBuildURL"
                required
                bind:value={build.url}
                aria-invalid={Boolean(invalidUrl)}
                aria-describedby={invalidUrl ? 'editBuildURL-error' : undefined}
                oninput={() => {
                  invalidUrl = ''
                }}
                class={invalidUrl === '' ? '' : 'border-red-500'}
              />
              {#if invalidUrl}
                <p id="editBuildURL-error" role="alert" class="text-red-500 text-sm mt-1">
                  Duplicate URL: {invalidUrl}
                </p>
              {/if}
            </Field.Field>
            <Field.Field class="field-versions">
              <Field.Label for="editBuildVersions"
                >Compatible game versions <span class="editor-current">{buildsData.currentVersion} · current</span
                ></Field.Label
              >
              <Svelecte
                inputId="editBuildVersions"
                class="svelecte--dark"
                options={versionsArray}
                bind:value={build.versions}
                multiple
              />
              <div class="editor-version-badges" aria-label="Selected game versions">
                {#each build.versions as version (version)}
                  <span class="editor-version" class:editor-version-current={version === buildsData.currentVersion}
                    >{version}{version === buildsData.currentVersion ? ' · current' : ''}</span
                  >
                {/each}
              </div>
            </Field.Field>
            <Field.Field orientation="horizontal" class="field-pin">
              <Checkbox
                id="editBuildPin"
                bind:checked={() => build.pin ?? false, (checked) => (build.pin = checked)}
                class="size-4"
              />
              <Field.Label for="editBuildPin">Pin build</Field.Label>
            </Field.Field>
            <Field.Field orientation="horizontal" class="field-skip">
              <Checkbox
                id="editBuildSkip"
                bind:checked={() => build.skip ?? false, (checked) => (build.skip = checked)}
                class="size-4"
              />
              <Field.Label for="editBuildSkip">Skip build</Field.Label>
            </Field.Field>
          </form>
          <Dialog.Footer>
            <span class="editor-footnote">Disk save is separate</span>
            <Button type="button" variant="destructive" onclick={resetBuild}>
              <Icon icon={backupRestore} class="w-5 h-5" />
              <span>Reset</span>
            </Button>
            <Button type="submit" form="build-editor-form" variant="success">
              <Icon icon={contentSave} class="w-5 h-5" />
              <span>Save</span>
            </Button>
          </Dialog.Footer>
        {/if}
      </div>
    </Dialog.Content>
  </Dialog.Root>
{/if}
