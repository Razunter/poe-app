<script lang="ts" module>
  import { cn, type WithElementRef } from '#lib/utils.js'
  import type { HTMLAnchorAttributes, HTMLButtonAttributes } from 'svelte/elements'
  import { tv, type VariantProps } from 'tailwind-variants'

  export const buttonVariants = tv({
    base: "inline-flex min-h-8 min-w-8 shrink-0 items-center gap-2 rounded-sm border border-transparent font-semibold whitespace-nowrap cursor-pointer outline-none transition-[background-color,border-color,color] duration-150 focus-visible:outline-solid focus-visible:outline-2 focus-visible:outline-offset-3 focus-visible:outline-button-accent aria-invalid:border-destructive disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
    variants: {
      variant: {
        default: 'border-button-accent/60 bg-button-primary text-button-accent hover:bg-button-primary-hover',
        success: 'border-button-success/60 bg-button-success-surface text-button-success hover:bg-button-success-hover',
        white: 'border-button-border bg-transparent text-button-foreground hover:border-button-accent hover:bg-button',
        destructive: 'border-button-danger/60 bg-button-danger-surface text-button-danger hover:bg-button-danger-hover',
        outline:
          'border-button-border bg-transparent text-button-foreground hover:border-button-accent hover:bg-button',
        secondary: 'border-button-border bg-button text-button-foreground hover:bg-button-hover',
        ghost: 'bg-transparent text-button-foreground hover:bg-button',
        link: 'bg-transparent text-button-accent underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-9 px-4 py-2 has-[>svg]:px-3',
        sm: 'h-8 gap-1.5 px-3 has-[>svg]:px-2.5',
        lg: 'h-10 px-6 has-[>svg]:px-4',
        xl: 'h-12 px-6 text-lg leading-6 has-[>svg]:px-4',
        icon: 'size-9',
        'icon-sm': 'size-8',
        'icon-lg': 'size-10',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  })

  export type ButtonVariant = VariantProps<typeof buttonVariants>['variant']
  export type ButtonSize = VariantProps<typeof buttonVariants>['size']

  export type ButtonProps = WithElementRef<HTMLButtonAttributes> &
    WithElementRef<HTMLAnchorAttributes> & {
      variant?: ButtonVariant
      size?: ButtonSize
    }
</script>

<script lang="ts">
  let {
    class: className,
    variant = 'default',
    size = 'default',
    ref = $bindable(null),
    href,
    type = 'button',
    disabled,
    children,
    ...restProps
  }: ButtonProps = $props()
</script>

{#if href}
  <a
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    href={disabled ? undefined : href}
    aria-disabled={disabled}
    role={disabled ? 'link' : undefined}
    tabindex={disabled ? -1 : undefined}
    {...restProps}
  >
    {@render children?.()}
  </a>
{:else}
  <button
    bind:this={ref}
    data-slot="button"
    class={cn(buttonVariants({ variant, size }), className)}
    {type}
    {disabled}
    {...restProps}
  >
    {@render children?.()}
  </button>
{/if}
