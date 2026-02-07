export interface Task {
  id: string
  text: string
  date: string // ISO date string
  completed: boolean
  createdAt: string // ISO timestamp
}

const STORAGE_KEY = 'how-is-your-progress-tasks'

export const useTasks = () => {
  const getTasks = (): Task[] => {
    if (typeof window === 'undefined') return []
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (!stored) return []
      return JSON.parse(stored) as Task[]
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

  const addTask = (text: string, date?: string): Task => {
    const task: Task = {
      id: crypto.randomUUID(),
      text: text.trim(),
      date: date || new Date().toISOString().split('T')[0], // YYYY-MM-DD
      completed: false,
      createdAt: new Date().toISOString()
    }

    const tasks = getTasks()
    tasks.push(task)
    saveTasks(tasks)
    
    return task
  }

  const removeTask = (id: string): void => {
    const tasks = getTasks()
    const filtered = tasks.filter(task => task.id !== id)
    saveTasks(filtered)
  }

  const updateTask = (id: string, updates: Partial<Omit<Task, 'id' | 'createdAt'>>): void => {
    const tasks = getTasks()
    const index = tasks.findIndex(task => task.id === id)
    
    if (index !== -1) {
      tasks[index] = { ...tasks[index], ...updates }
      saveTasks(tasks)
    }
  }

  return {
    getTasks,
    addTask,
    removeTask,
    updateTask,
  }
}

