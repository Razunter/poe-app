<script lang="ts">
  import {
    Accordion,
    AccordionItem,
    Button,
    FormGroup,
    Input,
    Label,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from 'sveltestrap'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import contentSave from '@iconify/icons-mdi/content-save'
  import plusThick from '@iconify/icons-mdi/plus-thick'
  import Icon from '@iconify/svelte'
  import Svelecte from 'svelecte'
  import type {BuildsDataWritable} from '$lib/BuildsData'
  import type {Versions} from '$lib/dataTypes'
  import deleteIcon from '@iconify/icons-mdi/delete'
  import {getContext} from 'svelte'

  export let modalOpen = false

  let form: HTMLFormElement

  const BuildsData = getContext<BuildsDataWritable>('BuildsData')

  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  const localConfig: LocalConfig = {
    versions: structuredClone($BuildsData.versions).reverse(),
    currentVersion: $BuildsData.currentVersion,
  }

  $: localConfig.versionNumbers = localConfig.versions.map((version) => {
    return {
      text: version.version,
      value: version.version,
    } satisfies SvelecteValue
  })

  const formSubmit = () => {
    if (!form.reportValidity()) {
      return
    }

    $BuildsData.versions = localConfig.versions.reverse()
    $BuildsData.currentVersion = localConfig.currentVersion

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
    versions: Versions[];
    currentVersion: string;
    versionNumbers?: SvelecteValue[];
  }

  type SvelecteValue = { text: string, value: string }
</script>

<Modal isOpen={modalOpen} toggle={modalToggle} size="lg" scrollable>
  <ModalHeader toggle={modalToggle}>
    <Icon icon={pencilIcon} style="vertical-align: -0.15em;"/>
    Edit versions config
  </ModalHeader>
  <ModalBody>
    <form bind:this={form} on:submit|preventDefault={formSubmit}>
      <FormGroup>
        <Label for="editCurrentVersion">Current version</Label>
        <Svelecte inputId="editCurrentVersion" class="svelecte--dark"
                  options={localConfig.versionNumbers}
                  bind:value={localConfig.currentVersion}
                  required
        />
      </FormGroup>
      <hr/>
      <h3>Versions</h3>
      <div class="mb-3">
        <Button type="button" color="primary" size="lg" on:click={addVersion}>
          <span class='btn-icon__inner'>
            <Icon icon={plusThick} class='btn-icon__icon'/>
            <span class='btn-icon__text'>Add new version</span>
          </span>
        </Button>
      </div>
      <Accordion>
        {#each localConfig.versions as version}
          <AccordionItem header={version.version || 'new'}>
            <FormGroup floating label="Version number">
              <Input pattern={'\\d\\.\\d{1,2}'} bind:value={version.version} required/>
            </FormGroup>
            <FormGroup floating label="League name">
              <Input bind:value={version.name} required/>
            </FormGroup>
            <FormGroup floating label="League promo URL">
              <Input bind:value={version.url}/>
            </FormGroup>
            <FormGroup>
              <Input type="switch" label="Work in progress" bind:checked={version.wip}/>
            </FormGroup>
            <FormGroup floating label="Note">
              <Input bind:value={version.note}/>
            </FormGroup>
            <FormGroup>
              <Label for={`editCompatible-${version.version}`}>Compatible versions</Label>
              <Svelecte inputId={`editCompatible-${version.version}`} class="svelecte--dark"
                        options={localConfig.versionNumbers.filter((fVersion) => {
                          return (fVersion.value !== localConfig.currentVersion) && (fVersion.value !== version.version)
                        })}
                        bind:value={version.compatible}
                        placeholder="Add version..."
                        multiple
              />
            </FormGroup>
            <Button type="button" color="danger" class="text-white"
                    on:click={() => {
                      deleteVersion(version)
                    }}>
              <span class='btn-icon__inner'>
                <Icon icon={deleteIcon} class='btn-icon__icon'/>
                <span class='btn-icon__text'>Delete</span>
              </span>
            </Button>
          </AccordionItem>
        {/each}
      </Accordion>
    </form>
  </ModalBody>
  <ModalFooter>
    <Button type="submit" color='primary' on:click={formSubmit}>
      <span class='btn-icon__inner'>
        <Icon icon={contentSave} class='btn-icon__icon'/>
        <span class='btn-icon__text'>Save</span>
      </span>
    </Button>
  </ModalFooter>
</Modal>

<style lang="scss">
</style>
