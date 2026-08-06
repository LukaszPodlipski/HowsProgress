<script setup lang="ts">
import { useMediaQuery } from '@vueuse/core'
import { ArrowUpIcon } from 'lucide-vue-next'
import { InputGroupButton } from '@/components/ui/input-group'
import TaskFormFields from './TaskFormFields.vue'
import { useTaskForm, type TaskForm } from '@/composables/useTaskForm'
import {
  shortcutKbdClass,
  getShortcutModLabel,
  getShortcutModAriaLabel,
} from '@/lib/keyboard-shortcuts'
import { useI18n } from 'vue-i18n'

export type { TaskForm }

const props = withDefaults(
  defineProps<{
    initial?: Partial<TaskForm>
    fillHeight?: boolean
    submitMode?: 'send' | 'save'
  }>(),
  {
    initial: undefined,
    fillHeight: false,
    submitMode: 'send',
  }
)

const emit = defineEmits<{
  (e: 'submit' | 'save', taskForm: TaskForm): void
}>()

const { t } = useI18n()
const isDesktop = useMediaQuery('(min-width: 769px)')
const shortcutModLabel = getShortcutModLabel()
const shortcutModAria = getShortcutModAriaLabel()

const form = useTaskForm(
  taskForm => {
    if (props.submitMode === 'save') emit('save', taskForm)
    else emit('submit', taskForm)
  },
  props.initial,
  { resetOnSubmit: props.submitMode !== 'save' }
)

const applySuggestion = (text: string) => {
  form.title.value = text
  nextTick(() => {
    const input = document.querySelector<HTMLTextAreaElement>('.scroll-list__input textarea')
    input?.focus()
  })
}

defineExpose({ applySuggestion })
</script>

<template>
  <TaskFormFields :form="form" :fill-height="fillHeight" show-add-element-shortcuts>
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
            :aria-label="
              submitMode === 'save'
                ? t('task.saveShortcutAriaLabel', { mod: shortcutModAria })
                : t('task.submitShortcutAriaLabel', { mod: shortcutModAria })
            "
          >
            <kbd :class="shortcutKbdClass">{{ shortcutModLabel }}</kbd>
            <span class="text-[10px] text-muted-foreground">+</span>
            <kbd :class="shortcutKbdClass">S</kbd>
          </span>
        </Transition>
        <InputGroupButton
          v-if="submitMode === 'send'"
          type="submit"
          variant="default"
          class="rounded-full"
          size="icon-xs"
          :disabled="isSubmitDisabled"
        >
          <ArrowUpIcon class="size-4" />
          <span class="sr-only">{{ t('task.send') }}</span>
        </InputGroupButton>
        <InputGroupButton
          v-else
          type="submit"
          variant="default"
          class="gap-1.5 rounded-full px-3"
          size="sm"
          :disabled="isSubmitDisabled"
        >
          {{ t('task.save') }}
        </InputGroupButton>
      </div>
    </template>
  </TaskFormFields>
</template>
