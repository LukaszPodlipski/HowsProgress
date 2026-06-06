import type { Task } from '@/types'
import type { TaskForm } from '@/composables/useTaskForm'
import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  setDoc,
  deleteDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore'

const SKIP_SYNC_KEY = 'how-is-your-progress-skip-sync'

const tasks = ref<Task[]>([])
let firestoreUnsubscribe: (() => void) | null = null
let isReordering = false

/* --------------------------- HELPERS ----------------------------------- */

const getLocalStorageKey = (wsId: string) => `how-is-your-progress-tasks--${wsId}`

/** Returns local date as YYYY-MM-DD (avoids UTC shift from toISOString) */
const toLocalDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const getTasksCol = (db: Firestore, uid: string, wsId: string) =>
  collection(db, 'users', uid, 'workspaces', wsId, 'tasks')

// Firestore v9+ rejects undefined values — strip them before every write
const toFirestoreDoc = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

/* --------------------------- FIRESTORE LISTENER ----------------------------------- */

const setupFirestoreListener = (db: Firestore, uid: string, wsId: string) => {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe()
    firestoreUnsubscribe = null
  }

  const q = query(getTasksCol(db, uid, wsId), orderBy('order', 'asc'))

  firestoreUnsubscribe = onSnapshot(q, snapshot => {
    if (isReordering) return

    tasks.value = snapshot.docs.map(d => {
      const data = d.data() as Task
      return {
        ...data,
        id: d.id,
        displayDate:
          data.displayDate || (data.createdAt ? toLocalDateString(new Date(data.createdAt)) : toLocalDateString()),
      }
    })
  })
}

const teardownFirestore = () => {
  if (firestoreUnsubscribe) {
    firestoreUnsubscribe()
    firestoreUnsubscribe = null
  }
}

/* --------------------------- LOCALSTORAGE ----------------------------------- */

const loadFromLocalStorage = (wsId: string) => {
  if (typeof window === 'undefined') return

  tasks.value = []
  try {
    const stored = localStorage.getItem(getLocalStorageKey(wsId))
    if (!stored) return
    const parsed = JSON.parse(stored) as Task[]
    tasks.value = parsed.map(t => ({
      id: t.id,
      title: t.title,
      description: t.description,
      status: t.status,
      createdAt: t.createdAt,
      displayDate: t.displayDate || toLocalDateString(new Date(t.createdAt)),
      gitUrl: t.gitUrl,
      jiraUrl: t.jiraUrl,
      externalUrl: t.externalUrl,
      order: t.order,
    }))
  } catch (error) {
    console.error('Error reading tasks:', error)
  }
}

const saveToLocalStorage = (wsId: string, list: Task[]) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(getLocalStorageKey(wsId), JSON.stringify(list))
  } catch (error) {
    console.error('Error saving tasks:', error)
  }
}

/* --------------------------- COMPOSABLE ----------------------------------- */

export const useTasks = () => {
  const { currentUser, isLoggedIn } = useAuth()
  const { $firebaseDb } = useNuxtApp()
  const { activeWorkspaceId, ensureDefaultWorkspace } = useWorkspaces()

  /* --- fetch --- */

  const fetchTasks = async () => {
    const wsId = activeWorkspaceId.value
    if (!wsId) {
      teardownFirestore()
      tasks.value = []
      return
    }

    if (isLoggedIn.value && currentUser.value) {
      setupFirestoreListener($firebaseDb as Firestore, currentUser.value.uid, wsId)
    } else {
      teardownFirestore()
      loadFromLocalStorage(wsId)
    }
  }

  /* --- add --- */

  const addTask = async (taskForm: TaskForm): Promise<Task> => {
    if (!activeWorkspaceId.value) {
      await ensureDefaultWorkspace()
    }
    const wsId = activeWorkspaceId.value!
    const newOrder = tasks.value.length

    const task: Task = {
      id: crypto.randomUUID(),
      title: taskForm.title.trim(),
      description: taskForm.description,
      status: taskForm.taskStatus,
      createdAt: new Date().toISOString(),
      displayDate: toLocalDateString(),
      gitUrl: taskForm.gitUrl,
      jiraUrl: taskForm.jiraUrl,
      externalUrl: taskForm.externalUrl?.trim() || undefined,
      order: newOrder,
    }

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
      await setDoc(doc(col, task.id), toFirestoreDoc(task as unknown as Record<string, unknown>))
      // onSnapshot will update tasks.value reactively
    } else {
      tasks.value.push(task)
      saveToLocalStorage(wsId, tasks.value)
    }

    return task
  }

  /* --- remove --- */

  const removeTask = async (id: string): Promise<void> => {
    const wsId = activeWorkspaceId.value!

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
      await deleteDoc(doc(col, id))
    } else {
      const filtered = tasks.value.filter(t => t.id !== id)
      tasks.value = filtered
      saveToLocalStorage(wsId, filtered)
    }
  }

  /* --- update --- */

  const updateTask = async (id: string, form: TaskForm): Promise<void> => {
    const wsId = activeWorkspaceId.value!
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
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
      await setDoc(doc(col, id), toFirestoreDoc(updated as unknown as Record<string, unknown>))
    } else {
      tasks.value[index] = updated
      saveToLocalStorage(wsId, tasks.value)
    }
  }

  /* --- reorder --- */

  const reorderTasksOrdered = async (
    orderedTasks: Task[],
    movedTaskId: string,
    newDisplayDate?: string
  ): Promise<void> => {
    const wsId = activeWorkspaceId.value!

    const arr = orderedTasks.map((task, index) => ({
      ...task,
      order: index,
      ...(task.id === movedTaskId && newDisplayDate ? { displayDate: newDisplayDate } : {}),
    }))

    isReordering = true
    tasks.value = arr

    try {
      if (isLoggedIn.value && currentUser.value) {
        const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
        const batch = writeBatch($firebaseDb as Firestore)

        for (const task of arr) {
          const update: Record<string, unknown> = { order: task.order }
          if (task.id === movedTaskId && newDisplayDate) {
            update.displayDate = newDisplayDate
          }
          batch.update(doc(col, task.id), update)
        }

        await batch.commit()
      } else {
        saveToLocalStorage(wsId, arr)
      }
    } finally {
      isReordering = false
    }
  }

  const reorderTask = async (
    fromIndex: number,
    toIndex: number,
    newDisplayDate?: string
  ): Promise<void> => {
    if (fromIndex === toIndex && !newDisplayDate) return
    const wsId = activeWorkspaceId.value!

    const arr = [...tasks.value]
    const [item] = arr.splice(fromIndex, 1)
    if (item) {
      if (newDisplayDate) item.displayDate = newDisplayDate
      arr.splice(toIndex, 0, item)
    }

    // Optimistic update for smooth drag & drop UX
    tasks.value = arr

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
      const batch = writeBatch($firebaseDb as Firestore)

      if (fromIndex === toIndex && newDisplayDate && item) {
        // Only displayDate changed, no reordering
        batch.update(doc(col, item.id), { displayDate: newDisplayDate })
      } else {
        const start = Math.min(fromIndex, toIndex)
        const end = Math.max(fromIndex, toIndex)
        for (let i = start; i <= end; i++) {
          const task = arr[i]
          if (!task) continue
          const update: Record<string, unknown> = { order: i }
          if (task.id === item?.id && newDisplayDate) {
            update.displayDate = newDisplayDate
          }
          batch.update(doc(col, task.id), update)
        }
      }

      await batch.commit()
    } else {
      saveToLocalStorage(wsId, arr)
    }
  }

  /* --- restore (undo delete) --- */

  const restoreTask = async (task: Task, index?: number): Promise<void> => {
    const wsId = activeWorkspaceId.value!

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)

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
      saveToLocalStorage(wsId, tasks.value)
    }
  }

  /* --- sync (local mode → Firestore on first login) --- */

  const checkSyncNeeded = async (
    uid: string,
    localTasks: Task[]
  ): Promise<{ needed: boolean; localTasks: Task[] }> => {
    if (localStorage.getItem(SKIP_SYNC_KEY) === 'true') return { needed: false, localTasks: [] }
    if (localTasks.length === 0) return { needed: false, localTasks: [] }

    const wsId = activeWorkspaceId.value
    if (!wsId) return { needed: false, localTasks: [] }

    const col = getTasksCol($firebaseDb as Firestore, uid, wsId)
    const existing = await getDocs(col)
    if (!existing.empty) return { needed: false, localTasks: [] }

    return { needed: true, localTasks }
  }

  const syncLocalTasksToFirestore = async (uid: string, localTasks: Task[]): Promise<void> => {
    const wsId = activeWorkspaceId.value
    if (!wsId) return

    const col = getTasksCol($firebaseDb as Firestore, uid, wsId)
    const batch = writeBatch($firebaseDb as Firestore)
    localTasks.forEach((task, index) => {
      batch.set(doc(col, task.id), toFirestoreDoc({ ...task, order: task.order ?? index }))
    })
    await batch.commit()
  }

  const dismissSync = () => {
    localStorage.setItem(SKIP_SYNC_KEY, 'true')
  }

  return {
    tasks,
    fetchTasks,
    addTask,
    updateTask,
    removeTask,
    restoreTask,
    reorderTask,
    reorderTasksOrdered,
    teardownFirestore,
    checkSyncNeeded,
    syncLocalTasksToFirestore,
    dismissSync,
  }
}
