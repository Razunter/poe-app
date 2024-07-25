<script lang="ts">
  import '$css/app.scss'
  import Header from '$components/LayoutHeader.svelte'
  import Sidebar from '$components/Sidebar/Sidebar.svelte'
  import SidebarLog from '$components/Sidebar/SidebarLog.svelte'
  import {
    allPoeVersions,
    buildList,
    type BuildsDataType,
    buildTypes,
    currentPoeVersion,
  } from '$lib/BuildsData.svelte.ts'

  // eslint-disable-next-line prefer-const
  let { data, children }: { data: { buildsData: BuildsDataType }; children: Function } = $props()

  buildList.set(data.buildsData.buildList)
  buildTypes.set(data.buildsData.types)
  allPoeVersions.set(data.buildsData.versions)
  currentPoeVersion.set(data.buildsData.currentVersion)
</script>

<div class="page">
  <Header class="page__header" />

  <Sidebar class="sidebar--left" />

  <main class="page__main">
    {@render children()}
  </main>

  <SidebarLog class="sidebar--right" />
</div>

<style lang="scss">
  @import 'bootstrap/scss/functions';
  @import 'src/css/variables.scss';
  @import 'bootstrap/scss/variables';

  .page {
    display: grid;
    grid-template-columns: 18rem auto minmax(18rem, 24rem);
    padding-top: var(--poeapp-header-height);

    :global(.page__header) {
      grid-column: 1 / span 3;
      grid-row: 1;
    }

    :global(.page__main) {
      grid-column: 2;
      grid-row: 2;
    }

    :global(.sidebar--left) {
      grid-column: 1;
      grid-row: 2;
    }

    :global(.sidebar--right) {
      grid-column: 3;
      grid-row: 2;
    }
  }
</style>
