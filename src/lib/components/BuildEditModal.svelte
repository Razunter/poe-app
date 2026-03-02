<script lang="ts">
  import { buildsData, getAllBuildAuthors } from '$lib/BuildsData.svelte.ts'
  import { checkBuildsForDuplicates } from '$lib/BuildsProcessing/checkBuildsForDuplicates.ts'
  import { Button } from '$lib/components/ui/button'
  import { Checkbox } from '$lib/components/ui/checkbox'
  // noinspection ES6UnusedImports
  import * as Dialog from '$lib/components/ui/dialog/index.ts'
  // noinspection ES6UnusedImports
  import * as Field from '$lib/components/ui/field/index.ts'
  import { Input } from '$lib/components/ui/input/index.ts'
  import type { Build } from '$lib/schema/Build.schema.ts'
  import backupRestore from '@iconify/icons-mdi/backup-restore'
  import contentSave from '@iconify/icons-mdi/content-save'
  import pencilIcon from '@iconify/icons-mdi/pencil'
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

  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  const handleKeydown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      modalToggle()
    }
  }

  const authorsArray: string[] = $derived.by(() => {
    const deriveAuthorsArray: string[] = [...getAllBuildAuthors().values()]
    return deriveAuthorsArray.toSorted((a, b) => a.localeCompare(b))
  })

  const versionsArray: string[] = $derived(buildsData.versions.map((version) => version.version).reverse())

  const buildTypesArray: Array<{ value: string; label: string }> = $derived.by(() => {
    const deriveBuildTypesArray: Array<{ value: string; label: string }> = []
    for (const typeKey in buildsData.types) {
      if (Object.hasOwn(buildsData.types, typeKey)) {
        deriveBuildTypesArray.push({ value: typeKey, label: buildsData.types[typeKey] })
      }
    }

    return deriveBuildTypesArray
  })

  let buildOriginalTitle: string = $state('')
  let buildOriginalType: string = $state('')

  const initBuild = (): Build => {
    if (buildUrl) {
      for (const buildCategory of buildsData.buildList) {
        const existingBuild = buildCategory.builds.find((build_) => {
          return build_.url === buildUrl
        })

        if (existingBuild) {
          buildType = buildCategory.type
          buildOriginalType = buildCategory.type
          buildOriginalTitle = existingBuild.title
          return structuredClone($state.snapshot(existingBuild))
        }
      }
    }

    return { title: '', url: '', versions: [buildsData.currentVersion], pin: false, skip: false }
  }

  let build: Build = $state(initBuild())

  let form = $state<HTMLFormElement>()
  let invalidUrl = $state('')

  const saveBuild = () => {
    if (buildOriginalType && buildOriginalType !== buildType) {
      const buildOriginalTypeIndex = buildsData.buildList.findIndex((buildCategory) => {
        return buildCategory.type === buildOriginalType
      })

      const buildOriginalIndex = buildsData.buildList[buildOriginalTypeIndex].builds.findIndex((build_) => {
        return build_.url === build?.url
      })

      buildsData.buildList[buildOriginalTypeIndex].builds.splice(buildOriginalIndex, 1)
    }

    let buildTypeIndex = buildsData.buildList.findIndex((buildCategory) => {
      return buildCategory.type === buildType
    })

    // not found, add new
    if (buildTypeIndex === -1) {
      const buildTypeSnapshot = $state.snapshot(buildType)
      const buildTypeLowercase = buildTypeSnapshot.toLowerCase()
      buildsData.types[buildTypeLowercase] = buildTypeSnapshot
      buildTypeIndex =
        buildsData.buildList.push({
          type: buildTypeLowercase,
          builds: [$state.snapshot(build)],
        }) - 1
    }

    const foundBuildIndex = buildsData.buildList[buildTypeIndex].builds.findIndex((build_) => {
      return build_.url === build.url
    })

    if (foundBuildIndex >= 0) {
      buildsData.buildList[buildTypeIndex].builds[foundBuildIndex] = $state.snapshot(build)
    } else {
      // not found, add new
      buildsData.buildList[buildTypeIndex].builds.push($state.snapshot(build))
    }

    // Trigger update
    buildsData.buildList = buildsData.buildList
  }

  const formSubmit = (event: MouseEvent | SubmitEvent) => {
    event.preventDefault()

    if (!form?.reportValidity()) {
      return
    }

    invalidUrl = checkBuildsForDuplicates(buildsData.buildList, build.url, buildOriginalTitle)
    if (invalidUrl) {
      return
    }

    saveBuild()
    modalOpen = false
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
              const paste = (event.clipboardData ?? window.clipboardData).getData('text')
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
          <Checkbox bind:checked={build.pin} class="size-4" />
          <Field.Label>Pin build</Field.Label>
        </Field.Field>
        <Field.Field orientation="horizontal">
          <Checkbox bind:checked={build.skip} class="size-4" />
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
