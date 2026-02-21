<script setup lang="ts">
import type { HTMLAttributes } from 'vue'
import { Input } from '@/components/ui/input'

defineProps<{
  icon: string
  placeholder: string
  modelValue: string
  invalid?: boolean
  removeAriaLabel: string
  inputAttrs?: HTMLAttributes & Record<string, unknown>
}>()

const emit = defineEmits<{
  (e: 'update:modelValue', value: string): void
  (e: 'remove'): void
}>()
</script>

<template>
  <div class="relative flex w-full items-center gap-1">
    <Icon
      :name="icon"
      class="size-4 shrink-0 ml-3"
      :class="invalid ? 'text-destructive' : 'text-muted-foreground'"
    />
    <Input
      v-bind="inputAttrs"
      :model-value="modelValue"
      type="url"
      :placeholder="placeholder"
      data-slot="input-group-control"
      class="min-h-9 flex-1 rounded-none border-0 bg-transparent py-2 pr-8 shadow-none focus-visible:ring-0 focus-visible:ring-transparent ring-offset-transparent dark:bg-transparent"
      :class="{ 'aria-invalid text-destructive': invalid }"
      @update:model-value="emit('update:modelValue', String($event ?? ''))"
    />
    <button
      type="button"
      class="remove-row-btn absolute top-1/2 right-1 z-10 -translate-y-1/2 rounded-xl p-1 transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60 w-[24px] h-[24px]"
      :aria-label="removeAriaLabel"
      tabindex="0"
      @click="emit('remove')"
    >
      <Icon name="lucide:x" class="size-4 mb-1" />
    </button>
  </div>
</template>
