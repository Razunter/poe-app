<script lang='ts'>
  import Header from '$components/LayoutHeader.svelte';
  import Sidebar from '$components/Sidebar.svelte';
</script>

<div class='page'>
    <Header />

    <Sidebar />

    <main>
        <slot />
    </main>
</div>

<style lang='scss' global>
  @use "../css/app" as *;

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
