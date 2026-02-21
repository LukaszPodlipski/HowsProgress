<script setup lang="ts">
import { CheckIcon } from 'lucide-vue-next'
import { InputGroupButton } from '@/components/ui/input-group'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import TaskFormFields from './TaskFormFields.vue'
import { useTaskForm, type TaskForm } from '@/composables/useTaskForm'
import type { Task } from '@/types'

const props = defineProps<{
  task: Task
  open: boolean
}>()

const emit = defineEmits<{
  (e: 'update:open', value: boolean): void
  (e: 'save', form: TaskForm): void
}>()

const form = useTaskForm(
  f => {
    emit('save', f)
    emit('update:open', false)
  },
  {
    title: props.task.title,
    description: props.task.description ?? '',
    taskStatus: props.task.status,
    gitUrl: props.task.gitUrl ?? '',
    jiraUrl: props.task.jiraUrl ?? '',
    externalLinks: props.task.externalLinks ?? [],
  }
)
</script>

<template>
  <Dialog :open="open" @update:open="emit('update:open', $event)">
    <DialogContent class="max-w-xl gap-0 p-0">
      <DialogHeader>
        <DialogTitle>Edytuj zadanie</DialogTitle>
      </DialogHeader>
      <div class="px-4 pb-4">
        <TaskFormFields :form="form">
          <template #submit="{ isSubmitDisabled }">
            <InputGroupButton
              type="submit"
              variant="default"
              class="gap-1.5 rounded-full px-3"
              size="sm"
              :disabled="isSubmitDisabled"
            >
              <CheckIcon class="size-3.5" />
              Zapisz
            </InputGroupButton>
          </template>
        </TaskFormFields>
      </div>
    </DialogContent>
  </Dialog>
</template>
