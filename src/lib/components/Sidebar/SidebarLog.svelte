<script lang="ts">
  import SidebarWrap from '$lib/components/Sidebar/SidebarWrap.svelte'
  import { log } from '$lib/stores.ts'

  let { class: className }: { class?: string } = $props()

  let logKeys: Array<[Date, string]> = $derived([...$log].toReversed())
</script>

<SidebarWrap class={className} stretch title="Log">
  <div class="p-0">
    <ul class="divide-y divide-gray-700">
      {#each logKeys as logKey (logKey)}
        <li class="p-3 bg-gray-800">
          <span class="text-gray-400 text-sm mr-2">
            {new Intl.DateTimeFormat('ru-RU', {
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
            }).format(logKey[0])}
          </span>
          <span class="text-white">
            {@html logKey[1]}
          </span>
        </li>
      {/each}
    </ul>
  </div>
</SidebarWrap>
