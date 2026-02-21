<script setup lang="ts">
import { Item, ItemContent, ItemTitle } from '@/components/ui/item'
import { TaskStatus } from '@/types/enums'
import { Icon } from '@iconify/vue'
import type { Task } from '@/types'

const props = defineProps<{
  task: Task
}>()

const emit = defineEmits<{
  (e: 'remove' | 'edit', taskId: string): void
}>()

const isExpanded = ref(false)
const descriptionRef = ref<HTMLElement | null>(null)
const isOverflowing = ref(false)

const updateOverflow = () => {
  const el = descriptionRef.value
  if (!el) return
  const fontSize = parseFloat(getComputedStyle(el).fontSize)
  isOverflowing.value = el.scrollHeight > Math.round(fontSize * 1.5 * 3)
}

onMounted(() => nextTick(updateOverflow))

watch(
  () => props.task.description,
  () => {
    isExpanded.value = false
    nextTick(updateOverflow)
  }
)

const hasLinks = computed(
  () => !!(props.task.gitUrl || props.task.jiraUrl || (props.task.externalLinks?.length ?? 0) > 0)
)
</script>

<template>
  <Item
    variant="outline"
    class="relative cursor-pointer bg-card transition-colors hover:border-accent active:bg-accent/60 select-none"
  >
    <ItemContent>
      <div
        class="absolute top-2 right-2 flex items-center gap-0.5 opacity-0 transition-opacity group-hover/item:opacity-100"
      >
        <button
          type="button"
          class="p-[6px] rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 cursor-pointer"
          aria-label="Edytuj zadanie"
          @click.stop="emit('edit', task.id)"
        >
          <Icon icon="lucide:pencil" class="size-3" />
        </button>
        <button
          type="button"
          class="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 cursor-pointer"
          aria-label="Usuń zadanie"
          @click.stop="emit('remove', task.id)"
        >
          <Icon icon="lucide:x" class="size-4" />
        </button>
      </div>

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

      <div v-if="task.description" class="relative mt-1">
        <div class="overflow-hidden" :class="isExpanded ? '' : 'max-h-[4.5em]'">
          <p
            ref="descriptionRef"
            class="text-sm text-muted-foreground leading-normal whitespace-pre-wrap break-words"
          >
            {{ task.description }}
          </p>
        </div>
        <div
          v-if="!isExpanded && isOverflowing"
          class="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-card to-transparent pointer-events-none"
        />
      </div>

      <div
        v-if="hasLinks || isOverflowing"
        class="mt-1.5 flex flex-wrap items-center gap-x-3 gap-y-1 text-sm"
      >
        <a
          v-if="task.gitUrl"
          :href="task.gitUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
          @click.stop
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
          @click.stop
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
            @click.stop
          >
            <Icon icon="lucide:external-link" class="size-3.5" />
            Link
          </a>
        </template>

        <button
          v-if="isOverflowing"
          type="button"
          class="ml-auto shrink-0 inline-flex items-center gap-0.5 text-xs text-muted-foreground hover:text-foreground transition cursor-pointer"
          @click.stop="isExpanded = !isExpanded"
        >
          <Icon :icon="isExpanded ? 'lucide:chevron-up' : 'lucide:chevron-down'" class="size-3" />
          {{ isExpanded ? 'Pokaż mniej' : 'Pokaż więcej' }}
        </button>
      </div>
    </ItemContent>
  </Item>
</template>
