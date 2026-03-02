<script lang="ts">
  import { cn, type WithoutChildrenOrChild } from '$lib/utils.js'
  import CheckIcon from '@iconify/icons-mdi/check'
  import MinusIcon from '@iconify/icons-mdi/minus'
  import Icon from '@iconify/svelte'
  import { Checkbox as CheckboxPrimitive } from 'bits-ui'

  let {
    ref = $bindable(null),
    checked = $bindable(false),
    indeterminate = $bindable(false),
    class: className,
    ...restProps
  }: WithoutChildrenOrChild<CheckboxPrimitive.RootProps> = $props()
</script>

<CheckboxPrimitive.Root
  bind:ref
  data-slot="checkbox"
  class={cn(
    'bg-gray-900 border-gray-600 text-white data-[state=checked]:bg-gray-800 data-[state=checked]:border-gray-700 focus-visible:border-ring focus-visible:ring-ring/50 aria-invalid:ring-destructive/20 aria-invalid:border-destructive peer flex size-4 shrink-0 items-center justify-center rounded-[4px] border outline-none focus-visible:ring-[3px] disabled:cursor-not-allowed disabled:opacity-50',
    className,
  )}
  bind:checked
  bind:indeterminate
  {...restProps}
>
  {#snippet children({ checked, indeterminate })}
    <div data-slot="checkbox-indicator" class="text-current transition-none">
      {#if checked}
        <Icon icon={CheckIcon} class="size-3.5" />
      {:else if indeterminate}
        <Icon icon={MinusIcon} class="size-3.5" />
      {/if}
    </div>
  {/snippet}
</CheckboxPrimitive.Root>
