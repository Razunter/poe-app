<script lang="ts">
  import {Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from 'sveltestrap'
  import {BuildsData} from '$lib/BuildsData'
  import {Build} from '$lib/Build'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import contentSave from '@iconify/icons-mdi/content-save'
  import backupRestore from '@iconify/icons-mdi/backup-restore'
  import Icon from '@iconify/svelte'
  import Svelecte from 'svelecte'

  // Unique build url for editing
  export let buildUrl: string | undefined

  export let modalOpen = false

  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  const authorsArray: string[] = []
  for (const author of $BuildsData.authors.values()) {
    authorsArray.push(author)
  }

  const versionsArray: string[] = $BuildsData.versions.map((version) => {
    return version.version
  })

  const buildTypesArray: Array<{ value: string, label: string }> = []
  for (const typeKey in $BuildsData.types) {
    buildTypesArray.push({value: typeKey, label: $BuildsData.types[typeKey]})
  }

  let build: Build
  let buildOriginalType: string | undefined
  let buildType: string = $BuildsData.types[0]

  const init = async () => {
    if (buildUrl) {
      for (const buildCategory of $BuildsData.buildList) {
        // eslint-disable-next-line @typescript-eslint/no-loop-func
        const existingBuild = buildCategory.builds.find((build_) => {
          return build_.url === buildUrl
        })

        if (existingBuild) {
          build = new Build(existingBuild)
          buildType = buildCategory.type
          buildOriginalType = buildCategory.type
          break
        }
      }
    } else {
      build = new Build()
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
  }

  const formSubmit = () => {
    saveBuild()
    modalOpen = false
  }
</script>

<Modal isOpen={modalOpen} toggle={modalToggle} size="lg">
  <ModalHeader toggle={modalToggle}>
    <Icon icon={pencilIcon} style="vertical-align: -0.15em;"/>
    Edit build
  </ModalHeader>
  <ModalBody>
    <form on:submit|preventDefault={formSubmit}>
      <FormGroup>
        <Label for="editBuildType">Type</Label>
        <Svelecte inputId="editBuildType" class="svelecte--dark"
                  options={buildTypesArray}
                  bind:value={buildType}
        />
      </FormGroup>
      <FormGroup>
        <Label for="editBuildTitle">Title</Label>
        <Input id="editBuildTitle" required bind:value="{build.title}"/>
      </FormGroup>
      <FormGroup>
        <Label for="editBuildAuthor">Author</Label>
        <Svelecte inputId="editBuildAuthor" class="svelecte--dark" options={authorsArray} bind:value={build.author}
                  clearable allowEditing creatable labelAsValue/>
      </FormGroup>
      <FormGroup>
        <Label for="editBuildURL">URL</Label>
        <Input id="editBuildURL" required bind:value="{build.url}"/>
      </FormGroup>
      <FormGroup>
        <Label for="editBuildVideoURL">Video URL</Label>
        <Input id="editBuildVideoURL" required bind:value="{build.video}"/>
      </FormGroup>
      <FormGroup>
        <Label for="editBuildVersions">Compatible game versions</Label>
        <Svelecte inputId="editBuildVersions"
                  class="svelecte--dark"
                  options={versionsArray}
                  bind:value={build.versions}
                  multiple
                  labelAsValue
        />
      </FormGroup>
      <FormGroup>
        <Input id="pinBuild" type="switch" label="Pin build" bind:checked={build.pin}/>
      </FormGroup>
      <FormGroup>
        <Input id="skipBuild" type="switch" label="Skip build" bind:checked={build.skip}/>
      </FormGroup>
    </form>
  </ModalBody>
  <ModalFooter>
    <Button type="submit" color='primary' on:click={formSubmit}>
      <span class='btn-icon__inner'>
        <Icon icon={contentSave} class='btn-icon__icon'/>
        <span class='btn-icon__text'>Save</span>
      </span>
    </Button>
    <Button type="reset" color='warning' on:click={init}>
      <span class='btn-icon__inner'>
        <Icon icon={backupRestore} class='btn-icon__icon'/>
        <span class='btn-icon__text'>Reset</span>
      </span>
    </Button>
  </ModalFooter>
</Modal>
