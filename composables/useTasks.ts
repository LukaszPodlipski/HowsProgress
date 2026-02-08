export interface Task {
  id: string
  text: string
  date: Date
  completed: boolean
  createdAt: string // ISO timestamp
}

const STORAGE_KEY = 'how-is-your-progress-tasks'

const tasks = ref<Task[]>([])

export const useTasks = () => {
  const fetchTasks = () => {
    if (typeof window === 'undefined') return

    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      tasks.value = JSON.parse(stored) as Task[]
    } catch (error) {
      console.error('Błąd podczas odczytu zadań:', error)
      return []
    }
  }

  const saveTasks = (tasks: Task[]): void => {
    if (typeof window === 'undefined') return

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
    } catch (error) {
      console.error('Błąd podczas zapisu zadań:', error)
    }
  }

  const addTask = (text: string): Task => {
    const task: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      date: new Date(),
      completed: false,
      createdAt: new Date().toISOString(),
    }

    tasks.value.push(task)
    saveTasks(tasks.value)

    return task
  }

  const removeTask = (id: string): void => {
    const filtered = tasks.value.filter(task => task.id !== id)
    saveTasks(filtered)
  }

  return {
    fetchTasks,
    addTask,
    removeTask,
    tasks,
  }
}
