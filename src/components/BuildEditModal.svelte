<script lang="ts">
  import {Button, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader} from 'sveltestrap'
  import {BuildsData} from '$lib/BuildsData'
  import {Build} from '$lib/Build'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import Icon from '@iconify/svelte'
  import Svelecte from 'svelecte'
  import {onMount} from 'svelte'

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

  let build: Build

  if (buildUrl) {
    for (const buildCategory of $BuildsData.buildList) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      const foundBuild = buildCategory.builds.find((build_) => {
        return build_.url === buildUrl
      })

      if (foundBuild) {
        build = structuredClone(foundBuild)
        break
      }
    }
  } else {
    build = new Build()
  }

  const formSubmit = () => {
    // newBuildData.versions.sort(compareVersions)
    // buildData = {...newBuildData}
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
        <Input id="pinBuild" type="switch" label="Pin build" bind:value={build.pin} />
      </FormGroup>
      <FormGroup>
        <Input id="skipBuild" type="switch" label="Skip build" bind:value={build.skip} />
      </FormGroup>
    </form>
  </ModalBody>
  <ModalFooter>
    <Button color='primary' on:click={formSubmit}>Save</Button>
    <Button color='warning' on:click={() => {}}>Reset</Button>
    <Button color='danger' on:click={() => {}}>Delete</Button>
  </ModalFooter>
</Modal>
