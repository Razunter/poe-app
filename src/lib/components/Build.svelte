<script lang="ts">
  import { buildsData } from '$lib/BuildsData.svelte.ts'
  import BuildEditModal from '$lib/components/BuildEditModal.svelte'
  import { Button } from '$lib/components/ui/button'
  import type { Build } from '$lib/schema/Build.schema.ts'
  import deleteIcon from '@iconify/icons-mdi/delete'
  import pencilIcon from '@iconify/icons-mdi/pencil'
  import pinIcon from '@iconify/icons-mdi/pin'
  import Icon from '@iconify/svelte'

  const { buildData, outdated }: { buildData: Build; outdated: boolean } = $props()

  let editModalOpen = $state(false)

  const deleteBuild = () => {
    // eslint-disable-next-line no-alert
    if (!window.confirm('Confirm deletion?')) {
      return
    }

    let buildIndex = -1
    let categoryIndex: number | undefined

    for (const buildCategory of buildsData.buildList.keys()) {
      buildIndex = buildsData.buildList[buildCategory].builds.findIndex((build) => {
        return build.url === buildData.url
      })

      if (buildIndex >= 0) {
        categoryIndex = buildCategory
        break
      }
    }

    if (buildIndex >= 0 && categoryIndex !== undefined) {
      buildsData.buildList[categoryIndex].builds.splice(buildIndex, 1)
    }
  }
</script>

<article
  class={[
    'bg-gray-800 rounded-lg mb-4 p-4 grid gap-8 grid-cols-[240px_1fr_auto] border border-dashed border-gray-500',
    outdated && 'opacity-60',
    buildData.skip && 'border-2 border-yellow-500',
  ]}
>
  <div class="w-60 aspect-video overflow-hidden flex items-center bg-black rounded-l">
    {#if buildData.videothumb?.['480w']}
      <img src={buildData.videothumb['480w']} class="w-full h-auto rounded-l" alt={buildData.title} loading="lazy" />
    {/if}
  </div>
  <div class="flex flex-col justify-between">
    <div>
      <h4 class="text-white text-lg font-semibold mb-2">
        {#if buildData.author}
          <span class="text-gray-400 font-normal">{buildData.author}</span> -
        {/if}
        {buildData.title}
        {#if outdated && buildData.versions.length > 0}
          - <span class="text-yellow-500">
            {buildData.versions.at(-1)}
          </span>
        {/if}
      </h4>
      <div class="text-gray-300 mb-2">
        <a href={buildData.url} target="_blank" title={buildData.title} class="text-blue-400 hover:text-blue-300"
          >{buildData.url}</a
        >
      </div>
    </div>
    <div class="text-gray-500 text-sm flex gap-4">
      {#each ['480w', '640w', '1280w'] as size (size)}
        <span class:text-green-500={buildData.videothumb && Object.hasOwn(buildData.videothumb, size)}>{size}</span>
      {/each}
      <span class:text-green-500={buildData.pin}>
        <Icon icon={pinIcon} />
      </span>
      {#if buildData.skip}
        <span class="text-yellow-500">Skipped</span>
      {/if}
    </div>
  </div>
  <div class="flex flex-col gap-2 justify-center">
    <Button
      onclick={() => {
        editModalOpen = true
      }}
    >
      <Icon icon={pencilIcon} class="w-5 h-5" />
      <span>Edit</span>
    </Button>
    <Button variant="destructive" onclick={deleteBuild}>
      <Icon icon={deleteIcon} class="w-5 h-5" />
      <span>Delete</span>
    </Button>
  </div>
</article>
{#if editModalOpen}
  <BuildEditModal bind:modalOpen={editModalOpen} buildUrl={buildData.url} />
{/if}
