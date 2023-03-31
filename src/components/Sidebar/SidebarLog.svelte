<script lang="ts">
  import SidebarWrap from '$components/Sidebar/SidebarWrap.svelte'
  import {getContext} from 'svelte'
  import type {Writable} from 'svelte/store'
  import type {LogType} from '$lib/stores'

  let className: string
  export {className as class}

  const log = getContext<Writable<LogType>>('log')
  let logKeys: Array<[Date, string]>
  $: logKeys = Array.from($log)
</script>

<SidebarWrap class={className} stretch>
  <div class='card-header'>
    <h4 class='card-title mb-0'>Log</h4>
  </div>
  <div class='card-body'>
    <ul>
      {#each logKeys as logKey}
        <li>
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
</style>
