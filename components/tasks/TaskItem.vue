<script setup lang="ts">
import { Item, ItemContent, ItemTitle, ItemDescription } from '@/components/ui/item'
import { TaskStatus } from '@/types/enums'
import { Icon } from '@iconify/vue'
import type { Task } from '@/types'

defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'remove', taskId: string): void
}>()
</script>

<template>
  <Item variant="outline" class="transition-colors hover:border-accent relative bg-card">
    <ItemContent class="pr-8">
      <button
        type="button"
        class="absolute top-2 right-2 p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        aria-label="Usuń zadanie"
        @click="emit('remove', task.id)"
      >
        <Icon icon="lucide:x" class="size-4" />
      </button>
      <ItemTitle>
        <Icon
          :icon="
            task.status === TaskStatus.COMPLETED
              ? 'lets-icons:done-duotone'
              : 'lets-icons:clock-duotone'
          "
          class="size-4"
          :class="[task.status === TaskStatus.COMPLETED ? 'text-green-500' : 'text-yellow-500']"
        />
        {{ task.title }}
      </ItemTitle>
      <ItemDescription> {{ task.description }} </ItemDescription>
      <div
        v-if="task.gitUrl || task.jiraUrl || (task.externalLinks?.length ?? 0) > 0"
        class="mt-1.5 flex flex-wrap gap-x-3 gap-y-1 text-sm"
      >
        <a
          v-if="task.gitUrl"
          :href="task.gitUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
        >
          <Icon icon="lucide:git-branch" class="size-3.5" />
          Git
        </a>
        <a
          v-if="task.jiraUrl"
          :href="task.jiraUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
        >
          <Icon icon="simple-icons:jira" class="size-3.5" />
          Jira
        </a>
        <template v-for="(url, i) in task.externalLinks ?? []" :key="i">
          <a
            :href="url"
            target="_blank"
            rel="noopener noreferrer"
            class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
          >
            <Icon icon="lucide:external-link" class="size-3.5" />
            Link
          </a>
        </template>
      </div>
    </ItemContent>
  </Item>
</template>
