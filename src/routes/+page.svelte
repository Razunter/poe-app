<script lang='ts'>
  import Build from '$components/Build.svelte'
  import type {BuildsDataType, BuildsDataWritable} from '$lib/BuildsData'
  import {BuildsDataClass} from '$lib/BuildsData'
  import Icon from '@iconify/svelte'
  import circleSmall from '@iconify/icons-mdi/circle-small'
  import {getContext} from 'svelte'
  import type {Writable} from 'svelte/store'
  import {Button} from 'sveltestrap'
  import BuildEditModal from '$components/BuildEditModal.svelte'
  import plusThick from '@iconify/icons-mdi/plus-thick'

  export let data: { buildData: BuildsDataType }
  const BuildsData: BuildsDataWritable = getContext('BuildsData')
  $BuildsData = new BuildsDataClass(data.buildData)

  const showOutdated = getContext<Writable<boolean>>('showOutdated')

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }

  let showAddBuildModal = false

  const addBuild = () => {
    showAddBuildModal = true
  }
</script>

<svelte:head>
  <title>Razunter's PoE Starters Collection Editor</title>
  <meta name='description' content="Editor GUI for Razunter's PoE Starters Collection"/>
</svelte:head>

<section class="card">
  <div class="card-header d-flex justify-content-between align-center">
    <h2 class="card-title display-5">Build list</h2>
    <Button color="success" size="lg" on:click={addBuild}>
      <span class='btn-icon__inner'><Icon icon={plusThick} class='btn-icon__icon'/><span
        class='btn-icon__text'>Add build</span></span>
    </Button>
    {#if showAddBuildModal}
      <BuildEditModal bind:modalOpen={showAddBuildModal}/>
    {/if}
  </div>
  <div class="card-body">
    {#each $BuildsData.buildList as buildCategory}
      <h3 class="display-6 icon-wrap">
        <Icon class="icon" icon={circleSmall}/>
        <span class="text">{capitalizeFirstLetter(buildCategory.type)}</span></h3>
      <hr/>
      {#each buildCategory.builds as build}
        {@const outdated = BuildsDataClass.isOutdatedBuild($BuildsData, build.versions)}
        {#if !outdated || ($showOutdated && outdated) }
          <Build buildData={build} outdated={outdated}/>
        {/if}
      {/each}
    {/each}
  </div>
</section>

<style lang="scss">
  .icon-wrap {
    display: flex;
    align-items: center;

    :global .icon {
      margin-top: 0.15em;
      margin-right: 0.25em;
    }
  }
</style>
