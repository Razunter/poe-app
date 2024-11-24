<script lang="ts">
  import { onMount, type Snippet } from 'svelte'

  type Props = {
    class?: string
    stretch?: boolean
    children?: Snippet
  }

  let sidebarElement: HTMLElement | undefined = $state()
  let sidebarTop: number | undefined = $state()

  const { class: className = 'sidebar', stretch = false, children }: Props = $props()

  onMount(() => {
    if (!sidebarElement) {
      return
    }

    const observer = new ResizeObserver((event) => {
      const clientRect = event[0].target.getBoundingClientRect()
      sidebarTop = clientRect.top > 0 ? clientRect.top : 0
    })

    observer.observe(sidebarElement)

    window.addEventListener('scroll', () => {
      if (sidebarElement) {
        const clientRectTop = sidebarElement.getBoundingClientRect().top
        sidebarTop = clientRectTop > 0 ? clientRectTop : 0
      }
    })
  })
</script>

<aside
  bind:this={sidebarElement}
  class={'sidebar' + (className ? ' ' + className : '')}
  class:sidebar--stretch={stretch}
>
  <div
    class="card sidebar__content"
    style={stretch && sidebarTop !== undefined ? `height: calc(100vh - ${sidebarTop}px);` : ''}
  >
    {@render children?.()}
  </div>
</aside>

<style lang="scss">
  .sidebar {
    padding-left: var(--bs-grid-gutter-width-half);
    padding-right: var(--bs-grid-gutter-width-half);
    position: relative;

    &--stretch {
      .sidebar__content {
        overflow: auto;
      }
    }
  }

  .sidebar__content {
    position: sticky;
    top: calc(var(--poeapp-header-height) + 1rem);
    left: 0;
  }
</style>
