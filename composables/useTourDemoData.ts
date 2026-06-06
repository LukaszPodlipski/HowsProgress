import type { Task } from '@/types'
import { TaskStatus } from '@/types/enums'
import type { Firestore } from 'firebase/firestore'
import { collection, doc, getDocs, setDoc } from 'firebase/firestore'

const TOUR_DEMO_WORKSPACE_IDS_KEY = 'how-is-your-progress-tour-demo-workspace-ids'

let demoWorkspaceIds: string[] = []
let tourDemoActive = false
let tourDemoPrimaryTaskId: string | null = null

export const getTourDemoPrimaryTaskId = () => tourDemoPrimaryTaskId

const toLocalDateString = (d: Date = new Date()): string => {
  const y = d.getFullYear()
  const m = String(d.getMonth() + 1).padStart(2, '0')
  const day = String(d.getDate()).padStart(2, '0')
  return `${y}-${m}-${day}`
}

const offsetDateString = (daysAgo: number): string => {
  const d = new Date()
  d.setDate(d.getDate() - daysAgo)
  return toLocalDateString(d)
}

const getLocalStorageKey = (wsId: string) => `how-is-your-progress-tasks--${wsId}`

const getTasksCol = (db: Firestore, uid: string, wsId: string) =>
  collection(db, 'users', uid, 'workspaces', wsId, 'tasks')

const toFirestoreDoc = (obj: Record<string, unknown>): Record<string, unknown> =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined))

const persistDemoWorkspaceIds = () => {
  if (typeof window === 'undefined') return
  if (demoWorkspaceIds.length === 0) {
    localStorage.removeItem(TOUR_DEMO_WORKSPACE_IDS_KEY)
    return
  }
  localStorage.setItem(TOUR_DEMO_WORKSPACE_IDS_KEY, JSON.stringify(demoWorkspaceIds))
}

const restoreDemoWorkspaceIds = () => {
  if (typeof window === 'undefined') return
  try {
    const raw = localStorage.getItem(TOUR_DEMO_WORKSPACE_IDS_KEY)
    demoWorkspaceIds = raw ? (JSON.parse(raw) as string[]) : []
    tourDemoActive = demoWorkspaceIds.length > 0
  } catch {
    demoWorkspaceIds = []
    tourDemoActive = false
  }
}

type DemoTaskSeed = {
  title: string
  status: TaskStatus
  displayDate: string
  description?: string
  gitUrl?: string
  jiraUrl?: string
}

export const useTourDemoData = () => {
  const { t } = useI18n()
  const { $firebaseDb } = useNuxtApp()
  const { currentUser, isLoggedIn } = useAuth()
  const { workspaces, addWorkspace, deleteWorkspace, setActiveWorkspace, ensureDefaultWorkspace } =
    useWorkspaces()
  const { fetchTasks } = useTasks()

  const countTasksInWorkspace = async (wsId: string): Promise<number> => {
    if (isLoggedIn.value && currentUser.value) {
      const snap = await getDocs(
        getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
      )
      return snap.size
    }

    if (typeof window === 'undefined') return 0
    try {
      const stored = localStorage.getItem(getLocalStorageKey(wsId))
      return stored ? (JSON.parse(stored) as Task[]).length : 0
    } catch {
      return 0
    }
  }

  const hasAnyUserTasks = async (): Promise<boolean> => {
    for (const ws of workspaces.value) {
      if (demoWorkspaceIds.includes(ws.id)) continue
      const count = await countTasksInWorkspace(ws.id)
      if (count > 0) return true
    }
    return false
  }

  const writeDemoTask = async (wsId: string, seed: DemoTaskSeed, order: number): Promise<string> => {
    const task: Task = {
      id: crypto.randomUUID(),
      title: seed.title,
      description: seed.description,
      status: seed.status,
      createdAt: new Date().toISOString(),
      displayDate: seed.displayDate,
      gitUrl: seed.gitUrl,
      jiraUrl: seed.jiraUrl,
      order,
    }

    if (isLoggedIn.value && currentUser.value) {
      const col = getTasksCol($firebaseDb as Firestore, currentUser.value.uid, wsId)
      await setDoc(doc(col, task.id), toFirestoreDoc(task as unknown as Record<string, unknown>))
    } else if (typeof window !== 'undefined') {
      const key = getLocalStorageKey(wsId)
      const existing = localStorage.getItem(key)
      const list: Task[] = existing ? (JSON.parse(existing) as Task[]) : []
      list.push(task)
      localStorage.setItem(key, JSON.stringify(list))
    }

    return task.id
  }

  const writeDemoTasks = async (wsId: string, seeds: DemoTaskSeed[]) => {
    for (let i = 0; i < seeds.length; i += 1) {
      const seed = seeds[i]!
      const taskId = await writeDemoTask(wsId, seed, i)
      if (i === 0) {
        tourDemoPrimaryTaskId = taskId
      }
    }
  }

  const buildDemoTaskSeeds = (): { main: DemoTaskSeed[]; docs: DemoTaskSeed[] } => {
    const today = toLocalDateString()
    const yesterday = offsetDateString(1)

    return {
      main: [
        {
          title: t('productTour.demo.tasks.review'),
          status: TaskStatus.IN_PROGRESS,
          displayDate: today,
          gitUrl: 'https://github.com/example/app/pull/42',
          description: t('productTour.demo.tasks.bugfixDescription'),
        },
        {
          title: t('productTour.demo.tasks.standup'),
          status: TaskStatus.COMPLETED,
          displayDate: today,
        },
        {
          title: t('productTour.demo.tasks.bugfix'),
          status: TaskStatus.COMPLETED,
          displayDate: yesterday,
          jiraUrl: 'https://example.atlassian.net/browse APP-128',
        },
      ],
      docs: [
        {
          title: t('productTour.demo.tasks.readme'),
          status: TaskStatus.TO_DO,
          displayDate: today,
        },
      ],
    }
  }

  const seedTourDemoData = async (): Promise<boolean> => {
    if (!import.meta.client || tourDemoActive) return tourDemoActive

    restoreDemoWorkspaceIds()
    if (tourDemoActive) {
      const firstDemoId = demoWorkspaceIds[0]
      if (firstDemoId) {
        setActiveWorkspace(firstDemoId)
        await fetchTasks()
        if (!tourDemoPrimaryTaskId) {
          const { tasks } = useTasks()
          const first = [...tasks.value].sort((a, b) => a.order - b.order)[0]
          if (first) tourDemoPrimaryTaskId = first.id
        }
      }
      return true
    }

    if (await hasAnyUserTasks()) return false

    demoWorkspaceIds = []
    tourDemoPrimaryTaskId = null

    for (const ws of [...workspaces.value]) {
      const count = await countTasksInWorkspace(ws.id)
      if (count === 0) {
        await deleteWorkspace(ws.id)
      }
    }

    const { main: mainTasks, docs: docsTasks } = buildDemoTaskSeeds()

    const mainWs = await addWorkspace(t('productTour.demo.workspaces.main'), '🚀')
    const docsWs = await addWorkspace(t('productTour.demo.workspaces.docs'), '📝')

    demoWorkspaceIds = [mainWs.id, docsWs.id]
    tourDemoActive = true
    persistDemoWorkspaceIds()

    await writeDemoTasks(mainWs.id, mainTasks)
    await writeDemoTasks(docsWs.id, docsTasks)

    setActiveWorkspace(mainWs.id)
    await fetchTasks()
    await nextTick()
    await new Promise(resolve => setTimeout(resolve, 200))

    return true
  }

  const removeTourDemoData = async () => {
    if (!import.meta.client) return

    restoreDemoWorkspaceIds()
    if (!tourDemoActive && demoWorkspaceIds.length === 0) return

    const idsToRemove = [...demoWorkspaceIds]
    demoWorkspaceIds = []
    tourDemoActive = false
    tourDemoPrimaryTaskId = null
    persistDemoWorkspaceIds()

    for (const wsId of idsToRemove) {
      if (workspaces.value.some(ws => ws.id === wsId)) {
        await deleteWorkspace(wsId)
      }
    }

    if (workspaces.value.length === 0) {
      await ensureDefaultWorkspace()
      await fetchTasks()
    }
  }

  return {
    seedTourDemoData,
    removeTourDemoData,
  }
}
