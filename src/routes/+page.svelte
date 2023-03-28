<script lang='ts'>
  import Build from '$components/Build.svelte'
  import type {BuildsDataType} from '$lib/BuildsData'
  import {BuildsData, BuildsDataClass} from '$lib/BuildsData'
  import Icon from '@iconify/svelte'
  import circleSmall from '@iconify/icons-mdi/circle-small'

  export let data: { buildData: BuildsDataType }
  $BuildsData = new BuildsDataClass(data.buildData)

  const capitalizeFirstLetter = (string: string) => {
    return string.charAt(0).toUpperCase() + string.slice(1)
  }
</script>

<svelte:head>
  <title>Razunter's PoE Starters Collection Editor</title>
  <meta name='description' content="Editor GUI for Razunter's PoE Starters Collection"/>
</svelte:head>

<section class="card">
  <div class="card-header">
    <h2 class="card-title display-5">Build list</h2>
  </div>
  <div class="card-body">
    {#each $BuildsData.buildList as buildCategory}
      <h3 class="display-6 icon-wrap">
        <Icon class="icon" icon={circleSmall}/>
        <span class="text">{capitalizeFirstLetter(buildCategory.type)}</span></h3>
      <hr/>
      {#each buildCategory.builds as build}
        <Build buildData={build} />
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
