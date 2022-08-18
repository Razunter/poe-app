<script lang='ts'>
  import Build from '$components/Build.svelte'
  import { BuildsData } from '$lib/BuildsData'

  export let data
  export let buildsData = new BuildsData(data.buildData)
</script>

<svelte:head>
    <title>Razunter's PoE Starters Collection Editor</title>
    <meta name='description' content="Editor GUI for Razunter's PoE Starters Collection" />
</svelte:head>

<template>
    <section>Buildlist</section>
    {#each buildsData.buildList as buildCategory}
        <h2>{buildCategory.type}</h2>
        {#each buildCategory.builds as build}
            <Build buildData={build} authors={buildsData.authors} />
        {/each}
    {/each}
</template>

<style>
</style>
