<script lang="ts">
  import { onMount, type Snippet } from 'svelte'

  let sidebarElement = $state<HTMLElement>()
  let sidebarTop: number | undefined = $state()

  type Props = {
    class?: string
    stretch?: boolean
    children?: Snippet
    title?: string
  }

  let { class: className = 'sidebar', stretch = false, children, title }: Props = $props()

  onMount(() => {
    const observer = new ResizeObserver((event) => {
      const clientRect = event[0].target.getBoundingClientRect()
      sidebarTop = clientRect.top > 0 ? clientRect.top : 0
    })

    if (sidebarElement) {
      observer.observe(sidebarElement)

      window.addEventListener('scroll', () => {
        if (sidebarElement) {
          const clientRectTop = sidebarElement.getBoundingClientRect().top
          sidebarTop = clientRectTop > 0 ? clientRectTop : 0
        }
      })
    }
  })
</script>

<aside bind:this={sidebarElement} class="relative {className}" class:overflow-auto={stretch}>
  <div
    class="bg-gray-800 rounded-lg p-4 sticky"
    style={stretch && sidebarTop !== undefined
      ? `height: calc(100vh - ${sidebarTop}px); top: calc(4rem + 1rem);`
      : 'top: calc(4rem + 1rem);'}
  >
    {#if title}
      <header class="bg-gray-800 rounded-t-lg px-4 pb-4 border-b border-gray-700">
        <h4 class="text-lg font-semibold text-white m-0">{title}</h4>
      </header>
    {/if}
    {@render children?.()}
  </div>
</aside>
