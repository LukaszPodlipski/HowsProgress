import type { Task } from '@/types'
import type { TaskForm } from '@/components/tasks/TaskInput.vue'

const STORAGE_KEY = 'how-is-your-progress-tasks'

const tasks = ref<Task[]>([])

export const useTasks = () => {
  const fetchTasks = () => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      const parsed = JSON.parse(stored) as (Task & { text?: string })[]
      tasks.value = parsed.map(t => ({
        id: t.id,
        title: t.title ?? t.text ?? '',
        description: t.description,
        status: t.status,
        createdAt: t.createdAt,
        gitUrl: t.gitUrl,
        jiraUrl: t.jiraUrl,
        externalLinks: t.externalLinks,
      }))
    } catch (error) {
      console.error('Error reading tasks:', error)
      return []
    }
  }

  const saveTasksLocalStorage = (tasks: Task[]): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.error('Error saving tasks:', error)
    }
  }

  const addTask = (taskForm: TaskForm): Task => {
    const task: Task = {
      id: crypto.randomUUID(),
      title: taskForm.title.trim(),
      description: taskForm.description,
      status: taskForm.taskStatus,
      createdAt: new Date().toISOString(),
      gitUrl: taskForm.gitUrl,
      jiraUrl: taskForm.jiraUrl,
      externalLinks: taskForm.externalLinks?.length ? taskForm.externalLinks : undefined,
    }

    tasks.value.push(task)
    saveTasksLocalStorage(tasks.value)

    return task
  }

  const removeTask = (id: string): void => {
    const filtered = tasks.value.filter(task => task.id !== id)
    tasks.value = filtered
    saveTasksLocalStorage(filtered)
  }

  const updateTask = (id: string, form: TaskForm): void => {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index === -1) return console.error('Task not found')

    const existing = tasks.value[index]!
    const cleanExternal = (form.externalLinks ?? []).filter((u): u is string => Boolean(u?.trim()))
    tasks.value[index] = {
      ...existing,
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      status: form.taskStatus,
      gitUrl: form.gitUrl?.trim() || undefined,
      jiraUrl: form.jiraUrl?.trim() || undefined,
      externalLinks: cleanExternal.length ? cleanExternal : undefined,
    }
    saveTasksLocalStorage(tasks.value)
  }

  const restoreTask = (task: Task, index?: number): void => {
    if (typeof index === 'number' && index >= 0 && index <= tasks.value.length) {
      tasks.value.splice(index, 0, task)
    } else {
      tasks.value.push(task)
    }
    saveTasksLocalStorage(tasks.value)
  }

  return {
    fetchTasks,
    addTask,
    updateTask,
    removeTask,
    restoreTask,
    tasks,
  }
}
