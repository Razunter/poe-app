<script lang='ts'>
  import pinIcon from '@iconify/icons-mdi/pin'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import Icon from '@iconify/svelte'
  import type {Build} from '$lib/Build'
  import {Button} from 'sveltestrap'
  import BuildEditModal from '$components/BuildEditModal.svelte'
  import deleteIcon from '@iconify/icons-mdi/delete'
  import {BuildsData} from '$lib/BuildsData'

  export let buildData: Build
  export let outdated = false

  let editModalOpen = false

  const deleteBuild = () => {
    if (!window.confirm('Confirm deletion?')) {
      return
    }

    let buildIndex = -1
    let categoryIndex: string | undefined

    for (const buildCategory in $BuildsData.buildList) {
      // eslint-disable-next-line @typescript-eslint/no-loop-func
      buildIndex = $BuildsData.buildList[buildCategory].builds.findIndex((build) => {
        return build.url === buildData.url
      })

      if (buildIndex >= 0) {
        categoryIndex = buildCategory
        break
      }
    }

    if (buildIndex >= 0 && categoryIndex) {
      $BuildsData.buildList[categoryIndex].builds.splice(buildIndex, 1)
      // trigger update
      $BuildsData = $BuildsData
    }
  }
</script>

<article
  class="build card text-bg-dark mb-4"
  class:build--outdated={outdated}
  class:build--skip={buildData.skip}
>
  <div class="build__image rounded-start">
    {#if buildData.videothumb?.['480w']}
      <img src="{buildData.videothumb['480w']}" class="img-fluid rounded-start" alt="{buildData.title}" loading="lazy">
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
    <span class="build__pinned" class:text-success={buildData.pin}>
         <Icon icon={pinIcon}/>
    </span>
    {#if buildData.skip}
      <span class="build__skipped text-warning">Skipped</span>
    {/if}
  </div>
  <div class="build__buttons">
    <Button color='primary' size='lg' on:click={() => {
      editModalOpen = true
    }}>
      <span class='btn-icon__inner'>
        <Icon icon={pencilIcon} class='btn-icon__icon'/>
        <span class='btn-icon__text'>Edit</span>
      </span>
    </Button>
    <Button color='danger' size='lg' class='text-white' on:click={deleteBuild}>
      <span class='btn-icon__inner'>
        <Icon icon={deleteIcon} class='btn-icon__icon'/>
        <span class='btn-icon__text'>Delete</span>
      </span>
    </Button>
  </div>
</article>
{#if editModalOpen}
  <BuildEditModal bind:modalOpen={editModalOpen} buildUrl={buildData.url}/>
{/if}

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
