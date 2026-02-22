<script setup lang="ts">
import { Dialog, DialogContent } from '@/components/ui/dialog'
import type { Task } from '@/types'
import TaskItem from './TaskItem.vue'

defineProps<{
  task: Task
  open: boolean
  /** When set, modal uses this width (e.g. width of the clicked TaskItem) */
  sourceWidth?: number
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'edit' | 'remove', taskId: string): void
}>()
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      class="gap-0 border-0 bg-transparent p-0 shadow-none"
      :class="{ 'max-w-xl': !sourceWidth }"
      :style="sourceWidth ? { width: sourceWidth + 'px', maxWidth: sourceWidth + 'px' } : undefined"
      :hide-close-button="true"
    >
      <TaskItem
        :task="task"
        :clickable="false"
        :description-always-expanded="true"
        :show-close-button="true"
        @close="emit('update:open', false)"
        @edit="emit('edit', $event)"
        @remove="emit('remove', $event)"
      />
    </DialogContent>
  </Dialog>
</template>
