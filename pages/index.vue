<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'

const { getTasks } = useTasks()

const tasks = ref(getTasks())

const refreshTasks = () => {
  tasks.value = getTasks()
}

onMounted(() => {
  window.addEventListener('storage', handleStorageChange)
})

onUnmounted(() => {
  window.removeEventListener('storage', handleStorageChange)
})

const handleStorageChange = () => {
  refreshTasks()
}
</script>

<template>
  <div class="max-w-3xl mx-auto p-6 bg-background">
    <Button>Click me</Button>
  </div>
</template>
