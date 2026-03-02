<script lang="ts">
  import '$css/app.css'
  import { loadData } from '$lib/api/load.remote.ts'
  import { buildsData } from '$lib/BuildsData.svelte.ts'
  import Header from '$lib/components/LayoutHeader.svelte'
  import Sidebar from '$lib/components/Sidebar/Sidebar.svelte'
  import SidebarLog from '$lib/components/Sidebar/SidebarLog.svelte'
  import type { Snippet } from 'svelte'

  let { children }: { children: Snippet } = $props()

  const loadedData = await loadData()
  buildsData.buildList = loadedData.buildList
  buildsData.types = loadedData.types
  buildsData.currentVersion = loadedData.currentVersion
  buildsData.versions = loadedData.versions
</script>

<div class="min-h-screen bg-gray-900">
  <Header />

  <div class="flex gap-5 p-5">
    <aside class="w-72 hidden lg:block">
      <Sidebar />
    </aside>

    <main class="flex-1">
      {@render children()}
    </main>

    <aside class="w-72 hidden xl:block">
      <SidebarLog />
    </aside>
  </div>
</div>
