<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TaskInput, { type TaskForm } from './TaskInput.vue'
import type { Task } from '@/types'
import { useI18n } from 'vue-i18n'

const props = defineProps<{
  task: Task
  open: boolean
  /** When set, modal uses this width (e.g. width of the clicked TaskItem) */
  sourceWidth?: number
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', form: TaskForm): void
}>()

const { t } = useI18n()

const taskInitial = computed<Partial<TaskForm>>(() => ({
  title: props.task.title,
  description: props.task.description ?? '',
  taskStatus: props.task.status,
  gitUrl: props.task.gitUrl ?? '',
  jiraUrl: props.task.jiraUrl ?? '',
  externalUrl: props.task.externalUrl ?? '',
}))

const handleSave = (form: TaskForm) => {
  emit('save', form)
  emit('update:open', false)
}
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent
      data-tour="task-edit-modal"
      class="gap-0 p-0 flex flex-col"
      :class="{ 'max-w-xl': !sourceWidth }"
      :style="[
        { maxHeight: 'calc(100dvh - 2rem)' },
        sourceWidth ? { width: sourceWidth + 'px', maxWidth: sourceWidth + 'px' } : {},
      ]"
    >
      <DialogHeader class="shrink-0">
        <DialogTitle>{{ t('task.editModalTitle') }}</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col flex-1 min-h-0 overflow-hidden px-4 pb-4 pt-1">
        <TaskInput
          :key="task.id"
          :initial="taskInitial"
          fill-height
          submit-mode="save"
          @save="handleSave"
        />
      </div>
    </DialogContent>
  </Dialog>
</template>
