<script setup lang="ts">
import { useTasks } from '@/composables/useTasks'

const { tasks } = useTasks()
</script>

<template>
  <ul>
    <li v-for="task in tasks" :key="task.id">
      {{ task.text }}
    </li>
  </ul>
</template>
