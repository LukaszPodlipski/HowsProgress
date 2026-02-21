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
import { ArrowUpIcon, PlusIcon } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import TaskInputUrlRow from './TaskInputUrlRow.vue'
import { useTaskForm, type TaskForm } from '@/composables/useTaskForm'

export type { TaskForm }

const emit = defineEmits<{
  (e: 'submit', taskForm: TaskForm): void
}>()

const {
  handleSubmit,
  errors,
  formErrors,
  isSubmitDisabled,
  title,
  titleAttrs,
  description,
  descriptionAttrs,
  taskStatus,
  gitUrl,
  gitUrlAttrs,
  jiraUrl,
  jiraUrlAttrs,
  externalLinks,
  hasDescriptionElement,
  hasGitElement,
  hasJiraElement,
  hasExtendedContent,
  taskStatusOptions,
  selectedTaskStatus,
  visibleAddElementOptions,
  onAddElement,
  removeExternalLink,
  setExternalLink,
  removeGitElement,
  removeJiraElement,
} = useTaskForm(form => emit('submit', form))
</script>

<template>
  <form @submit.prevent="handleSubmit">
    <InputGroup>
      <InputGroupTextarea
        v-model="title"
        v-bind="titleAttrs"
        placeholder="Tytuł zadania..."
        class="pb-0!"
        :rows="1"
        :class="{
          'aria-invalid': errors.title,
          'min-h-7': hasExtendedContent,
        }"
      />

      <div v-if="hasDescriptionElement" class="relative w-full">
        <Textarea
          v-model="description"
          v-bind="descriptionAttrs"
          placeholder="Opis (opcjonalnie)..."
          data-slot="input-group-control"
          class="min-h-20 w-full pr-8 resize-none rounded-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0 focus-visible:ring-transparent ring-offset-transparent dark:bg-transparent"
          :class="{ 'aria-invalid': errors.description }"
        />
        <button
          type="button"
          class="absolute top-1 right-1 z-10 rounded p-1 transition hover:bg-muted focus:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          aria-label="Usuń opis"
          tabindex="0"
          @click="hasDescriptionElement = false"
        >
          <Icon name="lucide:x" class="size-4" />
        </button>
      </div>

      <TaskInputUrlRow
        v-if="hasGitElement"
        icon="lucide:git-branch"
        placeholder="URL repozytorium Git..."
        :model-value="gitUrl ?? ''"
        :invalid="!!errors.gitUrl"
        remove-aria-label="Usuń link Git"
        :input-attrs="gitUrlAttrs"
        @update:model-value="gitUrl = $event"
        @remove="removeGitElement()"
      />

      <TaskInputUrlRow
        v-if="hasJiraElement"
        icon="simple-icons:jira"
        placeholder="URL Jira..."
        :model-value="jiraUrl ?? ''"
        :invalid="!!errors.jiraUrl"
        remove-aria-label="Usuń link Jira"
        :input-attrs="jiraUrlAttrs"
        @update:model-value="jiraUrl = $event"
        @remove="removeJiraElement()"
      />

      <TaskInputUrlRow
        v-for="(_, index) in externalLinks ?? []"
        :key="index"
        icon="lucide:external-link"
        placeholder="Zewnętrzny URL..."
        :model-value="(externalLinks ?? [])[index] ?? ''"
        :invalid="!!errors.externalLinks?.[index]"
        :remove-aria-label="`Usuń zewnętrzny link ${index + 1}`"
        @update:model-value="setExternalLink(index, $event)"
        @remove="removeExternalLink(index)"
      />

      <InputGroupAddon align="block-end">
        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <InputGroupButton variant="outline" class="rounded-full" size="icon-xs">
              <PlusIcon class="size-4" />
              <span class="sr-only">Dodaj element do zadania</span>
            </InputGroupButton>
          </DropdownMenuTrigger>
          <DropdownMenuContent
            side="top"
            align="start"
            class="[--radius:0.95rem] flex min-w-52 flex-col gap-1"
          >
            <DropdownMenuItem
              v-for="option in visibleAddElementOptions"
              :key="option.type"
              @click="onAddElement(option.type)"
            >
              <Icon :name="option.icon" class="size-4 shrink-0" />
              {{ option.label }}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <DropdownMenu>
          <DropdownMenuTrigger as-child>
            <InputGroupButton variant="ghost">
              <Icon
                :name="selectedTaskStatus!.icon"
                class="size-4"
                :class="[selectedTaskStatus!.iconColor]"
              />
              {{ selectedTaskStatus!.label }}
            </InputGroupButton>
          </DropdownMenuTrigger>
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

        <InputGroupText class="ml-auto"> {{ title.length }} / 1000 </InputGroupText>
        <Separator orientation="vertical" class="h-4!" />
        <InputGroupButton
          type="submit"
          variant="default"
          class="rounded-full"
          size="icon-xs"
          :disabled="isSubmitDisabled"
        >
          <ArrowUpIcon class="size-4" />
          <span class="sr-only">Wyślij</span>
        </InputGroupButton>
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
