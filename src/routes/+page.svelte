<script lang="ts">
  import Build from '$lib/components/Build.svelte'
  import BuildEditModal from '$lib/components/BuildEditModal.svelte'
  import { buildsData } from '$lib/BuildsData.svelte.ts'
  import { isOutdatedBuild } from '$lib/BuildsProcessing/isOutdatedBuild.ts'
  import { capitalizeFirstLetter } from '$lib/capitalizeFirstLetter.ts'
  import { Button } from '$lib/components/ui/button/index.ts'
  import { showOutdated } from '$lib/stores.ts'
  import circleSmall from '@iconify/icons-mdi/circle-small'
  import plusThick from '@iconify/icons-mdi/plus-thick'
  import Icon from '@iconify/svelte'

  let showAddBuildModal = $state(false)

  let buildType: string | undefined = $state()

  const addBuild = (buildType_?: string) => {
    buildType = buildType_
    showAddBuildModal = true
  }
</script>

<svelte:head>
  <title>Razunter's PoE Starters Collection Editor</title>
  <meta name="description" content="Editor GUI for Razunter's PoE Starters Collection" />
</svelte:head>

<section class="bg-gray-800 rounded-lg">
  <div class="p-4 border-b border-gray-700">
    <h2 class="text-4xl font-bold text-white">Build list</h2>
    {#if showAddBuildModal}
      <BuildEditModal {buildType} bind:modalOpen={showAddBuildModal} />
    {/if}
  </div>
  <div class="p-4">
    {#each buildsData.buildList as buildCategory (buildCategory.type)}
      <section id={buildCategory.type} class="build-category mb-8">
        <header class="flex justify-between items-center mb-4 pe-4">
          <h3 class="text-3xl font-semibold text-white flex items-center">
            <Icon class="icon mr-1" icon={circleSmall} />
            <span>{capitalizeFirstLetter(buildCategory.type)}</span>
          </h3>
          <Button
            variant="success"
            size="lg"
            onclick={() => {
              addBuild(buildCategory.type)
            }}
          >
            <Icon icon={plusThick} class="w-5 h-5" />
            <span>Add build</span>
          </Button>
        </header>
        <hr class="border-gray-600 mb-4" />
        {#each buildCategory.builds as build (build.url)}
          {@const outdated = isOutdatedBuild(build.versions)}
          {#if !outdated || ($showOutdated && outdated)}
            <Build buildData={build} {outdated} />
          {/if}
        {/each}
      </section>
    {/each}
  </div>
</section>

<style>
  .build-category {
    scroll-margin-top: calc(var(--poe-navbar-height, 0) + 0.5lh);
  }
</style>
