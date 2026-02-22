<script lang="ts" setup>
import type { ToasterProps } from 'vue-sonner'
import { reactiveOmit } from '@vueuse/core'
import {
  CircleCheckIcon,
  InfoIcon,
  Loader2Icon,
  OctagonXIcon,
  TriangleAlertIcon,
  XIcon,
} from 'lucide-vue-next'
import { Toaster as Sonner } from 'vue-sonner'

/** Toast display duration (s) – used by Toaster and progress bar animation */
const TOAST_DURATION_S = 5

const props = defineProps<ToasterProps>()
const delegatedProps = reactiveOmit(props, 'toastOptions', 'duration')

const toastOptions = computed(() => ({
  classes: {
    toast:
      'toast-with-progress group toast group-[.toaster]:!bg-card group-[.toaster]:!text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg',
    description: 'group-[.toast]:text-muted-foreground',
    actionButton: 'group-[.toast]:bg-destructive/50! group-[.toast]:text-primary-foreground!',
    cancelButton: 'group-[.toast]:bg-muted! group-[.toast]:text-muted-foreground!',
  },
}))
</script>

<template>
  <Sonner
    class="toaster group sonner-dark"
    :duration="TOAST_DURATION_S * 1000"
    :toast-options="toastOptions"
    v-bind="delegatedProps"
  >
    <template #success-icon>
      <CircleCheckIcon class="size-4" />
    </template>
    <template #info-icon>
      <InfoIcon class="size-4" />
    </template>
    <template #warning-icon>
      <TriangleAlertIcon class="size-4" />
    </template>
    <template #error-icon>
      <OctagonXIcon class="size-4" />
    </template>
    <template #loading-icon>
      <div>
        <Loader2Icon class="size-4 animate-spin" />
      </div>
    </template>
    <template #close-icon>
      <XIcon class="size-4" />
    </template>
  </Sonner>
</template>

<style scoped>
.sonner-dark :deep([data-sonner-toaster]) {
  --normal-bg: var(--card);
  --normal-border: var(--border);
  --normal-text: var(--card-foreground);
}
.sonner-dark :deep([data-sonner-toast][data-styled='true'] [data-description]) {
  color: var(--muted-foreground);
}
.sonner-dark :deep([data-sonner-toast][data-styled='true'] [data-close-button]) {
  background: var(--card);
  border-color: var(--border);
  color: var(--card-foreground);
}
.sonner-dark :deep([data-sonner-toast][data-styled='true'] [data-close-button]:hover) {
  background: var(--muted);
  border-color: var(--border);
}
</style>

<!-- Opacity transition + progress bar: unscoped so it applies to vue-sonner DOM -->
<style>
[data-sonner-toaster].sonner-dark {
  opacity: 0.9;
  transition:
    opacity 0.5s ease,
    transform 400ms ease;
}
[data-sonner-toaster].sonner-dark:hover {
  opacity: 1;
}
[data-sonner-toaster].sonner-dark [data-sonner-toast].toast-with-progress[data-styled='true'] {
  position: relative;
  overflow: hidden;
}
[data-sonner-toaster].sonner-dark
  [data-sonner-toast].toast-with-progress[data-styled='true']::after {
  content: '';
  display: block;
  position: absolute;
  bottom: 0;
  left: 0;
  height: 4px;
  width: 100%;
  background: var(--destructive);
  border-radius: 0 0 8px 8px;
  animation: toast-progress-shrink 5s linear forwards;
  transform-origin: left;
  z-index: 10;
  pointer-events: none;
}

@keyframes toast-progress-shrink {
  from {
    width: 100%;
  }
  to {
    width: 0%;
  }
}
</style>
