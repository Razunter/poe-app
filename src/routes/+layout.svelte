<script lang='ts'>
  import Header from '$components/LayoutHeader.svelte'
  import Sidebar from '$components/Sidebar.svelte'
  import '$css/app.scss'
  import {setContext} from 'svelte'
  import {writable} from 'svelte/store'

  const filters = writable<{ showOutdated: boolean }>({
    showOutdated: false,
  })

  setContext('filters', filters)
</script>

<div class='page'>
  <Header/>

  <Sidebar/>

  <main>
    <slot/>
  </main>
</div>

<style lang='scss' global>
  .page {
    display: grid;
    grid-template-columns: 18rem auto;
    padding-top: .5rem;

    > header {
      grid-column: 1 / span 2;
      grid-row: 1;
    }

    > .sidebar {
      grid-column: 1;
      grid-row: 2;
    }

    > main {
      grid-column: 2;
      grid-row: 2;
    }
  }
</style>
