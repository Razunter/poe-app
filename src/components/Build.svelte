<script lang='ts'>
  import pinIcon from '@iconify/icons-mdi/pin'
  import Icon from '@iconify/svelte'
  import compareVersions from 'compare-versions'
  import { isArray } from 'lodash-es'
  import {
    Button,
    Modal,
    ModalBody,
    ModalFooter,
    ModalHeader,
  } from 'sveltestrap'
  import type { Build } from '$lib/Build'
  import type { BuildsData } from '$lib/BuildsData'

  let modalOpen = false
  const modalToggle = () => {
    return (modalOpen = !modalOpen)
  }

  export let buildData: Build
  let newBuildData = { ...buildData }
  export let authors: BuildsData['authors']
  const authorsCopy = isArray(authors) ? Array.from(authors) as string[] : []
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
    buildData = { ...newBuildData }
    modalOpen = false
  }

  const formCancel = () => {
    newBuildData = { ...buildData }
    modalOpen = false
  }
</script>

<article
        class="build {outdated ? 'build--outdated' : ''}{buildData.skip ? 'build--skip' : ''}"
        tabindex='0'
        on:click={modalOpen = true}
>
    <div class='build__row'>
        <h5 class='build__title'>
            <template v-if='buildData.author'>
                <span class='build__author'>{ buildData.author }</span> -
            </template>
            { buildData.title }
        </h5>
        {#if buildData.versions}
            <div
                    class='build__version'
            >
                { buildData.versions[buildData.versions.length - 1] }
            </div>
        {/if}
        <div class='build__url'>
            { buildData.url }
        </div>
        <div class='build__info'>
        <span
                class="build__video {buildData.video && 'active'}"
        >V</span>
            <span
                    class="build_videothumb--480w {buildData.videothumb?.['480w'] && 'active'}"
            >
          T-480w
        </span>
            <span
                    class="build_videothumb--640w {buildData.videothumb?.['640w'] && 'active'}"
            >
          T-640w
        </span>
            <span
                    class="build_videothumb--1280w {buildData.videothumb?.['1280w'] && 'active'}"
            >
          T-1280w
        </span>
            <span
                    class="build__pinned {buildData.pin && 'active'}"
            >
            <Icon icon={pinIcon} />
        </span>
        </div>
    </div>
    <Modal isOpen={modalOpen} {modalToggle}>
        <ModalHeader {modalToggle}>Edit build</ModalHeader>
        <ModalBody>
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
        </ModalBody>
        <ModalFooter>
            <Button color='primary' on:click={formSubmit}>Save</Button>
            <Button color='danger' on:click={formCancel}>Delete</Button>
        </ModalFooter>
    </Modal>
</article>

<style lang='scss'>
  // .build {
  //   cursor: pointer;
  //   padding: .75rem 1rem;
  //   border: 1px solid #555;
  //   border-radius: .5rem;
  //   width: 100%;
  //   color: #fff;
  //   background: #151515;
  //
  //   &:hover, &:focus {
  //     background: #242424;
  //   }
  //
  //   &__row {
  //     display: grid;
  //     grid-template-columns: auto min-content;
  //   }
  //
  //   &__title {
  //     margin: 0 2rem 0 0;
  //     font-weight: 400;
  //   }
  //
  //   &__author {
  //     font-weight: 600;
  //   }
  //
  //   &__version {
  //     text-align: right;
  //   }
  //
  //   &__url {
  //     font-size: .8em;
  //     color: gray;
  //   }
  //
  //   &__info {
  //     display: flex;
  //     gap: 1em;
  //   }
  //
  //   &__info {
  //     font-size: .8em;
  //
  //     span {
  //       color: gray;
  //
  //       &.active {
  //         color: forestgreen;
  //       }
  //     }
  //   }
  // }
  //
  // .theme--dark.error--text {
  //   color: red;
  //
  //   .v-messages__message {
  //     color: red;
  //   }
  // }
  //
  // .build--outdated {
  //   opacity: .6;
  // }
  //
  // .build--skip {
  //   border-color: #cb4141;
  // }
</style>
