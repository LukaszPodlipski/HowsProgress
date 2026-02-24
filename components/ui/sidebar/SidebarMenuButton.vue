<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Primitive, type PrimitiveProps } from 'reka-ui'
import { cn } from '@/lib/utils'
import { sidebarMenuButtonVariants, type SidebarMenuButtonVariants } from './variants'

defineOptions({ inheritAttrs: false })

const props = withDefaults(
  defineProps<
    PrimitiveProps & {
      class?: HTMLAttributes['class']
      variant?: SidebarMenuButtonVariants['variant']
      size?: SidebarMenuButtonVariants['size']
      isActive?: boolean
    }
  >(),
  {
    as: 'button',
    variant: 'default',
    size: 'default',
    class: undefined,
  }
)
</script>

<template>
  <Primitive
    data-sidebar="menu-button"
    data-slot="sidebar-menu-button"
    :as="as"
    :as-child="asChild"
    :data-active="isActive"
    :class="cn(sidebarMenuButtonVariants({ variant, size }), props.class)"
    v-bind="$attrs"
  >
    <slot />
  </Primitive>
</template>
