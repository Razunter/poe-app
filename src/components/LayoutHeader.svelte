<script lang="ts">
  import { Nav, Navbar, NavItem, NavLink } from '@sveltestrap/sveltestrap'
  import { buildList } from '$lib/BuildsData.svelte.ts'
  import { capitalizeFirstLetter } from '$lib/capitalizeFirstLetter.ts'
  import { onMount } from 'svelte'

  const { class: className }: { class?: string } = $props()

  onMount(async () => {
    const { ScrollSpy } = await import('bootstrap-esm')
    void new ScrollSpy(document.body, {
      target: '#anchors-navbar',
    })
  })
</script>

<header class={className}>
  <h1 class="display-3 text-center">Razunter's PoE Starters Collection Editor</h1>
  <Navbar
    id="anchors-navbar"
    fixed="top"
    expand={true}
    theme="dark"
    class="bg-dark border-bottom"
  >
    <Nav
      underline
      class="w-100 justify-content-center"
    >
      {#each $buildList as buildCategory}
        <NavItem>
          <NavLink href="#{buildCategory.type}">
            {capitalizeFirstLetter(buildCategory.type)}
          </NavLink>
        </NavItem>
      {/each}
    </Nav>
  </Navbar>
</header>
