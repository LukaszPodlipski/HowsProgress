<script setup lang="ts">
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupText,
  InputGroupTextarea,
} from '@/components/ui/input-group'
import { Separator } from '@/components/ui/separator'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import { PlusIcon } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import TaskInputUrlRow from './TaskInputUrlRow.vue'
import type { useTaskForm } from '@/composables/useTaskForm'
import { AddElementType } from '@/types/enums'
import { shortcutKbdClass } from '@/lib/shortcut-kbd'
import { useEventListener, useMediaQuery } from '@vueuse/core'
import { useI18n } from 'vue-i18n'

const props = withDefaults(
  defineProps<{
    form: ReturnType<typeof useTaskForm>
    fillHeight?: boolean
    showAddElementShortcuts?: boolean
  }>(),
  { showAddElementShortcuts: false }
)

const emit = defineEmits<{
  contentKeydown: [event: KeyboardEvent]
}>()

const { t } = useI18n()

const isTaskContentFocused = ref(false)
const isDesktop = useMediaQuery('(min-width: 769px)')

const isTaskContentField = (target: EventTarget | null) =>
  target instanceof HTMLElement && target.closest('[data-task-content-field]') !== null

const onTaskContentFocusIn = (event: FocusEvent) => {
  if (isTaskContentField(event.target)) {
    isTaskContentFocused.value = true
  }
}

const onTaskContentFocusOut = (event: FocusEvent) => {
  if (isTaskContentField(event.relatedTarget)) return
  isTaskContentFocused.value = false
}

const onFormKeydown = (event: KeyboardEvent) => {
  if (!isTaskContentField(event.target)) return
  emit('contentKeydown', event)
}

const presentation = useProductTourPresentation()
const localAddMenuOpen = ref(false)
const statusMenuOpen = ref(false)

const addElementMenuOpen = computed({
  get: () =>
    presentation.isActive.value ? presentation.addElementMenuOpen.value : localAddMenuOpen.value,
  set: (open: boolean) => {
    if (presentation.isActive.value) {
      presentation.addElementMenuOpen.value = open
    } else {
      localAddMenuOpen.value = open
    }
  },
})

const {
  handleSubmit,
  errors,
  formErrors,
  title,
  titleAttrs,
  description,
  descriptionAttrs,
  taskStatus,
  gitUrl,
  gitUrlAttrs,
  jiraUrl,
  jiraUrlAttrs,
  externalUrl,
  externalUrlAttrs,
  hasDescriptionElement,
  hasGitElement,
  hasJiraElement,
  hasExternalElement,
  hasExtendedContent,
  taskStatusOptions,
  selectedTaskStatus,
  visibleAddElementOptions,
  addElementOptions,
  onAddElement,
  removeGitElement,
  removeJiraElement,
  removeExternalElement,
  cycleTaskStatus,
  isSubmitDisabled,
} = props.form

const TITLE_DESCRIPTION_HINT_MIN_LENGTH = 30
const TITLE_DESCRIPTION_HINT_MAX_LENGTH = 70

const isAddElementMenuExhausted = computed(() => visibleAddElementOptions.value.length === 0)

const titleLength = computed(() => title.value?.trim().length ?? 0)

const showDescriptionShortcutHint = computed(() => {
  if (!props.showAddElementShortcuts || !isDesktop.value || hasDescriptionElement.value) {
    return false
  }
  return (
    titleLength.value >= TITLE_DESCRIPTION_HINT_MIN_LENGTH &&
    titleLength.value <= TITLE_DESCRIPTION_HINT_MAX_LENGTH
  )
})

const canUseAddElementShortcuts = computed(
  () => addElementMenuOpen.value || isTaskContentFocused.value
)

const isAddElementVisible = (type: AddElementType): boolean => {
  if (type === AddElementType.DESCRIPTION) return hasDescriptionElement.value
  if (type === AddElementType.GIT) return hasGitElement.value
  if (type === AddElementType.JIRA) return hasJiraElement.value
  if (type === AddElementType.EXTERNAL) return hasExternalElement.value
  return false
}

const canUseStatusShortcut = computed(
  () =>
    props.showAddElementShortcuts &&
    isDesktop.value &&
    (statusMenuOpen.value || isTaskContentFocused.value)
)

watch(isAddElementMenuExhausted, exhausted => {
  if (exhausted) addElementMenuOpen.value = false
})

const formEl = ref<HTMLFormElement | null>(null)

const focusAddedElement = (type: AddElementType) => {
  nextTick(() => {
    const field = formEl.value?.querySelector<HTMLElement>(`[data-add-element-field="${type}"]`)
    field?.focus()
  })
}

const focusTitleField = () => {
  nextTick(() => {
    const titleField = formEl.value?.querySelector<HTMLElement>(
      '[data-task-content-field]:not([data-add-element-field])'
    )
    titleField?.focus()
  })
}

const isAddElementFieldFocused = (type: AddElementType): boolean => {
  const active = document.activeElement
  if (!(active instanceof HTMLElement) || !formEl.value?.contains(active)) return false
  const field = active.closest(`[data-add-element-field="${type}"]`)
  return field instanceof HTMLElement && formEl.value.contains(field)
}

const removeAddElement = (type: AddElementType) => {
  if (type === AddElementType.DESCRIPTION) hasDescriptionElement.value = false
  else if (type === AddElementType.GIT) removeGitElement()
  else if (type === AddElementType.JIRA) removeJiraElement()
  else if (type === AddElementType.EXTERNAL) removeExternalElement()
}

const handleAddElement = (type: AddElementType) => {
  if (isAddElementVisible(type)) {
    addElementMenuOpen.value = false
    focusAddedElement(type)
    return
  }
  onAddElement(type)
  addElementMenuOpen.value = false
  focusAddedElement(type)
}

const handleAddElementShortcut = (type: AddElementType) => {
  addElementMenuOpen.value = false

  if (isAddElementVisible(type) && isAddElementFieldFocused(type)) {
    removeAddElement(type)
    focusTitleField()
    return
  }

  handleAddElement(type)
}

useEventListener('keydown', (event: KeyboardEvent) => {
  if (!props.showAddElementShortcuts || !isDesktop.value) return
  if (!event.altKey || event.ctrlKey || event.metaKey) return

  if (canUseStatusShortcut.value && event.key.toLowerCase() === 'b') {
    event.preventDefault()
    cycleTaskStatus()
    return
  }

  if (!canUseAddElementShortcuts.value) return

  const option = addElementOptions.find(
    item => item.shortcutKey.toLowerCase() === event.key.toLowerCase()
  )
  if (!option) return

  event.preventDefault()
  handleAddElementShortcut(option.type)
})
</script>

<template>
  <form
    ref="formEl"
    :class="{ 'flex flex-col flex-1 min-h-0': fillHeight }"
    @focusin="onTaskContentFocusIn"
    @focusout="onTaskContentFocusOut"
    @keydown="onFormKeydown"
    @submit.prevent="handleSubmit"
  >
    <InputGroup :class="{ 'flex-1 min-h-0': fillHeight }">
      <div class="relative w-full">
        <InputGroupTextarea
          v-model="title"
          v-bind="titleAttrs"
          :placeholder="t('task.titlePlaceholder')"
          class="pb-2!"
          :rows="1"
          :maxlength="100"
          :class="{
            'aria-invalid': errors.title,
            'min-h-7': hasExtendedContent,
            'transition-colors focus-visible:bg-accent/25': hasExtendedContent,
            'flex-none': fillHeight,
            'pr-10': !showDescriptionShortcutHint,
            'pr-36': showDescriptionShortcutHint,
          }"
        />
        <Transition
          enter-active-class="transition-opacity duration-150 ease-out"
          enter-from-class="opacity-0"
          enter-to-class="opacity-100"
          leave-active-class="transition-opacity duration-100 ease-in"
          leave-from-class="opacity-100"
          leave-to-class="opacity-0"
        >
          <span
            v-if="showDescriptionShortcutHint"
            class="pointer-events-none absolute top-3 right-2 flex items-center gap-1 text-xs text-muted-foreground"
          >
            <span class="flex items-center gap-0.5" aria-hidden="true">
              <kbd :class="shortcutKbdClass">Alt</kbd>
              <span class="text-[10px]">+</span>
              <kbd :class="shortcutKbdClass">O</kbd>
            </span>
            <span>{{ t('task.addDescriptionShortcutHint') }}</span>
          </span>
        </Transition>
      </div>

      <div
        v-if="hasDescriptionElement"
        class="group relative w-full"
        :class="{ 'flex-1 min-h-0': fillHeight }"
      >
        <Textarea
          v-model="description"
          v-bind="descriptionAttrs"
          :placeholder="t('task.descriptionPlaceholder')"
          data-slot="input-group-control"
          data-task-content-field
          :data-add-element-field="AddElementType.DESCRIPTION"
          :maxlength="1000"
          class="min-h-20 w-full pr-10 resize-none rounded-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0 focus-visible:ring-transparent ring-offset-transparent dark:bg-transparent transition-colors focus-visible:bg-accent/50"
          :class="{
            'aria-invalid': errors.description,
            'max-h-[calc(100dvh-22rem)] overflow-y-auto': fillHeight,
          }"
        />
        <button
          type="button"
          class="absolute top-1 right-2 z-10 flex size-6 cursor-pointer items-center justify-center rounded-md text-muted-foreground opacity-0 transition-opacity hover:bg-destructive/10 hover:text-destructive focus:outline-none focus-visible:opacity-100 focus-visible:ring-2 focus-visible:ring-ring group-hover:opacity-100"
          :aria-label="t('task.removeDescriptionAriaLabel')"
          tabindex="0"
          @click="hasDescriptionElement = false"
        >
          <Icon name="lucide:x" class="size-4" />
        </button>
      </div>

      <TaskInputUrlRow
        v-if="hasGitElement"
        icon="lucide:git-branch"
        :add-element-field="AddElementType.GIT"
        :placeholder="t('task.gitUrlPlaceholder')"
        :model-value="gitUrl ?? ''"
        :invalid="!!errors.gitUrl"
        :remove-aria-label="t('task.removeGitAriaLabel')"
        :input-attrs="gitUrlAttrs"
        @update:model-value="gitUrl = $event"
        @remove="removeGitElement()"
      />

      <TaskInputUrlRow
        v-if="hasJiraElement"
        icon="simple-icons:jira"
        :add-element-field="AddElementType.JIRA"
        :placeholder="t('task.jiraUrlPlaceholder')"
        :model-value="jiraUrl ?? ''"
        :invalid="!!errors.jiraUrl"
        :remove-aria-label="t('task.removeJiraAriaLabel')"
        :input-attrs="jiraUrlAttrs"
        @update:model-value="jiraUrl = $event"
        @remove="removeJiraElement()"
      />

      <TaskInputUrlRow
        v-if="hasExternalElement"
        icon="lucide:external-link"
        :add-element-field="AddElementType.EXTERNAL"
        :placeholder="t('task.externalUrlPlaceholder')"
        :model-value="externalUrl ?? ''"
        :invalid="!!errors.externalUrl"
        :remove-aria-label="t('task.removeExternalAriaLabel')"
        :input-attrs="externalUrlAttrs"
        @update:model-value="externalUrl = $event"
        @remove="removeExternalElement()"
      />

      <InputGroupAddon align="block-end">
        <DropdownMenu v-if="!isAddElementMenuExhausted" v-model:open="addElementMenuOpen">
          <DropdownMenuTrigger as-child>
            <InputGroupButton
              variant="outline"
              class="rounded-full"
              size="icon-xs"
              data-tour="add-element-trigger"
            >
              <PlusIcon class="size-4" />
              <span class="sr-only">{{ t('task.addElementAriaLabel') }}</span>
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            class="[--radius:0.95rem] flex flex-col gap-1"
            :class="showAddElementShortcuts && isDesktop ? 'min-w-60' : 'min-w-52'"
            data-tour="add-element-menu"
            :modal="presentation.isActive.value"
          >
            <DropdownMenuItem
              v-for="option in visibleAddElementOptions"
              :key="option.type"
              class="group w-full justify-between"
              @click="handleAddElement(option.type)"
            >
              <span class="flex min-w-0 items-center gap-2">
                <Icon :name="option.icon" class="size-4 shrink-0" />
                <span class="truncate">{{ option.label }}</span>
              </span>
              <span
                v-if="showAddElementShortcuts && isDesktop"
                class="ml-3 flex shrink-0 items-center gap-0.5 opacity-0 transition-opacity duration-150 group-hover:opacity-100 group-data-highlighted:opacity-100"
                aria-hidden="true"
              >
                <kbd :class="shortcutKbdClass">Alt</kbd>
                <span class="text-[10px] text-muted-foreground">+</span>
                <kbd :class="shortcutKbdClass">{{ option.shortcutKey }}</kbd>
              </span>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        <TooltipProvider v-else :delay-duration="500">
          <Tooltip>
            <TooltipTrigger as-child>
              <span class="inline-flex">
                <InputGroupButton
                  variant="outline"
                  class="rounded-full"
                  size="icon-xs"
                  disabled
                  data-tour="add-element-trigger"
                >
                  <PlusIcon class="size-4" />
                  <span class="sr-only">{{ t('task.addElementAriaLabel') }}</span>
                </InputGroupButton>
              </span>
            </TooltipTrigger>
            <TooltipContent side="top">
              {{ t('task.allElementsAdded') }}
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>

        <DropdownMenu v-model:open="statusMenuOpen">
          <div class="flex items-center gap-1.5">
            <DropdownMenuTrigger as-child>
              <InputGroupButton variant="ghost">
                <Icon
                  :name="selectedTaskStatus!.icon"
                  class="size-4"
                  :class="[selectedTaskStatus!.iconColor]"
                />
                <span class="pr-1">{{ selectedTaskStatus!.label }}</span>
              </InputGroupButton>
            </DropdownMenuTrigger>
            <Transition
              enter-active-class="transition-opacity duration-150 ease-out"
              enter-from-class="opacity-0"
              enter-to-class="opacity-100"
              leave-active-class="transition-opacity duration-100 ease-in"
              leave-from-class="opacity-100"
              leave-to-class="opacity-0"
            >
              <span
                v-if="showAddElementShortcuts && isDesktop && statusMenuOpen"
                class="flex shrink-0 items-center gap-0.5"
                :aria-label="t('task.cycleStatusShortcutAriaLabel')"
              >
                <kbd :class="shortcutKbdClass">Alt</kbd>
                <span class="text-[10px] text-muted-foreground">+</span>
                <kbd :class="shortcutKbdClass">B</kbd>
              </span>
            </Transition>
          </div>
          <DropdownMenuContent
            side="top"
            align="start"
            class="[--radius:0.95rem] flex flex-col gap-1"
          >
            <DropdownMenuItem
              v-for="option in taskStatusOptions"
              :key="option.value"
              :class="{ 'bg-accent': taskStatus === option.value }"
              @click="taskStatus = option.value"
            >
              <Icon :name="option.icon" class="size-4" :class="[option.iconColor]" />
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <InputGroupText v-if="hasDescriptionElement" class="ml-auto">
          {{ (description ?? '').length }} / 1000
        </InputGroupText>
        <div class="flex items-center gap-2" :class="{ 'ml-auto': !hasDescriptionElement }">
          <Separator v-if="hasDescriptionElement" orientation="vertical" class="h-4!" />
          <div>
            <slot
              name="submit"
              :is-submit-disabled="isSubmitDisabled"
              :is-task-content-focused="isTaskContentFocused"
            />
          </div>
        </div>
      </InputGroupAddon>
    </InputGroup>

    <p
      v-for="group in formErrors"
      :key="group.keys.join(',')"
      class="mt-2 text-sm text-destructive"
    >
      {{ group.message }}
    </p>
  </form>
</template>
