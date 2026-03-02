<script lang="ts">
  import { buildsData } from '$lib/BuildsData.svelte.ts'
  // noinspection ES6UnusedImports
  import * as Accordion from '$lib/components/ui/accordion/index.ts'
  import { Button } from '$lib/components/ui/button/index.ts'
  import { Checkbox } from '$lib/components/ui/checkbox'
  // noinspection ES6UnusedImports
  import * as Dialog from '$lib/components/ui/dialog/index.ts'
  // noinspection ES6UnusedImports
  import * as Field from '$lib/components/ui/field/index.ts'
  import { Input } from '$lib/components/ui/input/index.ts'
  import type { GameVersion } from '$lib/schema/GameVersion.schema.ts'
  import contentSave from '@iconify/icons-mdi/content-save'
  import deleteIcon from '@iconify/icons-mdi/delete'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import plusThick from '@iconify/icons-mdi/plus-thick'
  import Icon from '@iconify/svelte'
  import Svelecte from 'svelecte'

  let { modalOpen = $bindable(false) }: { modalOpen?: boolean } = $props()

  let form = $state<HTMLFormElement>()

  const localConfig: LocalConfig = $state({
    versions: structuredClone($state.snapshot(buildsData.versions)).toReversed(),
    currentVersion: $state.snapshot(buildsData.currentVersion),
  })

  const versionNumbers: App.SvelecteOption[] = $derived(
    localConfig.versions.map((version) => {
      return {
        text: version.version,
        value: version.version,
      } satisfies App.SvelecteOption
    }),
  )

  const formSubmit = (event: MouseEvent | SubmitEvent) => {
    event.preventDefault()

    if (!form?.reportValidity()) {
      return
    }

    const localConfigSnapshot = $state.snapshot(localConfig)
    buildsData.versions = localConfigSnapshot.versions.toReversed()
    buildsData.currentVersion = localConfigSnapshot.currentVersion

    modalOpen = false
  }

  const addVersion = () => {
    localConfig.versions.unshift({
      version: '',
      name: '',
    } satisfies GameVersion)
    localConfig.versions = localConfig.versions
  }

  const deleteVersion = (version: GameVersion) => {
    localConfig.versions = localConfig.versions.filter((foundVersion) => {
      return foundVersion.version !== version.version
    })
  }

  type LocalConfig = {
    versions: GameVersion[]
    currentVersion: string
  }
</script>

<Dialog.Root bind:open={modalOpen}>
  <Dialog.Content class="sm:max-w-[800px] h-full max-h-[90dvh]">
    <Dialog.Header>
      <Dialog.Title>
        <Icon icon={pencilIcon} class="inline mr-2" />
        Edit versions config
      </Dialog.Title>
    </Dialog.Header>
    <form bind:this={form} onsubmit={formSubmit} class="overflow-y-auto">
      <div class="mb-4">
        <label class="block text-sm font-medium text-gray-300 mb-1" for="editCurrentVersion"> Current version </label>
        <Svelecte
          inputId="editCurrentVersion"
          class="svelecte--dark"
          options={versionNumbers}
          bind:value={localConfig.currentVersion}
          name="editCurrentVersionSelect"
          required
        />
      </div>
      <hr class="border-gray-600 my-4" />
      <h3 class="text-white mb-3">Versions</h3>
      <div class="mb-3">
        <Button size="lg" onclick={addVersion}>
          <Icon icon={plusThick} class="w-5 h-5" />
          <span>Add new version</span>
        </Button>
      </div>
      <Accordion.Root type="single" class="flex flex-col gap-4" value="0">
        {#each localConfig.versions as version, index (index)}
          <Accordion.Item value="0" class="bg-gray-700 rounded-lg p-4">
            <Accordion.Trigger class="font-medium text-lg p-0 text-white">
              {version.version || 'new'}
            </Accordion.Trigger>
            <Accordion.Content class="grid gap-3">
              <Field.Field>
                <Field.Label for="version-{version.version}">Version number</Field.Label>
                <Input
                  id="version-{version.version}"
                  pattern={'\\d\\.\\d{1,2}(.\\d{1,2})?'}
                  bind:value={version.version}
                  required
                />
              </Field.Field>
              <Field.Field>
                <Field.Label for="league-{version.version}">League name</Field.Label>
                <Input id="league-{version.version}" bind:value={version.name} required />
              </Field.Field>
              <Field.Field>
                <Field.Label for="url-{version.version}">League promo URL</Field.Label>
                <Input id="url-{version.version}" bind:value={version.url} />
              </Field.Field>
              <Field.Field orientation="horizontal">
                <Checkbox id="wip-{version.version}" bind:checked={version.wip} class="" />
                <Field.Label for="wip-{version.version}">Work in progress</Field.Label>
              </Field.Field>
              <Field.Field>
                <Field.Label for="note-{version.version}">Note</Field.Label>
                <Input id="note-{version.version}" bind:value={version.note} />
              </Field.Field>
              <Field.Field>
                <Field.Label for={`editCompatible-${version.version}`}>Compatible versions</Field.Label>
                <Svelecte
                  inputId={`editCompatible-${version.version}`}
                  class="svelecte--dark"
                  options={versionNumbers.filter((fVersion) => {
                    return fVersion.value !== localConfig.currentVersion && fVersion.value !== version.version
                  })}
                  bind:value={version.compatible}
                  placeholder="Add version..."
                  multiple
                />
              </Field.Field>
              <Button
                variant="destructive"
                class="w-fit"
                onclick={() => {
                  deleteVersion(version)
                }}
              >
                <Icon icon={deleteIcon} class="w-5 h-5" />
                <span>Delete</span>
              </Button>
            </Accordion.Content>
          </Accordion.Item>
        {/each}
      </Accordion.Root>
    </form>
    <Dialog.Footer class="border-t border-gray-600 pt-6">
      <Button type="submit" onclick={formSubmit}>
        <Icon icon={contentSave} class="w-5 h-5" />
        <span>Save</span>
      </Button>
    </Dialog.Footer>
  </Dialog.Content>
</Dialog.Root>
