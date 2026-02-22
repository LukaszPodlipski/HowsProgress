<script setup lang="ts">
import { Item, ItemContent, ItemTitle } from '@/components/ui/item'
import { TaskStatus } from '@/types/enums'
import { Icon } from '@iconify/vue'
import type { HTMLAttributes } from 'vue'
import type { Task } from '@/types'

const props = withDefaults(
  defineProps<{
    task: Task
    class?: HTMLAttributes['class']
    clickable?: boolean
    dragging?: boolean
    /** When true, description is always fully visible (no "show more/less") */
    descriptionAlwaysExpanded?: boolean
    /** When true, task is embedded (e.g. in preview modal): close button instead of drag handle, actions always visible */
    embedded?: boolean
  }>(),
  {
    clickable: true,
    dragging: false,
    descriptionAlwaysExpanded: false,
    embedded: false,
    class: '',
  }
)

const emit = defineEmits<{
  (e: 'remove' | 'edit' | 'preview', taskId: string): void
  (e: 'close' | 'handle-pointerdown'): void
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
  () => !!(props.task.gitUrl || props.task.jiraUrl || props.task.externalUrl)
)
</script>

<template>
  <Item
    variant="outline"
    class="relative bg-card transition-colors select-none"
    :class="[
      props.clickable && 'cursor-pointer hover:border-accent active:bg-accent/60',
      props.dragging && 'opacity-40',
      props.class,
    ]"
    @click="props.clickable && emit('preview', task.id)"
  >
    <ItemContent>
      <div class="flex items-start justify-between">
        <ItemTitle class="min-w-0">
          <Icon
            :icon="
              task.status === TaskStatus.COMPLETED
                ? 'lets-icons:done-duotone'
                : 'lets-icons:clock-duotone'
            "
            class="size-4 shrink-0"
            :class="[task.status === TaskStatus.COMPLETED ? 'text-green-500' : 'text-yellow-500']"
          />
          <span class="min-w-0 wrap-break-word text-balance">{{ task.title }}</span>
        </ItemTitle>
        <div
          class="flex items-center gap-0.5 transition-opacity"
          :class="props.embedded ? 'opacity-100' : 'opacity-0 group-hover/item:opacity-100 '"
        >
          <button
            v-if="!props.embedded"
            type="button"
            class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring cursor-grab active:cursor-grabbing"
            aria-label="Przeciągnij zadanie"
            @pointerdown.stop="emit('handle-pointerdown')"
          >
            <Icon icon="lucide:grip-vertical" class="size-3.5" />
          </button>
          <button
            type="button"
            class="p-[6px] rounded-md text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 cursor-pointer"
            aria-label="Edytuj zadanie"
            @click.stop="emit('edit', task.id)"
          >
            <Icon icon="lucide:pencil" class="size-3.5" />
          </button>
          <button
            type="button"
            class="p-1 rounded-md text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 cursor-pointer"
            aria-label="Usuń zadanie"
            @click.stop="emit('remove', task.id)"
          >
            <Icon icon="lucide:trash-2" class="size-3.5" />
          </button>
          <button
            v-if="props.embedded"
            type="button"
            class="p-1 rounded-md text-muted-foreground hover:text-foreground hover:bg-muted transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:opacity-100 cursor-pointer"
            aria-label="Zamknij"
            @click.stop="emit('close')"
          >
            <Icon icon="lucide:minimize" class="size-4" />
          </button>
        </div>
      </div>

      <div v-if="task.description" class="relative mt-1">
        <div
          :class="
            props.descriptionAlwaysExpanded
              ? 'overflow-y-auto max-h-[calc(100dvh-8rem)]'
              : isExpanded
                ? 'overflow-hidden'
                : 'overflow-hidden max-h-[4.5em]'
          "
        >
          <p
            ref="descriptionRef"
            class="text-sm text-muted-foreground leading-normal whitespace-pre-wrap wrap-break-word text-balance"
          >
            {{ task.description }}
          </p>
        </div>
        <div
          v-if="!props.descriptionAlwaysExpanded && !isExpanded && isOverflowing"
          class="absolute bottom-0 left-0 right-0 h-8 bg-linear-to-t from-card to-transparent pointer-events-none group-active/item:from-accent/0"
        />
      </div>

      <div
        v-if="hasLinks || (!props.descriptionAlwaysExpanded && isOverflowing)"
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
        <a
          v-if="task.externalUrl"
          :href="task.externalUrl"
          target="_blank"
          rel="noopener noreferrer"
          class="inline-flex items-center gap-1 text-muted-foreground hover:text-foreground transition"
          @click.stop
        >
          <Icon icon="lucide:external-link" class="size-3.5" />
          Link
        </a>

        <button
          v-if="!props.descriptionAlwaysExpanded && isOverflowing"
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
