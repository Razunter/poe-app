<script lang="ts">
  import SidebarWrap from '$components/Sidebar/SidebarWrap.svelte'

  let className: string
  export {className as class}
</script>

<SidebarWrap class={className} stretch>
  <div class='card-header'>
    <h4 class='card-title mb-0'>Log</h4>
  </div>
  <div class='card-body'>
  </div>
</SidebarWrap>

<style lang="scss">
  .card-header {
    position: sticky;
    top: 0;
    z-index: 1;
  }
</style>
