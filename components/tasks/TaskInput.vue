<script setup lang="ts">
import { ArrowUpIcon } from 'lucide-vue-next'
import { InputGroupButton } from '@/components/ui/input-group'
import TaskFormFields from './TaskFormFields.vue'
import { useTaskForm, type TaskForm } from '@/composables/useTaskForm'
import { useI18n } from 'vue-i18n'

export type { TaskForm }

const emit = defineEmits<{
  (e: 'submit', taskForm: TaskForm): void
}>()

const { t } = useI18n()
const form = useTaskForm(f => emit('submit', f))
</script>

<template>
  <TaskFormFields :form="form">
    <template #submit="{ isSubmitDisabled }">
      <InputGroupButton
        type="submit"
        variant="default"
        class="rounded-full"
        size="icon-xs"
        :disabled="isSubmitDisabled"
      >
        <ArrowUpIcon class="size-4" />
        <span class="sr-only">{{ t('task.send') }}</span>
      </InputGroupButton>
    </template>
  </TaskFormFields>
</template>
