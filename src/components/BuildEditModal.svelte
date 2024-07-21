<script lang="ts">
  import type { SvelecteOption } from '../app'
  import backupRestore from '@iconify/icons-mdi/backup-restore'
  import contentSave from '@iconify/icons-mdi/content-save'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import Icon from '@iconify/svelte'
  import {
    Button,
    FormGroup,
    Input,
    InputGroup,
    InputGroupText,
    Modal,
    ModalBody,
    ModalFooter,
  } from '@sveltestrap/sveltestrap'
  import {
    allBuildAuthors,
    allPoeVersions,
    type Build,
    buildList,
    buildTypes,
    currentPoeVersion,
  } from '$lib/BuildsData.svelte.ts'
  import { checkBuildsForDuplicates } from '$lib/BuildsProcessing/checkBuildsForDuplicates.ts'
  import Svelecte from 'svelecte'

  // Unique build url for editing
  let {
    buildUrl = '',
    modalOpen = $bindable(false),
    buildType = $bindable($buildTypes[0]),
  }: {
    buildUrl?: string
    modalOpen?: boolean
    buildType?: string
  } = $props()

  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  const authorsArray: string[] = $derived.by(() => {
    const deriveAuthorsArray: string[] = Array.from($allBuildAuthors.values())
    return deriveAuthorsArray.sort((a, b) => a.localeCompare(b))
  })

  const versionsArray: string[] = $derived($allPoeVersions.map((version) => version.version))

  const buildTypesArray: Array<{ value: string; label: string }> = $derived.by(() => {
    const deriveBuildTypesArray: Array<{ value: string; label: string }> = []
    for (const typeKey in $buildTypes) {
      if (Object.hasOwn($buildTypes, typeKey)) {
        deriveBuildTypesArray.push({ value: typeKey, label: $buildTypes[typeKey] })
      }
    }

    return deriveBuildTypesArray
  })

  let buildOriginalTitle: string = $state('')
  let buildOriginalType: string = $state('')

  const initBuild = (): Build => {
    if (buildUrl) {
      for (const buildCategory of $buildList) {
        const existingBuild = buildCategory.builds.find((build_) => {
          return build_.url === buildUrl
        })

        if (existingBuild) {
          buildType = buildCategory.type
          buildOriginalType = buildCategory.type
          buildOriginalTitle = existingBuild.title
          return structuredClone(existingBuild)
        }
      }
    }

    return { title: '', url: '', versions: [$currentPoeVersion] }
  }

  let build: Build = $state(initBuild())

  let form: HTMLFormElement
  let invalidUrl = $state('')

  const saveBuild = () => {
    if (buildOriginalType && buildOriginalType !== buildType) {
      const buildOriginalTypeIndex = $buildList.findIndex((buildCategory) => {
        return buildCategory.type === buildOriginalType
      })

      const buildOriginalIndex = $buildList[buildOriginalTypeIndex].builds.findIndex((build_) => {
        return build_.url === build?.url
      })

      $buildList[buildOriginalTypeIndex].builds.splice(buildOriginalIndex, 1)
    }

    let buildTypeIndex = $buildList.findIndex((buildCategory) => {
      return buildCategory.type === buildType
    })

    // not found, add new
    if (buildTypeIndex === -1) {
      const buildTypeSnapshot = $state.snapshot(buildType)
      const buildTypeLowercase = buildTypeSnapshot.toLowerCase()
      $buildTypes[buildTypeLowercase] = buildTypeSnapshot
      buildTypeIndex =
        $buildList.push({
          type: buildTypeLowercase,
          builds: [$state.snapshot(build)],
        }) - 1
    }

    const foundBuildIndex = $buildList[buildTypeIndex].builds.findIndex((build_) => {
      return build_.url === build.url
    })

    if (foundBuildIndex >= 0) {
      $buildList[buildTypeIndex].builds[foundBuildIndex] = $state.snapshot(build)
    } else {
      // not found, add new
      $buildList[buildTypeIndex].builds.push($state.snapshot(build))
    }

    // Trigger update
    $buildList = $buildList
  }

  const formSubmit = (event: SubmitEvent | MouseEvent) => {
    event.preventDefault()

    if (!form.reportValidity()) {
      return
    }

    invalidUrl = checkBuildsForDuplicates($buildList, build.url, buildOriginalTitle)
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
  <ModalBody>
    <h5 class="modal-title border-bottom mb-3 py-2">
      <Icon
        icon={pencilIcon}
        style="vertical-align: -0.15em;"
      />
      Edit build
    </h5>
    <form
      bind:this={form}
      onsubmit={formSubmit}
    >
      <FormGroup>
        <label
          class="form-label"
          for="editBuildType"
        >
          Type
        </label>
        <Svelecte
          inputId="editBuildType"
          class="svelecte--dark"
          options={buildTypesArray}
          bind:value={buildType}
          allowEditing
          creatable
          creatablePrefix=""
          keepCreated
          onCreateOption={(newOption: SvelecteOption) => {
            buildType = newOption.value
          }}
        />
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="editBuildTitle"
        >
          Title
        </label>
        <InputGroup>
          <Input
            id="editBuildTitle"
            required
            bind:value={build.title}
          />
          <InputGroupText class="p-1 bg-dark">
            <Button
              type="button"
              title="lowercase"
              color="dark"
              class="py-0"
              on:click={() => {
                build.title = build.title.toLowerCase()
              }}
            >
              low
            </Button>
          </InputGroupText>
        </InputGroup>
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="editBuildAuthor"
        >
          Author
        </label>
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
          onCreateOption={(newOption: SvelecteOption) => {
            build.author = newOption.value
          }}
        />
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="editBuildURL"
        >
          URL
        </label>
        <Input
          id="editBuildURL"
          invalid={invalidUrl.length > 0}
          feedback={invalidUrl ? 'Duplicate URL: ' + invalidUrl : ''}
          required
          bind:value={build.url}
        />
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="editBuildVideoURL"
        >
          Video URL
        </label>
        <Input
          id="editBuildVideoURL"
          bind:value={build.video}
        />
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="editBuildVersions"
        >
          Compatible game versions
        </label>
        <Svelecte
          inputId="editBuildVersions"
          class="svelecte--dark"
          options={versionsArray}
          bind:value={build.versions}
          multiple
        />
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="pinBuild"
        >
          Pin build
        </label>
        <Input
          id="pinBuild"
          type="switch"
          bind:checked={build.pin}
        />
      </FormGroup>
      <FormGroup>
        <label
          class="form-label"
          for="pinBuild"
        >
          Skip build
        </label>
        <Input
          id="skipBuild"
          type="switch"
          bind:checked={build.skip}
        />
      </FormGroup>
    </form>
  </ModalBody>
  <ModalFooter class="justify-content-between">
    <Button
      type="reset"
      color="warning"
      on:click={() => {
        build = initBuild()
      }}
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
