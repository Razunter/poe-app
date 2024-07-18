<script lang="ts">
  import backupRestore from '@iconify/icons-mdi/backup-restore'
  import contentSave from '@iconify/icons-mdi/content-save'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import Icon from '@iconify/svelte'
  import { Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from '@sveltestrap/sveltestrap'
  import { Build } from '$lib/Build'
  import type { BuildsDataWritable } from '$lib/BuildsData'
  import { BuildsDataClass } from '$lib/BuildsData'
  import Svelecte from 'svelecte'
  import { getContext } from 'svelte'

  // Unique build url for editing
  export let buildUrl = ''

  export let modalOpen = false

  const BuildsData = getContext<BuildsDataWritable>('BuildsData')

  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  const authorsArray: string[] = []
  for (const author of $BuildsData.authors.values()) {
    authorsArray.push(author)
  }
  authorsArray.sort()

  const versionsArray: string[] = $BuildsData.versions.map((version) => {
    return version.version
  })

  const buildTypesArray: Array<{ value: string; label: string }> = []
  for (const typeKey in $BuildsData.types) {
    buildTypesArray.push({ value: typeKey, label: $BuildsData.types[typeKey] })
  }

  let build: Build
  let buildOriginalTitle: string | undefined
  let buildOriginalType: string | undefined

  // can be set on modal creation
  export let buildType: string = $BuildsData.types[0]

  let form: HTMLFormElement
  let invalidUrl = ''

  const init = async () => {
    if (buildUrl) {
      for (const buildCategory of $BuildsData.buildList) {
        const existingBuild = buildCategory.builds.find((build_) => {
          return build_.url === buildUrl
        })

        if (existingBuild) {
          build = new Build(existingBuild)
          buildType = buildCategory.type
          buildOriginalType = buildCategory.type
          buildOriginalTitle = existingBuild.title
          break
        }
      }
    } else {
      build = new Build({ versions: [$BuildsData.currentVersion] })
    }
  }

  // On open
  init()

  const saveBuild = () => {
    if (buildOriginalType && buildOriginalType !== buildType) {
      const buildOriginalTypeIndex = $BuildsData.buildList.findIndex((buildCategory) => {
        return buildCategory.type === buildOriginalType
      })

      const buildOriginalIndex = $BuildsData.buildList[buildOriginalTypeIndex].builds.findIndex((build_) => {
        return build_.url === build.url
      })

      $BuildsData.buildList[buildOriginalTypeIndex].builds.splice(buildOriginalIndex, 1)
    }

    const buildTypeIndex = $BuildsData.buildList.findIndex((buildCategory) => {
      return buildCategory.type === buildType
    })

    // not found, add new
    if (buildTypeIndex === -1) {
      $BuildsData.buildList.push({
        type: buildType,
        builds: [build],
      })
    }

    const foundBuildIndex = $BuildsData.buildList[buildTypeIndex].builds.findIndex((build_) => {
      return build_.url === build.url
    })

    if (foundBuildIndex >= 0) {
      $BuildsData.buildList[buildTypeIndex].builds[foundBuildIndex] = build
    } else {
      // not found, add new
      $BuildsData.buildList[buildTypeIndex].builds.push(build)
    }

    // Trigger update
    $BuildsData = $BuildsData
  }

  const formSubmit = () => {
    if (!form.reportValidity()) {
      return
    }

    invalidUrl = BuildsDataClass.checkForDuplicates($BuildsData.buildList, build.url, buildOriginalTitle)
    if (invalidUrl) {
      return
    }

    saveBuild()
    modalOpen = false
  }
</script>

<Modal
  isOpen={modalOpen}
  toggle={modalToggle}
  size="lg"
>
  <ModalHeader toggle={modalToggle}>
    <Icon
      icon={pencilIcon}
      style="vertical-align: -0.15em;"
    />
    Edit build
  </ModalHeader>
  <ModalBody>
    <form
      bind:this={form}
      on:submit|preventDefault={formSubmit}
    >
      <FormGroup>
        <Label for="editBuildType">Type</Label>
        <Svelecte
          inputId="editBuildType"
          class="svelecte--dark"
          options={buildTypesArray}
          bind:value={buildType}
        />
      </FormGroup>
      <FormGroup>
        <Label for="editBuildTitle">Title</Label>
        <Input
          id="editBuildTitle"
          required
          bind:value={build.title}
        />
      </FormGroup>
      <FormGroup>
        <Label for="editBuildAuthor">Author</Label>
        <Svelecte
          inputId="editBuildAuthor"
          class="svelecte--dark"
          options={authorsArray}
          bind:value={build.author}
          clearable
          allowEditing
          creatable
          creatablePrefix=""
        />
      </FormGroup>
      <FormGroup>
        <Label for="editBuildURL">URL</Label>
        <Input
          id="editBuildURL"
          invalid={invalidUrl.length > 0}
          feedback={invalidUrl ? 'Duplicate URL: ' + invalidUrl : ''}
          required
          bind:value={build.url}
        />
      </FormGroup>
      <FormGroup>
        <Label for="editBuildVideoURL">Video URL</Label>
        <Input
          id="editBuildVideoURL"
          bind:value={build.video}
        />
      </FormGroup>
      <FormGroup>
        <Label for="editBuildVersions">Compatible game versions</Label>
        <Svelecte
          inputId="editBuildVersions"
          class="svelecte--dark"
          options={versionsArray}
          bind:value={build.versions}
          multiple
        />
      </FormGroup>
      <FormGroup>
        <Input
          id="pinBuild"
          type="switch"
          label="Pin build"
          bind:checked={build.pin}
        />
      </FormGroup>
      <FormGroup>
        <Input
          id="skipBuild"
          type="switch"
          label="Skip build"
          bind:checked={build.skip}
        />
      </FormGroup>
    </form>
  </ModalBody>
  <ModalFooter class="justify-content-between">
    <Button
      type="reset"
      color="warning"
      on:click={init}
    >
      <span class="btn-icon__inner">
        <Icon
          icon={backupRestore}
          class="btn-icon__icon"
        />
        <span class="btn-icon__text">Reset</span>
      </span>
    </Button>
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
