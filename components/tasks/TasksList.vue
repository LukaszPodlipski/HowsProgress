<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'
import { useWindowSize } from '@vueuse/core'
import TaskItem from './TaskItem.vue'

const { tasks } = useTasks()

const taskRefs = ref<Map<string, HTMLElement>>(new Map())
const listContainer = ref<HTMLElement | null>(null)
const focusIndex = ref(0)
const visibleTaskIds = ref<Set<string>>(new Set())
const didInitialScroll = ref(false)

onMounted(() => {
  nextTick(() => {
    if (listContainer.value && !didInitialScroll.value) {
      listContainer.value.scrollTop = listContainer.value.scrollHeight
      didInitialScroll.value = true
    }
    updateFocus()
  })
})

watch(tasks, () => {
  nextTick(() => {
    if (listContainer.value && !didInitialScroll.value) {
      listContainer.value.scrollTop = listContainer.value.scrollHeight
      didInitialScroll.value = true
    }
    updateFocus()
  })
})

/* ------------------------- TEMPLATE REFS HANDLING ----------------------------------- */
const setTaskRef = (el: HTMLElement | null, taskId: string) => {
  if (el) {
    taskRefs.value.set(taskId, el)
  }
}

/* ------------------------- HANDLING FOCUS INDEX AND VISIBLE TASKS ----------------------------------- */
const updateFocus = () => {
  if (!listContainer.value) return

  const top = listContainer.value.scrollTop
  const bottom = top + listContainer.value.clientHeight
  const nextVisible = new Set<string>()

  let firstVisibleIndex = 0
  let foundFirstVisible = false

  for (let i = 0; i < tasks.value.length; i += 1) {
    const task = tasks.value[i]
    if (!task) continue
    const el = taskRefs.value.get(task.id)
    if (!el) continue

    const liTop = el.offsetTop
    const liBottom = liTop + el.offsetHeight
    const isVisible = liBottom > top && liTop < bottom

    if (isVisible) {
      nextVisible.add(task.id)
      if (!foundFirstVisible) {
        firstVisibleIndex = i
        foundFirstVisible = true
      }
    }
  }

  visibleTaskIds.value = nextVisible
  focusIndex.value = foundFirstVisible ? firstVisibleIndex : 0
}

/* ------------------------- SCROLLING UTILS ----------------------------------- */
const scrollToBottom = () => {
  if (listContainer.value) {
    listContainer.value.scrollTop = listContainer.value.scrollHeight
  }
}

const { height } = useWindowSize()

const scrollListHeigth = computed(() => {
  const inputElement =
    document.querySelector('.scroll-list__input') ||
    (listContainer.value?.parentElement?.querySelector('.scroll-list__input') ?? null)
  if (!inputElement) return 100
  return height.value - inputElement.clientHeight - 32
})

defineExpose({
  scrollToBottom,
})
</script>

<template>
  <div class="scroll-list">
    <div class="scroll-list__wrp-frame">
      <div
        ref="listContainer"
        class="scroll-list__wrp js-scroll-content js-scroll-list"
        :style="{ height: scrollListHeigth + 'px' }"
        @scroll.passive="updateFocus"
      >
        <ul class="scroll-list__list">
          <li
            v-for="(task, index) in tasks"
            :key="task.id"
            :ref="el => setTaskRef(el as HTMLElement, task.id)"
            class="scroll-list__item js-scroll-list-item"
            :class="{
              'item-focus': index === focusIndex,
              'item-visible': visibleTaskIds.has(task.id),
            }"
          >
            <TaskItem :task="task" />
          </li>
        </ul>
      </div>
      <div class="scroll-list__fade scroll-list__fade--top" aria-hidden="true"></div>
      <div class="scroll-list__fade scroll-list__fade--bottom" aria-hidden="true"></div>
    </div>
  </div>
</template>
