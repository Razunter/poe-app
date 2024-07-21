<script lang="ts">
  import type { SvelecteOption } from '../app'
  import contentSave from '@iconify/icons-mdi/content-save'
  import deleteIcon from '@iconify/icons-mdi/delete'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import plusThick from '@iconify/icons-mdi/plus-thick'
  import Icon from '@iconify/svelte'
  import {
    Accordion,
    AccordionItem,
    Button,
    FormGroup,
    Input,
    Modal,
    ModalBody,
    ModalFooter,
  } from '@sveltestrap/sveltestrap'
  import { allPoeVersions, currentPoeVersion, type Versions } from '$lib/BuildsData.svelte.ts'
  import Svelecte from 'svelecte'

  let { modalOpen = $bindable(false) }: { modalOpen?: boolean } = $props()

  let form: HTMLFormElement

  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  const localConfig: LocalConfig = $state({
    versions: structuredClone($allPoeVersions).reverse(),
    currentVersion: $currentPoeVersion,
  })

  localConfig.versionNumbers = localConfig.versions.map((version) => {
    return {
      text: version.version,
      value: version.version,
    } satisfies SvelecteOption
  })

  const formSubmit = (event: SubmitEvent | MouseEvent) => {
    event.preventDefault()

    if (!form.reportValidity()) {
      return
    }

    const localConfigSnapshot = $state.snapshot(localConfig)
    $allPoeVersions = localConfigSnapshot.versions.reverse()
    $currentPoeVersion = localConfigSnapshot.currentVersion

    modalOpen = false
  }

  const addVersion = () => {
    localConfig.versions.unshift({
      version: '',
      name: '',
    } satisfies Versions)
    localConfig.versions = localConfig.versions
  }

  const deleteVersion = (version: Versions) => {
    localConfig.versions = localConfig.versions.filter((foundVersion) => {
      return foundVersion.version !== version.version
    })
  }

  type LocalConfig = {
    versions: Versions[]
    currentVersion: string
    versionNumbers?: SvelecteOption[]
  }
</script>

<Modal
  isOpen={modalOpen}
  toggle={modalToggle}
  size="lg"
  scrollable
>
  <ModalBody>
    <h5 class="modal-title border-bottom mb-3 py-2">
      <Icon
        icon={pencilIcon}
        style="vertical-align: -0.15em;"
      />
      Edit versions config
    </h5>
    <form
      bind:this={form}
      onsubmit={formSubmit}
    >
      <FormGroup>
        <label
          class="form-label"
          for="editCurrentVersion"
        >
          Current version
        </label>
        <Svelecte
          inputId="editCurrentVersion"
          class="svelecte--dark"
          options={localConfig.versionNumbers}
          bind:value={localConfig.currentVersion}
          name="editCurrentVersionSelect"
          required
        />
      </FormGroup>
      <hr />
      <h3>Versions</h3>
      <div class="mb-3">
        <Button
          type="button"
          color="primary"
          size="lg"
          on:click={addVersion}
        >
          <span class="btn-icon__inner">
            <Icon
              icon={plusThick}
              class="btn-icon__icon"
            />
            <span class="btn-icon__text">Add new version</span>
          </span>
        </Button>
      </div>
      <Accordion>
        {#each localConfig.versions as version}
          <AccordionItem header={version.version || 'new'}>
            <FormGroup
              floating
              label="Version number"
            >
              <Input
                pattern={'\\d\\.\\d{1,2}'}
                bind:value={version.version}
                required
              />
            </FormGroup>
            <FormGroup
              floating
              label="League name"
            >
              <Input
                bind:value={version.name}
                required
              />
            </FormGroup>
            <FormGroup
              floating
              label="League promo URL"
            >
              <Input bind:value={version.url} />
            </FormGroup>
            <FormGroup>
              <Input
                type="switch"
                label="Work in progress"
                bind:checked={version.wip}
              />
            </FormGroup>
            <FormGroup
              floating
              label="Note"
            >
              <Input bind:value={version.note} />
            </FormGroup>
            <FormGroup>
              <label
                class="form-label"
                for={`editCompatible-${version.version}`}
              >
                Compatible versions
              </label>
              <Svelecte
                inputId={`editCompatible-${version.version}`}
                class="svelecte--dark"
                options={localConfig.versionNumbers?.filter((fVersion) => {
                  return fVersion.value !== localConfig.currentVersion && fVersion.value !== version.version
                })}
                bind:value={version.compatible}
                placeholder="Add version..."
                multiple
              />
            </FormGroup>
            <Button
              type="button"
              color="danger"
              class="text-white"
              on:click={() => {
                deleteVersion(version)
              }}
            >
              <span class="btn-icon__inner">
                <Icon
                  icon={deleteIcon}
                  class="btn-icon__icon"
                />
                <span class="btn-icon__text">Delete</span>
              </span>
            </Button>
          </AccordionItem>
        {/each}
      </Accordion>
    </form>
  </ModalBody>
  <ModalFooter>
    <Button
      type="submit"
      color="primary"
      on:click={formSubmit}
    >
      <span class="btn-icon__inner">
        <Icon
          icon={contentSave}
          class="btn-icon__icon"
        />
        <span class="btn-icon__text">Save</span>
      </span>
    </Button>
  </ModalFooter>
</Modal>
