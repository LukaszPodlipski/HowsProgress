import type { Task } from '@/types'
import type { TaskForm } from '@/composables/useTaskForm'
import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore'

const STORAGE_KEY = 'how-is-your-progress-tasks'

const tasks = ref<Task[]>([])
let firestoreUnsubscribe: (() => void) | null = null

/* --------------------------- HELPERS ----------------------------------- */

const getTasksCol = (db: Firestore, uid: string) => collection(db, 'users', uid, 'tasks')

// Firestore v9+ rejects undefined values — strip them before every write
const toFirestoreDoc = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

/* --------------------------- FIRESTORE LISTENER ----------------------------------- */

const setupFirestoreListener = (db: Firestore, uid: string) => {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe()
    firestoreUnsubscribe = null
  }

  const q = query(getTasksCol(db, uid), orderBy('order', 'asc'))

  firestoreUnsubscribe = onSnapshot(q, snapshot => {
    tasks.value = snapshot.docs.map(d => ({ ...(d.data() as Task), id: d.id }))
  })
}

const teardownFirestore = () => {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe()
    firestoreUnsubscribe = null
  }
}

/* --------------------------- LOCALSTORAGE ----------------------------------- */

const loadFromLocalStorage = () => {
  if (typeof window === 'undefined') return

  tasks.value = []
  try {
    const stored = localStorage.getItem(STORAGE_KEY)
    if (!stored) return
    const parsed = JSON.parse(stored) as (Task & { text?: string })[]
    tasks.value = parsed.map((t, index) => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
      gitUrl: t.gitUrl,
      jiraUrl: t.jiraUrl,
      externalUrl: t.externalUrl,
      order: t.order ?? index, // backward compat: tasks without order field
    }))
  } catch (error) {
    console.error('Error reading tasks:', error)
  }
}

const saveToLocalStorage = (list: Task[]) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(list))
  } catch (error) {
    console.error('Error saving tasks:', error)
  }
}

/* --------------------------- COMPOSABLE ----------------------------------- */

export const useTasks = () => {
  const { currentUser, isLoggedIn } = useAuth()
  const { $firebaseDb } = useNuxtApp()

  /* --- fetch --- */

  const fetchTasks = async () => {
    if (isLoggedIn.value && currentUser.value) {
      setupFirestoreListener($firebaseDb as Firestore, currentUser.value.uid)
    } else {
      teardownFirestore()
      loadFromLocalStorage()
    }
  }

  /* --- add --- */

  const addTask = async (taskForm: TaskForm): Promise<Task> => {
    const newOrder = tasks.value.length

    const task: Task = {
      id: crypto.randomUUID(),
      title: taskForm.title.trim(),
      description: taskForm.description,
      status: taskForm.taskStatus,
      createdAt: new Date().toISOString(),
      gitUrl: taskForm.gitUrl,
      jiraUrl: taskForm.jiraUrl,
      externalUrl: taskForm.externalUrl?.trim() || undefined,
      order: newOrder,
    }

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid)
      await setDoc(doc(col, task.id), toFirestoreDoc(task as unknown as Record<string, unknown>))
      // onSnapshot will update tasks.value reactively
    } else {
      tasks.value.push(task)
      saveToLocalStorage(tasks.value)
    }

    return task
  }

  /* --- remove --- */

  const removeTask = async (id: string): Promise<void> => {
    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid)
      await deleteDoc(doc(col, id))
    } else {
      const filtered = tasks.value.filter(t => t.id !== id)
      tasks.value = filtered
      saveToLocalStorage(filtered)
    }
  }

  /* --- update --- */

  const updateTask = async (id: string, form: TaskForm): Promise<void> => {
    const index = tasks.value.findIndex(t => t.id === id)
    if (index === -1) return console.error('Task not found:', id)

    const existing = tasks.value[index]!
    const updated: Task = {
      ...existing,
      title: form.title.trim(),
      description: form.description?.trim() || undefined,
      status: form.taskStatus,
      gitUrl: form.gitUrl?.trim() || undefined,
      jiraUrl: form.jiraUrl?.trim() || undefined,
      externalUrl: form.externalUrl?.trim() || undefined,
    }

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid)
      await setDoc(doc(col, id), toFirestoreDoc(updated as unknown as Record<string, unknown>))
    } else {
      tasks.value[index] = updated
      saveToLocalStorage(tasks.value)
    }
  }

  /* --- reorder --- */

  const reorderTask = async (fromIndex: number, toIndex: number): Promise<void> => {
    if (fromIndex === toIndex) return

    const arr = [...tasks.value]
    const [item] = arr.splice(fromIndex, 1)
    if (item) arr.splice(toIndex, 0, item)

    // Optimistic update for smooth drag & drop UX
    tasks.value = arr

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid)
      const start = Math.min(fromIndex, toIndex)
      const end = Math.max(fromIndex, toIndex)

      const batch = writeBatch($firebaseDb as Firestore)
      for (let i = start; i <= end; i++) {
        const task = arr[i]
        if (!task) continue
        batch.update(doc(col, task.id), { order: i })
      }
      await batch.commit()
    } else {
      saveToLocalStorage(arr)
    }
  }

  /* --- restore (undo delete) --- */

  const restoreTask = async (task: Task, index?: number): Promise<void> => {
    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid)

      if (typeof index === 'number' && index >= 0 && index <= tasks.value.length) {
        const batch = writeBatch($firebaseDb as Firestore)
        batch.set(doc(col, task.id), toFirestoreDoc({ ...task, order: index }))
        // Shift order of all tasks at index and above
        tasks.value.slice(index).forEach((t, i) => {
          batch.update(doc(col, t.id), { order: index + 1 + i })
        })
        await batch.commit()
      } else {
        await setDoc(doc(col, task.id), toFirestoreDoc({ ...task, order: tasks.value.length }))
      }
    } else {
      if (typeof index === 'number' && index >= 0 && index <= tasks.value.length) {
        tasks.value.splice(index, 0, task)
      } else {
        tasks.value.push(task)
      }
      saveToLocalStorage(tasks.value)
    }
  }

  return {
    tasks,
    fetchTasks,
    addTask,
    updateTask,
    removeTask,
    restoreTask,
    reorderTask,
    teardownFirestore,
  }
}
