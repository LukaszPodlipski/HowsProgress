import type { Workspace } from '@/types'
import type { Firestore } from 'firebase/firestore'
import {
  collection,
  doc,
  setDoc,
  updateDoc,
  getDocs,
  onSnapshot,
  query,
  orderBy,
  writeBatch,
} from 'firebase/firestore'

const WORKSPACES_META_KEY = 'how-is-your-progress-workspaces--meta'
const ACTIVE_WORKSPACE_KEY = 'how-is-your-progress-active-workspace'
const DEFAULT_WORKSPACE_EMOJI = '📋'

const workspaces = ref<Workspace[]>([])
const activeWorkspaceId = ref<string | null>(null)
const workspacesReady = ref(false)
let workspacesUnsubscribe: (() => void) | null = null
let ensureDefaultInFlight: Promise<string> | null = null
let bootstrapWatchRegistered = false

/* --------------------------- HELPERS ----------------------------------- */

const activeWorkspace = computed(
  () => workspaces.value.find(ws => ws.id === activeWorkspaceId.value) ?? null
)

const getWorkspacesCol = (db: Firestore, uid: string) => collection(db, 'users', uid, 'workspaces')

const persistActiveWorkspace = (id: string) => {
  if (typeof window !== 'undefined') {
    localStorage.setItem(ACTIVE_WORKSPACE_KEY, id)
  }
}

const setActiveWorkspace = (id: string) => {
  activeWorkspaceId.value = id
  persistActiveWorkspace(id)
}

/* --------------------------- FIRESTORE ----------------------------------- */

const setupFirestoreWorkspacesListener = (db: Firestore, uid: string) => {
  if (workspacesUnsubscribe) {
    workspacesUnsubscribe()
    workspacesUnsubscribe = null
  }

  workspacesReady.value = false

  const q = query(getWorkspacesCol(db, uid), orderBy('order', 'asc'))

  workspacesUnsubscribe = onSnapshot(q, snapshot => {
    workspaces.value = snapshot.docs.map(d => ({ ...(d.data() as Workspace), id: d.id }))
    workspacesReady.value = true

    if (workspaces.value.length === 0) {
      activeWorkspaceId.value = null
    } else {
      // Restore persisted active workspace, fallback to first
      const persisted = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
      const valid = persisted && workspaces.value.some(ws => ws.id === persisted)
      if (!valid) {
        setActiveWorkspace(workspaces.value[0]!.id)
      } else {
        activeWorkspaceId.value = persisted!
      }
    }
  })
}

/* --------------------------- LOCALSTORAGE ----------------------------------- */

const loadLocalWorkspaces = () => {
  if (typeof window === 'undefined') return []

  try {
    const stored = localStorage.getItem(WORKSPACES_META_KEY)
    if (!stored) return []
    return JSON.parse(stored) as Workspace[]
  } catch {
    return []
  }
}

const saveLocalWorkspaces = (list: Workspace[]) => {
  if (typeof window === 'undefined') return

  try {
    localStorage.setItem(WORKSPACES_META_KEY, JSON.stringify(list))
  } catch {
    // ignore
  }
}

/* --------------------------- INIT / TEARDOWN ----------------------------------- */

const initWorkspaces = async (db?: Firestore, uid?: string): Promise<void> => {
  if (db && uid) {
    // Firestore mode
    setupFirestoreWorkspacesListener(db, uid)
  } else {
    // localStorage mode
    const list = loadLocalWorkspaces()
    workspaces.value = list
    workspacesReady.value = true

    if (list.length === 0) {
      activeWorkspaceId.value = null
    } else {
      const persisted = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
      const valid = persisted && list.some(ws => ws.id === persisted)
      const activeId = valid ? persisted! : list[0]!.id
      activeWorkspaceId.value = activeId
      persistActiveWorkspace(activeId)
    }
  }
}

const teardownWorkspaces = () => {
  if (workspacesUnsubscribe) {
    workspacesUnsubscribe()
    workspacesUnsubscribe = null
  }
  workspaces.value = []
  activeWorkspaceId.value = null
  workspacesReady.value = false
}

/* --------------------------- COMPOSABLE ----------------------------------- */

export const useWorkspaces = () => {
  const { t } = useI18n()

  const ensureDefaultWorkspace = async (): Promise<string> => {
    if (workspaces.value.length > 0) {
      const ws = workspaces.value[0]!
      if (activeWorkspaceId.value !== ws.id) {
        setActiveWorkspace(ws.id)
      }
      return ws.id
    }

    if (ensureDefaultInFlight) {
      return ensureDefaultInFlight
    }

    ensureDefaultInFlight = (async () => {
      if (workspaces.value.length > 0) {
        const ws = workspaces.value[0]!
        setActiveWorkspace(ws.id)
        return ws.id
      }

      const ws = await addWorkspace(t('workspace.defaultName'), DEFAULT_WORKSPACE_EMOJI)
      setActiveWorkspace(ws.id)
      return ws.id
    })()

    try {
      return await ensureDefaultInFlight
    } finally {
      ensureDefaultInFlight = null
    }
  }

  const deleteWorkspace = async (wsId: string): Promise<void> => {
    const { $firebaseDb } = useNuxtApp()
    const { currentUser, isLoggedIn } = useAuth()

    // Switch active workspace before deletion if needed
    if (activeWorkspaceId.value === wsId) {
      const next = workspaces.value.find(ws => ws.id !== wsId)
      if (next) {
        setActiveWorkspace(next.id)
      } else {
        activeWorkspaceId.value = null
      }
    }

    if (isLoggedIn.value && currentUser.value) {
      const db = $firebaseDb as Firestore
      const uid = currentUser.value.uid
      const tasksCol = collection(db, 'users', uid, 'workspaces', wsId, 'tasks')
      const tasksDocs = await getDocs(tasksCol)
      const batch = writeBatch(db)
      tasksDocs.forEach(d => batch.delete(d.ref))
      batch.delete(doc(getWorkspacesCol(db, uid), wsId))
      await batch.commit()
      // onSnapshot will update workspaces.value reactively
    } else {
      localStorage.removeItem(`how-is-your-progress-tasks--${wsId}`)
      workspaces.value = workspaces.value.filter(ws => ws.id !== wsId)
      saveLocalWorkspaces(workspaces.value)
    }
  }

  const updateWorkspace = async (wsId: string, name: string, emoji: string): Promise<void> => {
    const { $firebaseDb } = useNuxtApp()
    const { currentUser, isLoggedIn } = useAuth()

    if (isLoggedIn.value && currentUser.value) {
      const col = getWorkspacesCol($firebaseDb as Firestore, currentUser.value.uid)
      await updateDoc(doc(col, wsId), { name, emoji })
      // onSnapshot will update workspaces.value reactively
    } else {
      const index = workspaces.value.findIndex(ws => ws.id === wsId)
      if (index === -1) return
      workspaces.value[index] = { ...workspaces.value[index]!, name, emoji }
      saveLocalWorkspaces(workspaces.value)
    }
  }

  const addWorkspace = async (name: string, emoji: string): Promise<Workspace> => {
    const { $firebaseDb } = useNuxtApp()
    const { currentUser, isLoggedIn } = useAuth()

    const newWs: Workspace = {
      id: crypto.randomUUID(),
      name,
      emoji,
      order: workspaces.value.length,
      createdAt: new Date().toISOString(),
    }

    if (isLoggedIn.value && currentUser.value) {
      const col = getWorkspacesCol($firebaseDb as Firestore, currentUser.value.uid)
      await setDoc(doc(col, newWs.id), newWs)
      // onSnapshot will update workspaces.value reactively
    } else {
      workspaces.value.push(newWs)
      saveLocalWorkspaces(workspaces.value)
    }

    return newWs
  }

  if (!bootstrapWatchRegistered && import.meta.client) {
    bootstrapWatchRegistered = true
    watch(
      () => [workspacesReady.value, workspaces.value.length] as const,
      async ([ready, len]) => {
        if (!ready || len > 0) return
        await ensureDefaultWorkspace()
      }
    )
  }

  return {
    workspaces: readonly(workspaces),
    activeWorkspaceId: readonly(activeWorkspaceId),
    activeWorkspace,
    workspacesReady: readonly(workspacesReady),
    initWorkspaces,
    teardownWorkspaces,
    setActiveWorkspace,
    addWorkspace,
    updateWorkspace,
    deleteWorkspace,
    ensureDefaultWorkspace,
  }
}
