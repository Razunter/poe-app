<script lang="ts">
  import { buildsData, getAllBuildAuthors } from '#lib/BuildsData.svelte.ts'
  import { checkBuildsForDuplicates } from '#lib/BuildsProcessing/checkBuildsForDuplicates.ts'
  import { Button } from '#lib/components/ui/button/index.ts'
  import { Checkbox } from '#lib/components/ui/checkbox/index.ts'
  // noinspection ES6UnusedImports
  import * as Dialog from '#lib/components/ui/dialog/index.ts'
  // noinspection ES6UnusedImports
  import * as Field from '#lib/components/ui/field/index.ts'
  import { Input } from '#lib/components/ui/input/index.ts'
  import type { Build } from '#lib/schema/Build.schema.ts'
  import backupRestore from '@iconify-icons/mdi/backup-restore'
  import contentSave from '@iconify-icons/mdi/content-save'
  import pencilIcon from '@iconify-icons/mdi/pencil'
  import Icon from '@iconify/svelte'
  import Svelecte from 'svelecte'

  // Unique build url for editing
  let {
    buildUrl = '',
    modalOpen = $bindable(false),
    buildType = $bindable(buildsData.types[0]),
  }: {
    buildUrl?: string
    modalOpen?: boolean
    buildType?: string
  } = $props()

  const authorsArray: string[] = $derived.by(() => {
    const deriveAuthorsArray: string[] = [...getAllBuildAuthors().values()]
    return deriveAuthorsArray.toSorted((a, b) => a.localeCompare(b))
  })

  const versionsArray: string[] = $derived(buildsData.versions.map((version) => version.version).toReversed())

  const buildTypesArray: Array<{ value: string; label: string }> = $derived.by(() => {
    const deriveBuildTypesArray: Array<{ value: string; label: string }> = []
    for (const typeKey in buildsData.types) {
      if (Object.hasOwn(buildsData.types, typeKey)) {
        deriveBuildTypesArray.push({ value: typeKey, label: buildsData.types[typeKey] })
      }
    }

    return deriveBuildTypesArray
  })

  const initBuild = (): Build => {
    if (buildUrl) {
      for (const buildCategory of buildsData.buildList) {
        const existingBuild = buildCategory.builds.find((build_) => {
          return build_.url === buildUrl
        })

        if (existingBuild) {
          buildType = buildCategory.type
          return structuredClone($state.snapshot(existingBuild))
        }
      }
    }

    return { title: '', url: '', versions: [buildsData.currentVersion], pin: false, skip: false }
  }

  let build: Build = $state(initBuild())

  let form = $state<HTMLFormElement>()
  let invalidUrl = $state('')
  let saveError = $state('')

  const saveBuild = () => {
    const sourceCategory = buildUrl
      ? buildsData.buildList.find((category) => category.builds.some((entry) => entry.url === buildUrl))
      : undefined
    const sourceIndex = sourceCategory?.builds.findIndex((entry) => entry.url === buildUrl) ?? -1
    if (buildUrl && (!sourceCategory || sourceIndex < 0)) {
      saveError = 'The original build no longer exists. Close the editor and try again.'
      return false
    }

    const savedBuild = $state.snapshot(build)
    if (savedBuild.video === '') {
      delete savedBuild.video
      delete savedBuild.videothumb
    }

    let destination = buildsData.buildList.find((category) => category.type === buildType)
    if (!destination) {
      const type = buildType.toLowerCase()
      buildsData.types[type] = buildType
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

  const formSubmit = (event: MouseEvent | SubmitEvent) => {
    event.preventDefault()

    if (!form?.reportValidity()) {
      return
    }

    invalidUrl = checkBuildsForDuplicates(buildsData.buildList, build.url, buildUrl)
    if (invalidUrl) {
      return
    }

    if (saveBuild()) {
      modalOpen = false
    }
  }
</script>

{#if modalOpen}
  <Dialog.Root bind:open={modalOpen}>
    <Dialog.Content class="sm:max-w-[800px] h-full max-h-[90dvh]">
      <Dialog.Header>
        <Dialog.Title>
          <Icon icon={pencilIcon} class="inline mr-2" />
          Edit build
        </Dialog.Title>
      </Dialog.Header>
      <form bind:this={form} onsubmit={formSubmit} class="overflow-y-auto flex flex-col gap-4">
        {#if saveError}
          <p role="alert" class="text-red-500">{saveError}</p>
        {/if}
        <Field.Field>
          <Field.Label for="editBuildType">Type</Field.Label>
          <Svelecte
            inputId="editBuildType"
            class="svelecte--dark"
            options={buildTypesArray}
            bind:value={buildType}
            allowEditing
            creatable
            creatablePrefix=""
            keepCreated
            onCreateOption={(newOption: App.SvelecteOption) => {
              buildType = newOption.value
            }}
          />
        </Field.Field>
        <Field.Field>
          <Field.Label for="editBuildTitle">Title</Field.Label>
          <div class="flex gap-4">
            <Input id="editBuildTitle" required bind:value={build.title} />
            <Button
              title="transform to lowercase"
              class="px-3 py-2 bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-r"
              onclick={() => {
                build.title = build.title.toLowerCase()
              }}
            >
              low
            </Button>
          </div>
        </Field.Field>
        <Field.Field>
          <Field.Label for="editBuildAuthor">Author</Field.Label>
          <Svelecte
            inputId="editBuildAuthor"
            class="svelecte--dark"
            options={authorsArray}
            bind:value={build.author}
            clearable
            allowEditing
            creatable
            creatablePrefix=""
            keepCreated
            onCreateOption={(newOption: App.SvelecteOption) => {
              build.author = newOption.value
            }}
          />
        </Field.Field>
        <Field.Field>
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
        <Field.Field>
          <Field.Label for="editBuildURL">URL</Field.Label>
          <Input id="editBuildURL" required bind:value={build.url} class={invalidUrl === '' ? '' : 'border-red-500'} />
          {#if invalidUrl}
            <p class="text-red-500 text-sm mt-1">Duplicate URL: {invalidUrl}</p>
          {/if}
        </Field.Field>
        <Field.Field>
          <Field.Label for="editBuildVersions">Compatible game versions</Field.Label>
          <Svelecte
            inputId="editBuildVersions"
            class="svelecte--dark"
            options={versionsArray}
            bind:value={build.versions}
            multiple
          />
        </Field.Field>
        <Field.Field orientation="horizontal">
          <Checkbox bind:checked={() => build.pin ?? false, (checked) => (build.pin = checked)} class="size-4" />
          <Field.Label>Pin build</Field.Label>
        </Field.Field>
        <Field.Field orientation="horizontal">
          <Checkbox bind:checked={() => build.skip ?? false, (checked) => (build.skip = checked)} class="size-4" />
          <Field.Label>Skip build</Field.Label>
        </Field.Field>
      </form>
      <Dialog.Footer class="border-t border-gray-600 pt-6">
        <Button
          type="reset"
          variant="destructive"
          onclick={() => {
            build = initBuild()
          }}
        >
          <Icon icon={backupRestore} class="w-5 h-5" />
          <span>Reset</span>
        </Button>
        <Button type="submit" onclick={formSubmit}>
          <Icon icon={contentSave} class="w-5 h-5" />
          <span>Save</span>
        </Button>
      </Dialog.Footer>
    </Dialog.Content>
  </Dialog.Root>
{/if}
