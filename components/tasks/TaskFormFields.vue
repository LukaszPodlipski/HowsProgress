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
import { PlusIcon } from 'lucide-vue-next'
import { Textarea } from '@/components/ui/textarea'
import TaskInputUrlRow from './TaskInputUrlRow.vue'
import type { useTaskForm } from '@/composables/useTaskForm'

const props = defineProps<{
  form: ReturnType<typeof useTaskForm>
  fillHeight?: boolean
}>()

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
  onAddElement,
  removeGitElement,
  removeJiraElement,
  removeExternalElement,
  isSubmitDisabled,
} = props.form
</script>

<template>
  <form :class="{ 'flex flex-col flex-1 min-h-0': fillHeight }" @submit.prevent="handleSubmit">
    <InputGroup :class="{ 'flex-1 min-h-0': fillHeight }">
      <InputGroupTextarea
        v-model="title"
        v-bind="titleAttrs"
        placeholder="Tytuł zadania..."
        class="pb-2! pr-10"
        :rows="1"
        :maxlength="100"
        :class="{
          'aria-invalid': errors.title,
          'min-h-7': hasExtendedContent,
          'transition-colors focus-visible:bg-accent/25': hasExtendedContent,
          'flex-none': fillHeight,
        }"
      />

      <div
        v-if="hasDescriptionElement"
        class="relative w-full"
        :class="{ 'flex-1 min-h-0': fillHeight }"
      >
        <Textarea
          v-model="description"
          v-bind="descriptionAttrs"
          placeholder="Opis (opcjonalnie)..."
          data-slot="input-group-control"
          :maxlength="1000"
          class="min-h-20 w-full pr-10 resize-none rounded-none border-0 bg-transparent py-2 shadow-none focus-visible:ring-0 focus-visible:ring-transparent ring-offset-transparent dark:bg-transparent transition-colors focus-visible:bg-accent/50"
          :class="{
            'aria-invalid': errors.description,
            'max-h-[calc(100dvh-22rem)] overflow-y-auto': fillHeight,
          }"
        />
        <button
          type="button"
          class="absolute top-1 right-2 z-10 flex items-center justify-center rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 cursor-pointer w-[24px] h-[24px]"
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
        v-if="hasExternalElement"
        icon="lucide:external-link"
        placeholder="Zewnętrzny URL..."
        :model-value="externalUrl ?? ''"
        :invalid="!!errors.externalUrl"
        remove-aria-label="Usuń zewnętrzny link"
        :input-attrs="externalUrlAttrs"
        @update:model-value="externalUrl = $event"
        @remove="removeExternalElement()"
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
              <span class="pr-1">{{ selectedTaskStatus!.label }}</span>
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

        <InputGroupText v-if="hasDescriptionElement" class="ml-auto">
          {{ (description ?? '').length }} / 1000
        </InputGroupText>
        <div class="flex items-center gap-2" :class="{ 'ml-auto': !hasDescriptionElement }">
          <Separator v-if="hasDescriptionElement" orientation="vertical" class="h-4!" />
          <div>
            <slot name="submit" :is-submit-disabled="isSubmitDisabled" />
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
