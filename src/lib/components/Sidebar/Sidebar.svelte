<script lang="ts">
  import { buildsData } from '$lib/BuildsData.svelte.ts'
  import { exportBuilds } from '$lib/BuildsProcessing/exportBuilds.ts'
  import { randomizeBuildsOrder } from '$lib/BuildsProcessing/randomizeBuildsOrder.svelte.ts'
  import { removeOutdatedBuilds } from '$lib/BuildsProcessing/removeOutdatedBuilds.ts'
  import { sortBuilds } from '$lib/BuildsProcessing/sortBuilds.ts'
  import { updateBuilds } from '$lib/BuildsProcessing/updateBuilds.svelte.ts'
  import SettingsModal from '$lib/components/SettingsModal.svelte'
  import SidebarWrap from '$lib/components/Sidebar/SidebarWrap.svelte'
  import { Button } from '$lib/components/ui/button/index.ts'
  import { Progress } from '$lib/components/ui/progress'
  import { progressBar, showOutdated } from '$lib/stores.ts'
  import accessPointNetwork from '@iconify/icons-mdi/access-point-network'
  import cogIcon from '@iconify/icons-mdi/cog'
  import contentSave from '@iconify/icons-mdi/content-save'
  import rotate3dVariant from '@iconify/icons-mdi/rotate-3d-variant'
  import sortAscending from '@iconify/icons-mdi/sort-ascending'
  import vacuumIcon from '@iconify/icons-mdi/vacuum'
  import Icon from '@iconify/svelte'

  const { class: className }: { class?: string } = $props()

  let showSettings = $state(false)
</script>

<SidebarWrap class={className} title="Actions">
  <div class="p-4 space-y-3">
    <Button
      class="w-full justify-center"
      variant="white"
      size="xl"
      onclick={() => {
        showSettings = true
      }}
    >
      <Icon icon={cogIcon} class="size-5" />
      <span>Settings</span>
    </Button>
    {#if showSettings}
      <SettingsModal bind:modalOpen={showSettings} />
    {/if}
    <hr class="border-gray-600" />
    <div class="grid gap-2">
      <Button
        class="w-full justify-center"
        size="xl"
        onclick={async () => {
          await updateBuilds()
          sortBuilds()
        }}
      >
        <Icon icon={accessPointNetwork} class="size-5" />
        <span>Sync builds</span>
      </Button>
      <Progress value={$progressBar} />
      <Button
        class="w-full justify-center"
        size="xl"
        onclick={() => {
          sortBuilds()
        }}
      >
        <Icon icon={sortAscending} class="size-5" />
        <span>Sort builds</span>
      </Button>
      <Button
        class="w-full justify-center"
        size="xl"
        onclick={() => {
          randomizeBuildsOrder()
          sortBuilds()
        }}
      >
        <Icon icon={rotate3dVariant} class="size-5" />
        <span>Randomize order</span>
      </Button>
      <Button
        class="w-full justify-center"
        size="xl"
        onclick={() => {
          removeOutdatedBuilds()
        }}
      >
        <Icon icon={vacuumIcon} class="size-5" />
        <span>Cleanup outdated</span>
      </Button>
      <hr class="border-gray-600" />
      <Button
        class="w-full justify-center"
        variant="success"
        size="xl"
        onclick={() => {
          void exportBuilds($state.snapshot(buildsData))
        }}
      >
        <Icon icon={contentSave} class="size-5" />
        <span>Save</span>
      </Button>
    </div>
  </div>
  <div class="p-4 bg-gray-800 rounded-b-lg border-t border-gray-700">
    <h4 class="text-lg font-semibold text-white mb-3">Filters:</h4>
    <label class="flex items-center gap-2 text-white cursor-pointer">
      <input type="checkbox" bind:checked={$showOutdated} class="w-4 h-4 rounded" />
      <span>Show outdated</span>
    </label>
  </div>
</SidebarWrap>
