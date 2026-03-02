<script lang="ts">
  import { buildsData } from '$lib/BuildsData.svelte.ts'
  import { capitalizeFirstLetter } from '$lib/capitalizeFirstLetter.ts'
  import { useDebounce, useIntersectionObserver } from 'runed'
  import { onMount } from 'svelte'

  const { class: className }: { class?: string } = $props()

  let scrollY = $state(0)
  let navbarY = $state(0)
  let navbarElement = $state<HTMLElement>()
  let headerElement = $state<HTMLElement>()
  let headerElementHeight = $state(0)
  let navbarElementHeight = $state(0)
  let activeNavItemID = $state<string>()

  const onScroll = (event: UIEvent): void => {
    requestAnimationFrame(() => {
      navbarY = Math.max(0, headerElementHeight - scrollY)
    })
  }

  const setHeights = () => {
    headerElementHeight = headerElement?.getBoundingClientRect().height ?? 0
    navbarY = Math.max(0, headerElementHeight - scrollY)
    navbarElementHeight = navbarElement?.getBoundingClientRect().height ?? 0
    document.body.style.setProperty('--poe-navbar-height', Math.ceil(navbarElementHeight) + 'px')
  }

  onMount(() => {
    setHeights()
  })

  useIntersectionObserver(
    () => [...document.querySelectorAll<HTMLElement>('section.build-category')],
    (entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) {
          const target = entry.target as HTMLElement
          activeNavItemID = target.id
          break
        }
      }
    },
  )
</script>

<svelte:window bind:scrollY onscroll={onScroll} onresize={useDebounce(setHeights, 100)} />

<header class={className}>
  <h1
    bind:this={headerElement}
    class="py-4 text-4xl font-bold text-center text-white"
    style:margin-bottom="{navbarElementHeight}px"
  >
    Razunter's PoE Starters Collection Editor (v{buildsData.currentVersion})
  </h1>
  <nav
    bind:this={navbarElement}
    id="anchors-navbar"
    class="bg-gray-800 border-b border-gray-700 fixed w-full z-10"
    style="top: {navbarY}px"
  >
    <ul class="flex flex-wrap justify-center gap-4 py-2 px-4 w-full max-w-7xl mx-auto">
      {#each buildsData.buildList as buildCategory (buildCategory.type)}
        <li>
          <a
            href="#{buildCategory.type}"
            class={[
              'text-white hover:underline focus-visible:underline transition-colors px-3 py-1',
              activeNavItemID === buildCategory.type && 'underline decoration-2',
            ]}
          >
            {capitalizeFirstLetter(buildCategory.type)}
          </a>
        </li>
      {/each}
    </ul>
  </nav>
</header>
