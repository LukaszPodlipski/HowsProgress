<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { ArrowUpIcon } from 'lucide-vue-next'
import { InputGroupButton } from '@/components/ui/input-group'
import TaskFormFields from './TaskFormFields.vue'
import { useTaskForm, type TaskForm } from '@/composables/useTaskForm'
import { shortcutKbdClass } from '@/lib/shortcut-kbd'
import { useI18n } from 'vue-i18n'

export type { TaskForm }

const emit = defineEmits<{
  (e: 'submit', taskForm: TaskForm): void
}>()

const { t } = useI18n()
const form = useTaskForm(f => emit('submit', f))
const isDesktop = useMediaQuery('(min-width: 769px)')

const applySuggestion = (text: string) => {
  form.title.value = text
  nextTick(() => {
    const input = document.querySelector<HTMLTextAreaElement>('.scroll-list__input textarea')
    input?.focus()
  })
}

const onContentKeydown = (event: KeyboardEvent) => {
  if (!isDesktop.value) return
  if (!event.altKey || event.key.toLowerCase() !== 's') return
  event.preventDefault()
  if (form.isSubmitDisabled.value) return
  form.handleSubmit(event)
}

defineExpose({ applySuggestion })
</script>

<template>
  <TaskFormFields :form="form" show-add-element-shortcuts @content-keydown="onContentKeydown">
    <template #submit="{ isSubmitDisabled, isTaskContentFocused }">
      <div class="flex items-center gap-2">
        <Transition
          enter-active-class="transition-opacity duration-150 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <span
            v-if="isTaskContentFocused && isDesktop && !isSubmitDisabled"
            class="flex items-center gap-0.5"
            :aria-label="t('task.submitShortcutAriaLabel')"
          >
            <kbd :class="shortcutKbdClass">Alt</kbd>
            <span class="text-[10px] text-muted-foreground">+</span>
            <kbd :class="shortcutKbdClass">S</kbd>
          </span>
        </Transition>
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
      </div>
    </template>
  </TaskFormFields>
</template>
