<script lang="ts">
  import { onMount, type Snippet } from 'svelte'

  let sidebarElement = $state<HTMLElement>()

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
    })

    if (sidebarElement) {
      observer.observe(sidebarElement)

      window.addEventListener('scroll', () => {
        if (sidebarElement) {
          const clientRectTop = sidebarElement.getBoundingClientRect().top
        }
      })
    }
  })
</script>

<aside bind:this={sidebarElement} class="relative {className}">
  <div
    class="bg-gray-800 rounded-lg p-4 sticky"
    class:overflow-auto={stretch}
    style={stretch ? `height: calc(100dvh - var(--poe-navbar-height, 0) - 40px);` : ''}
    style:top="calc(var(--poe-navbar-height, 0) + 20px);"
  >
    {#if title}
      <header class="bg-gray-800 rounded-t-lg px-4 pb-4 border-b border-gray-700">
        <h4 class="text-lg font-semibold text-white m-0">{title}</h4>
      </header>
    {/if}
    {@render children?.()}
  </div>
</aside>
