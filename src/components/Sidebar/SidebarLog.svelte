<script lang="ts">
  import SidebarWrap from '$components/Sidebar/SidebarWrap.svelte'
  import { log } from '$lib/stores.ts'

  let { class: className }: { class?: string } = $props()

  let logKeys: Array<[Date, string]> = $derived(Array.from($log).reverse())
</script>

<SidebarWrap
  class={className}
  stretch
>
  <div class="card-header">
    <h4 class="card-title mb-0">Log</h4>
  </div>
  <div class="card-body">
    <ul class="list-group list-group-flush">
      {#each logKeys as logKey}
        <li class="list-group-item">
          <span class="time">
            {new Intl.DateTimeFormat('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(logKey[0])}
          </span>
          <span class="message">
            {@html logKey[1]}
          </span>
        </li>
      {/each}
    </ul>
  </div>
</SidebarWrap>

<style lang="scss">
  .card-header {
    position: sticky;
    top: 0;
    z-index: 1;
  }

  .card-body {
    padding: 0;
  }
</style>
