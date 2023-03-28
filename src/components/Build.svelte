<script lang='ts'>
  import pinIcon from '@iconify/icons-mdi/pin'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import Icon from '@iconify/svelte'
  import type {Build} from '$lib/Build'
  import type {BuildsDataType} from '$lib/BuildsData'
  import {compareVersions} from 'compare-versions'
  import {
    Button,
    // Modal,
    // ModalBody,
    // ModalFooter,
    // ModalHeader,
  } from 'sveltestrap'

  let modalOpen = false
  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  export let buildData: Build
  let newBuildData = {...buildData}
  export let authors: BuildsDataType['authors']
  const authorsCopy = Array.isArray(authors) ? Array.from(authors) as string[] : []
  let authorsFiltered
  let outdated

  const filterFunction = (value: string) => {
    const needle = value.toLowerCase()
    authorsFiltered = authorsCopy.filter((filterValue: string) => {
      return filterValue.toLowerCase()
        .includes(needle)
    })
  }

  const formSubmit = () => {
    newBuildData.versions.sort(compareVersions)
    buildData = {...newBuildData}
    modalOpen = false
  }

  const formCancel = () => {
    newBuildData = {...buildData}
    modalOpen = false
  }
</script>

<article
  class="build card text-bg-dark mb-4"
  class:build--outdated={outdated}
  class:build--skip={buildData.skip}
>
  <div class="build__image rounded-start">
    {#if buildData.videothumb?.['480w']}
      <img src="{buildData.videothumb['480w']}" class="img-fluid rounded-start" alt="{buildData.title}">
    {/if}
  </div>
  <h4 class='build__title card-title'>
    {#if buildData.author}
      <span class='build__author text-secondary'>{ buildData.author }</span> -
    {/if}
    { buildData.title }
    {#if outdated && buildData.versions.length > 0}
      - <span class='build__version text-warning'>
        { buildData.versions[buildData.versions.length - 1] }
      </span>
    {/if}
  </h4>
  <div class="build__url card-text">
    <a href="{ buildData.url }" target="_blank" title="{buildData.title}">{buildData.url}</a>
  </div>
  <div class='build__footer card-text text-muted'>
    {#each ['480w', '640w', '1280w'] as size}
      <span class="build_videothumb--{size}"
            class:text-success={buildData.videothumb?.hasOwnProperty(size)}>{size}</span>
    {/each}
    <span class="build__pinned" class:active={buildData.pin}>
         <Icon icon={pinIcon}/>
    </span>
    {#if buildData.skip}
      <span class="build__skipped text-warning">Skipped</span>
    {/if}
  </div>
  <div class="build__buttons">
    <Button color='primary' size='lg' class='w-100'>
      <span class='btn-icon__inner'>
        <Icon icon={pencilIcon} class='btn-icon__icon'/>
        <span class='btn-icon__text'>Edit</span>
      </span>
    </Button>
  </div>
  <!--  <Modal isOpen={modalOpen} {modalToggle}>-->
  <!--    <ModalHeader {modalToggle}>Edit build</ModalHeader>-->
  <!--    <ModalBody>-->
  <!--          <q-form-->
  <!--            @submit.prevent="formSubmit"-->
  <!--          >-->
  <!--            <q-input-->
  <!--              v-model.trim="newBuildData.title"-->
  <!--              label="Build title"-->
  <!--              required-->
  <!--              autocomplete="false"-->
  <!--              bottom-slots-->
  <!--              :rules="[val => !!val || 'Field is required']"-->
  <!--            />-->
  <!--            <q-select-->
  <!--              v-model="newBuildData.author"-->
  <!--              :options="authorsFiltered"-->
  <!--              clearable-->
  <!--              use-input-->
  <!--              new-value-mode="add-unique"-->
  <!--              input-debounce="0"-->
  <!--              label="Author"-->
  <!--              bottom-slots-->
  <!--              @filter="filterFn"-->
  <!--            />-->
  <!--            <q-input-->
  <!--              v-model.trim="newBuildData.url"-->
  <!--              label="Build URL"-->
  <!--              required-->
  <!--              bottom-slots-->
  <!--              :rules="[val => !!val || 'Field is required']"-->
  <!--            >-->
  <!--              <template #append>-->
  <!--                <q-btn-->
  <!--                  :href="newBuildData.url"-->
  <!--                  icon="mdi-open-in-new"-->
  <!--                  target="_blank"-->
  <!--                  flat-->
  <!--                  type="a"-->
  <!--                />-->
  <!--              </template>-->
  <!--            </q-input>-->
  <!--            <q-input-->
  <!--              v-model.trim="newBuildData.video"-->
  <!--              label="Video URL"-->
  <!--              bottom-slots-->
  <!--            />-->
  <!--            <q-select-->
  <!--              v-model="newBuildData.versions"-->
  <!--              label="Supported versions"-->
  <!--              new-value-mode="toggle"-->
  <!--              placeholder="Add version..."-->
  <!--              multiple-->
  <!--              required-->
  <!--              use-input-->
  <!--              use-chips-->
  <!--              bottom-slots-->
  <!--              :rules="[val => !!val || 'Field is required']"-->
  <!--            />-->
  <!--            <q-toggle-->
  <!--              v-model="newBuildData.pin"-->
  <!--              label="Pin build"-->
  <!--              bottom-slots-->
  <!--            />-->
  <!--            <q-toggle-->
  <!--              v-model="newBuildData.skip"-->
  <!--              label="Skip build"-->
  <!--            />-->
  <!--          </q-form>-->
  <!--    </ModalBody>-->
  <!--    <ModalFooter>-->
  <!--      <Button color='primary' on:click={formSubmit}>Save</Button>-->
  <!--      <Button color='danger' on:click={formCancel}>Delete</Button>-->
  <!--    </ModalFooter>-->
  <!--  </Modal>-->
</article>

<style lang='scss'>
  .btn-unstyled {
    all: unset;
    display: block;
    width: 100%;
    cursor: pointer;
  }

  .build {
    display: grid;
    grid-template-areas: "image title buttons"
                         "image url buttons"
                         "image footer buttons";
    grid-template-columns: max-content auto max-content;
    grid-template-rows: max-content auto max-content;
    grid-column-gap: 2rem;
    grid-row-gap: var(--bs-card-spacer-y);

    &__image {
      grid-area: image;
      width: 240px;
      aspect-ratio: 16/9;
      overflow: hidden;
      display: flex;
      align-items: center;
    }

    &__title {
      grid-area: title;
      margin-bottom: 0;
      padding-top: var(--bs-card-spacer-y);
      align-self: start;
    }

    &__url {
      grid-area: url;
      align-self: center;
    }

    &__author {
      font-weight: 600;
    }

    &__footer {
      align-self: end;
      padding-bottom: var(--bs-card-spacer-y);
      grid-area: footer;
      font-size: .8em;
      display: flex;
      gap: 1em;
    }

    &__buttons {
      grid-area: buttons;
      align-self: center;
      padding: var(--bs-card-spacer-y) var(--bs-card-spacer-x);
    }
  }

  .build--outdated {
    opacity: .6;
  }

  .build--skip {
    border-color: var(--bs-warning);
  }
</style>
