<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'
import TaskItem from './TaskItem.vue'

const { tasks } = useTasks()
</script>

<template>
  <ul class="flex flex-col gap-2">
    <TaskItem v-for="task in tasks" :key="task.id" :task="task" />
  </ul>
</template>
