<script lang="ts">
  import accessPointNetwork from '@iconify/icons-mdi/access-point-network'
  import cogIcon from '@iconify/icons-mdi/cog'
  import contentSave from '@iconify/icons-mdi/content-save'
  import rotate3dVariant from '@iconify/icons-mdi/rotate-3d-variant'
  import sortAscending from '@iconify/icons-mdi/sort-ascending'
  import vacuumIcon from '@iconify/icons-mdi/vacuum'
  import Icon from '@iconify/svelte'
  import SettingsModal from '$components/SettingsModal.svelte'
  import SidebarWrap from '$components/Sidebar/SidebarWrap.svelte'
  import { type BuildsDataWritable } from '$lib/BuildsData'
  import { type WritableLog } from '$lib/stores'
  import { getContext } from 'svelte'
  import { type Writable } from 'svelte/store'
  import { Button, FormGroup, Input, Progress } from 'sveltestrap'

  const showOutdated = getContext<Writable<boolean>>('showOutdated')

  let className: string
  export { className as class }

  let showSettings = false

  const BuildsData = getContext<BuildsDataWritable>('BuildsData')
  const progressBar = getContext<Writable<number>>('progressBar')
  const log = getContext<WritableLog>('log')
</script>

<SidebarWrap class={className}>
  <div class="card-header">
    <h4 class="card-title mb-0">Actions</h4>
  </div>
  <div class="card-body">
    <Button
      color="light"
      size="lg"
      class="btn-icon w-100"
      on:click={() => {
        showSettings = true
      }}
    >
      <span class="btn-icon__inner"
        ><Icon
          icon={cogIcon}
          class="btn-icon__icon"
        /><span class="btn-icon__text">Settings</span></span
      >
    </Button>
    {#if showSettings}
      <SettingsModal bind:modalOpen={showSettings} />
    {/if}
    <hr />
    <div class="d-grid gap-2">
      <Button
        color="primary"
        size="lg"
        class="btn-icon"
        on:click={async () => {
          await $BuildsData.syncBuilds(progressBar, log)
          $BuildsData = $BuildsData.sortBuilds()
        }}
      >
        <span class="btn-icon__inner"
          ><Icon
            icon={accessPointNetwork}
            class="btn-icon__icon"
          /><span class="btn-icon__text">Sync builds</span></span
        >
      </Button>
      <Progress
        color="primary"
        value={$progressBar}
      />
      <Button
        color="primary"
        size="lg"
        class="btn-icon"
        on:click={() => {
          $BuildsData = $BuildsData.sortBuilds()
        }}
      >
        <span class="btn-icon__inner"
          ><Icon
            icon={sortAscending}
            class="btn-icon__icon"
          /><span class="btn-icon__text">Sort builds</span></span
        >
      </Button>
      <Button
        color="primary"
        size="lg"
        class="btn-icon"
        on:click={() => {
          $BuildsData.randomizeOrder()
          $BuildsData = $BuildsData.sortBuilds()
        }}
      >
        <span class="btn-icon__inner"
          ><Icon
            icon={rotate3dVariant}
            class="btn-icon__icon"
          /><span class="btn-icon__text">Randomize order</span></span
        >
      </Button>
      <Button
        color="primary"
        size="lg"
        class="btn-icon"
        on:click={() => {
          $BuildsData = $BuildsData.cleanup(log)
        }}
      >
        <span class="btn-icon__inner"
          ><Icon
            icon={vacuumIcon}
            class="btn-icon__icon"
          /><span class="btn-icon__text">Cleanup outdated</span></span
        >
      </Button>
      <hr />
      <Button
        color="success"
        size="lg"
        on:click={() => {
          $BuildsData.save(log)
        }}
      >
        <span class="btn-icon__inner"
          ><Icon
            icon={contentSave}
            class="btn-icon__icon"
          /><span class="btn-icon__text">Save</span></span
        >
      </Button>
    </div>
  </div>
  <div class="card-footer">
    <h4 class="card-title">Filters:</h4>
    <FormGroup>
      <Input
        id="showOutdated"
        type="switch"
        label="Show outdated"
        bind:checked={$showOutdated}
      />
    </FormGroup>
  </div>
</SidebarWrap>
