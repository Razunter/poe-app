<script lang="ts">
  import circleSmall from '@iconify/icons-mdi/circle-small'
  import plusThick from '@iconify/icons-mdi/plus-thick'
  import Icon from '@iconify/svelte'
  import { Button } from '@sveltestrap/sveltestrap'
  import Build from '$components/Build.svelte'
  import BuildEditModal from '$components/BuildEditModal.svelte'
  import { buildList } from '$lib/BuildsData.svelte.ts'
  import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
  import { showOutdated } from '$lib/stores.ts'

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  let showAddBuildModal = false

  let buildType: string | undefined

  const addBuild = (buildType_?: string) => {
    buildType = buildType_
    showAddBuildModal = true
  }
</script>

<svelte:head>
  <title>Razunter's PoE Starters Collection Editor</title>
  <meta
    name="description"
    content="Editor GUI for Razunter's PoE Starters Collection"
  />
</svelte:head>

<section class="card">
  <div class="card-header">
    <h2 class="card-title display-5">Build list</h2>
    {#if showAddBuildModal}
      <BuildEditModal
        {buildType}
        bind:modalOpen={showAddBuildModal}
      />
    {/if}
  </div>
  <div class="card-body">
    {#each $buildList as buildCategory}
      <div class="d-flex justify-content-between align-center">
        <h3 class="display-6 icon-wrap">
          <Icon
            class="icon"
            icon={circleSmall}
          />
          <span class="text">{capitalizeFirstLetter(buildCategory.type)}</span>
        </h3>
        <Button
          color="success"
          size="lg"
          on:click={() => {
            addBuild(buildCategory.type)
          }}
        >
          <span class="btn-icon__inner">
            <Icon
              icon={plusThick}
              class="btn-icon__icon"
            />
            <span class="btn-icon__text">Add build</span></span
          >
        </Button>
      </div>
      <hr />
      {#each buildCategory.builds as build}
        {@const outdated = isOutdatedBuild(build.versions)}
        {#if !outdated || ($showOutdated && outdated)}
          <Build
            buildData={build}
            {outdated}
          />
        {/if}
      {/each}
    {/each}
  </div>
</section>

<style lang="scss">
  .icon-wrap {
    display: flex;
    align-items: center;

    :global(.icon) {
      margin-top: 0.15em;
      margin-right: 0.25em;
    }
  }
</style>
