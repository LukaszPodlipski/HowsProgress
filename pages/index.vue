<script setup lang="ts">
import TaskInput, { type TaskForm } from '@/components/tasks/TaskInput.vue'
import TasksList from '@/components/tasks/TasksList.vue'
import { useTasks } from '@/composables/useTasks'
import { useWorkspaces } from '@/composables/useWorkspaces'

const tasksList = ref<InstanceType<typeof TasksList> | null>(null)

const { fetchTasks, addTask } = useTasks()
const { activeWorkspaceId } = useWorkspaces()

/* --------------------------- FETCH TASKS AND HANDLE STORAGE EVENT ----------------------------------- */
onBeforeMount(() => {
  fetchTasks()
})

onMounted(() => {
  window.addEventListener('storage', fetchTasks)
  scrollTo({
    top: document.body.scrollHeight,
    behavior: 'smooth',
  })
})

onUnmounted(() => {
  window.removeEventListener('storage', fetchTasks)
})

watch(activeWorkspaceId, () => {
  fetchTasks()
  nextTick(() => tasksList.value?.scrollToBottom())
})

/* --------------------------- ADD NEW TASK ----------------------------------- */
const addNewTask = (taskForm: TaskForm) => {
  addTask(taskForm)

  nextTick(() => {
    tasksList.value?.scrollToBottom()
  })
}
</script>

<template>
  <div class="app-view-wrapper">
    <div class="scroll-list-container">
      <TasksList ref="tasksList" />
      <div class="scroll-list__input">
        <TaskInput @submit="addNewTask" />
      </div>
    </div>
  </div>
</template>
