<script setup lang="ts">
import TaskInput from '@/components/tasks/TaskInput.vue'
import TasksList from '@/components/tasks/TasksList.vue'
import { useTasks } from '@/composables/useTasks'

const { fetchTasks } = useTasks()

onBeforeMount(() => {
  fetchTasks()
})

onMounted(() => {
  window.addEventListener('storage', fetchTasks)
})

onUnmounted(() => {
  window.removeEventListener('storage', fetchTasks)
})
</script>

<template>
  <div class="max-w-3xl mx-auto py-6 bg-background flex flex-col gap-4 h-full relative w-full">
    <TasksList class="flex-1" />
    <TaskInput class="sticky bottom-0 left-0 right-0" />
  </div>
</template>
