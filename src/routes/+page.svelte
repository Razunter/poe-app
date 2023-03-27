<script lang='ts'>
  import Build from '$components/Build.svelte'
  import type { BuildsDataType} from '$lib/BuildsData'
  import {BuildsData, BuildsDataClass} from '$lib/BuildsData'

  export let data: {buildData: BuildsDataType}
  $BuildsData = new BuildsDataClass(data.buildData)
</script>

<svelte:head>
    <title>Razunter's PoE Starters Collection Editor</title>
    <meta name='description' content="Editor GUI for Razunter's PoE Starters Collection" />
</svelte:head>

<template>
    <section>Buildlist</section>
    {#each $BuildsData.buildList as buildCategory}
        <h2>{buildCategory.type}</h2>
        {#each buildCategory.builds as build}
            <Build buildData={build} authors={$BuildsData.authors} />
        {/each}
    {/each}
</template>

<style>
</style>
