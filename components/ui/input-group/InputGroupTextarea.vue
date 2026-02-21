<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { cn } from '@/lib/utils'
import { Textarea } from '@/components/ui/textarea'

const props = defineProps<{
  class?: HTMLAttributes['class']
  placeholder?: string
  modelValue?: string | number
  rows?: number
}>()

const emits = defineEmits<{
  (e: 'update:modelValue', payload: string | number): void
}>()
</script>

<template>
  <Textarea
    data-slot="input-group-control"
    :class="
      cn(
        'flex-1 resize-none rounded-none border-0 bg-transparent py-3 shadow-none focus-visible:ring-0 focus-visible:ring-transparent ring-offset-transparent dark:bg-transparent',
        props.class
      )
    "
    :placeholder="placeholder"
    :rows="rows"
    :model-value="modelValue"
    @update:model-value="emits('update:modelValue', $event)"
  />
</template>
