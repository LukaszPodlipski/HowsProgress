import type { Workspace } from '@/types'
import type { Firestore } from 'firebase/firestore'
import { collection, doc, setDoc, onSnapshot, query, orderBy } from 'firebase/firestore'

const WORKSPACES_META_KEY = 'how-is-your-progress-workspaces--meta'
const ACTIVE_WORKSPACE_KEY = 'how-is-your-progress-active-workspace'
const DEFAULT_WORKSPACE_EMOJI = '📋'

const workspaces = ref<Workspace[]>([])
const activeWorkspaceId = ref<string | null>(null)
let workspacesUnsubscribe: (() => void) | null = null

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

const setupFirestoreWorkspacesListener = (db: Firestore, uid: string, defaultName: string) => {
  if (workspacesUnsubscribe) {
    workspacesUnsubscribe()
    workspacesUnsubscribe = null
  }

  const q = query(getWorkspacesCol(db, uid), orderBy('order', 'asc'))

  workspacesUnsubscribe = onSnapshot(q, async snapshot => {
    workspaces.value = snapshot.docs.map(d => ({ ...(d.data() as Workspace), id: d.id }))

    if (workspaces.value.length === 0) {
      // No workspaces yet — create default (first login / fresh account)
      const wsId = crypto.randomUUID()
      const workspace: Workspace = {
        id: wsId,
        name: defaultName,
        emoji: DEFAULT_WORKSPACE_EMOJI,
        order: 0,
        createdAt: new Date().toISOString(),
      }
      await setDoc(doc(getWorkspacesCol(db, uid), wsId), workspace)
      setActiveWorkspace(wsId)
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

const initWorkspaces = async (
  db?: Firestore,
  uid?: string,
  defaultName?: string
): Promise<void> => {
  if (db && uid) {
    // Firestore mode
    setupFirestoreWorkspacesListener(db, uid, defaultName ?? '')
  } else {
    // localStorage mode
    let list = loadLocalWorkspaces()

    if (list.length === 0) {
      const wsId = crypto.randomUUID()
      const defaultWs: Workspace = {
        id: wsId,
        name: defaultName ?? '',
        emoji: DEFAULT_WORKSPACE_EMOJI,
        order: 0,
        createdAt: new Date().toISOString(),
      }
      list = [defaultWs]
      saveLocalWorkspaces(list)
    }

    workspaces.value = list

    // Restore active workspace
    const persisted = localStorage.getItem(ACTIVE_WORKSPACE_KEY)
    const valid = persisted && list.some(ws => ws.id === persisted)
    const activeId = valid ? persisted! : list[0]!.id
    activeWorkspaceId.value = activeId
    persistActiveWorkspace(activeId)
  }
}

const teardownWorkspaces = () => {
  if (workspacesUnsubscribe) {
    workspacesUnsubscribe()
    workspacesUnsubscribe = null
  }
  workspaces.value = []
  activeWorkspaceId.value = null
}

/* --------------------------- COMPOSABLE ----------------------------------- */

export const useWorkspaces = () => {
  const { t } = useI18n()

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

  return {
    workspaces: readonly(workspaces),
    activeWorkspaceId: readonly(activeWorkspaceId),
    activeWorkspace,
    initWorkspaces: (db?: Firestore, uid?: string) =>
      initWorkspaces(db, uid, t('workspace.defaultName')),
    teardownWorkspaces,
    setActiveWorkspace,
    addWorkspace,
  }
}
