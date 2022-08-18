<script lang='ts'>
  import type { BuildsData } from '$lib/BuildsData'

  export let data
  export let buildData = data.buildData as BuildsData
</script>

<svelte:head>
    <title>Razunter's PoE Starters Collection Editor</title>
    <meta name='description' content="Editor GUI for Razunter's PoE Starters Collection" />
</svelte:head>

<template>
    <section>Buildlist</section>
    {buildData.currentVersion}
</template>

<style>
</style>
