<script lang='ts'>
  import Header from '$components/LayoutHeader.svelte'
  import Sidebar from '$components/Sidebar/Sidebar.svelte'
  import '$css/app.scss'
  import {setContext} from 'svelte'
  import {writable} from 'svelte/store'
  import SidebarLog from '$components/Sidebar/SidebarLog.svelte'
  import {log, progressBar, showOutdated} from '$lib/stores'
  import type {BuildsDataClass} from '$lib/BuildsData'

  $showOutdated = false
  setContext('showOutdated', showOutdated)

  $progressBar = 0
  setContext('progressBar', progressBar)

  $log = new Map([[new Date(), 'Init']])
  setContext('log', log)

  const BuildsData = writable<BuildsDataClass>()
  setContext('BuildsData', BuildsData)
</script>

<div class='page'>
  <Header class="page__header"/>

  <Sidebar class="sidebar--left"/>

  <main class="page__main">
    <slot/>
  </main>

  <SidebarLog class="sidebar--right"/>
</div>

<style lang='scss'>
  .page {
    display: grid;
    grid-template-columns: 18rem auto minmax(18rem, 24rem);
    padding-top: .5rem;

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
