import { driver, type Driver, type DriveStep } from 'driver.js'
import type { Firestore } from 'firebase/firestore'
import { doc, getDoc, setDoc } from 'firebase/firestore'
import type { ProductTourStatus } from '@/types'
import { getTourDemoPrimaryTaskId } from '@/composables/useTourDemoData'

const PRODUCT_TOUR_STORAGE_KEY = 'how-is-your-progress-product-tour'
const TOUR_TARGET_SELECTORS = [
  '[data-tour="workspaces"]',
  '[data-tour="task-input"]',
  '[data-tour="task-list"]',
  '[data-tour="account"]',
] as const

const productTourStatus = ref<ProductTourStatus | null>(null)
const productTourLoaded = ref(false)
const tourTargetsReady = ref(false)

let activeDriver: Driver | null = null
let tourPersisted = false
let isResettingTour = false
let tourEngaged = false
let skipAddElementMenuStepSetup = false
let skipTaskPreviewStepSetup = false
let skipTaskEditStepSetup = false

const ADD_ELEMENT_MENU_SELECTOR = '[data-tour="add-element-menu"]'
const TASK_PREVIEW_MODAL_SELECTOR = '[data-tour="task-preview-modal"]'
const TASK_EDIT_MODAL_SELECTOR = '[data-tour="task-edit-modal"]'

const readLocalStatus = (): ProductTourStatus | null => {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PRODUCT_TOUR_STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw) as { status?: ProductTourStatus }
    return parsed.status === 'completed' || parsed.status === 'skipped' ? parsed.status : null
  } catch {
    return null
  }
}

const writeLocalStatus = (status: ProductTourStatus) => {
  if (typeof window === 'undefined') return
  localStorage.setItem(
    PRODUCT_TOUR_STORAGE_KEY,
    JSON.stringify({ status, at: new Date().toISOString() })
  )
}

const getUserProfileRef = (db: Firestore, uid: string) => doc(db, 'users', uid)

const allTourTargetsExist = () =>
  TOUR_TARGET_SELECTORS.every(selector => document.querySelector(selector))

const waitForTourTargets = async (timeoutMs = 10_000): Promise<boolean> => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    if (allTourTargetsExist()) return true
    await new Promise(resolve => setTimeout(resolve, 150))
  }
  return allTourTargetsExist()
}

const waitForSelector = async (selector: string, timeoutMs = 6_000): Promise<Element | null> => {
  const startedAt = Date.now()
  while (Date.now() - startedAt < timeoutMs) {
    const el = document.querySelector(selector)
    if (el) return el
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  return document.querySelector(selector)
}

const refreshActiveDriver = () => {
  if (activeDriver?.isActive()) {
    activeDriver.refresh()
  }
}

const isTourTarget = (element: Element | undefined, selector: string) =>
  !!element && element.matches(selector)

const waitForTourTarget = async (selector: string) => {
  await waitForSelector(selector)
  await nextTick()
  await new Promise<void>(resolve => {
    requestAnimationFrame(() => requestAnimationFrame(() => resolve()))
  })
}

const prepareTourTarget = async (selector: string, setup: () => void) => {
  setup()
  await waitForTourTarget(selector)
}

const createDeferredTourHighlightHandler =
  (
    selector: string,
    skipKey: 'addElementMenu' | 'taskPreview' | 'taskEdit',
    setup: () => void
  ) =>
  async (element: Element | undefined, _step: DriveStep, { driver: d }: { driver: Driver }) => {
    const skipFlags = {
      addElementMenu: () => skipAddElementMenuStepSetup,
      taskPreview: () => skipTaskPreviewStepSetup,
      taskEdit: () => skipTaskEditStepSetup,
    }
    const setSkipFlags = {
      addElementMenu: (value: boolean) => {
        skipAddElementMenuStepSetup = value
      },
      taskPreview: (value: boolean) => {
        skipTaskPreviewStepSetup = value
      },
      taskEdit: (value: boolean) => {
        skipTaskEditStepSetup = value
      },
    }

    if (skipFlags[skipKey]()) {
      setSkipFlags[skipKey](false)
      return
    }
    if (isTourTarget(element, selector)) return

    await prepareTourTarget(selector, setup)
    const index = d.getActiveIndex()
    if (index === undefined) return

    setSkipFlags[skipKey](true)
    d.moveTo(index)
  }

export const useProductTour = () => {
  const { t } = useI18n()
  const { $firebaseDb } = useNuxtApp()
  const { currentUser, isLoggedIn, isLocalMode } = useAuth()
  const presentation = useProductTourPresentation()

  const hasFinishedProductTour = computed(
    () => productTourStatus.value === 'completed' || productTourStatus.value === 'skipped'
  )

  const shouldShowProductTour = computed(
    () => productTourLoaded.value && !hasFinishedProductTour.value
  )

  const setTourTargetsReady = (ready: boolean) => {
    tourTargetsReady.value = ready
  }

  const loadProductTourStatus = async () => {
    productTourLoaded.value = false

    try {
      if (isLoggedIn.value && currentUser.value) {
        const uid = currentUser.value.uid
        const profileRef = getUserProfileRef($firebaseDb as Firestore, uid)
        const snap = await getDoc(profileRef)
        const remoteStatus = snap.exists()
          ? (snap.data().productTourStatus as ProductTourStatus | undefined)
          : undefined

        if (remoteStatus === 'completed' || remoteStatus === 'skipped') {
          productTourStatus.value = remoteStatus
          writeLocalStatus(remoteStatus)
        } else {
          const localStatus = readLocalStatus()
          if (localStatus) {
            productTourStatus.value = localStatus
            await setDoc(
              profileRef,
              { productTourStatus: localStatus, productTourAt: new Date().toISOString() },
              { merge: true }
            )
          } else {
            productTourStatus.value = null
          }
        }
      } else if (isLocalMode.value) {
        productTourStatus.value = readLocalStatus()
      } else {
        productTourStatus.value = null
      }
    } catch (error) {
      console.error('Failed to load product tour status', error)
      productTourStatus.value = readLocalStatus()
    } finally {
      productTourLoaded.value = true
    }
  }

  const persistProductTourStatus = async (status: ProductTourStatus) => {
    productTourStatus.value = status
    writeLocalStatus(status)

    if (isLoggedIn.value && currentUser.value) {
      const profileRef = getUserProfileRef($firebaseDb as Firestore, currentUser.value.uid)
      await setDoc(
        profileRef,
        { productTourStatus: status, productTourAt: new Date().toISOString() },
        { merge: true }
      )
    }
  }

  const { seedTourDemoData, removeTourDemoData } = useTourDemoData()

  const cleanupTourDemo = async () => {
    presentation.setActive(false)
    presentation.reset()
    await removeTourDemoData()
  }

  const markProductTourCompleted = () => persistProductTourStatus('completed')
  const markProductTourSkipped = () => persistProductTourStatus('skipped')

  const resolveDemoTaskId = () => getTourDemoPrimaryTaskId()

  const buildSteps = (): DriveStep[] => [
    {
      popover: {
        title: t('productTour.steps.welcome.title'),
        description: t('productTour.steps.welcome.description'),
        side: 'over',
      },
    },
    {
      element: '[data-tour="workspaces"]',
      popover: {
        title: t('productTour.steps.workspaces.title'),
        description: t('productTour.steps.workspaces.description'),
        side: 'right',
        align: 'start',
      },
    },
    {
      element: '[data-tour="task-input"]',
      onHighlightStarted: () => {
        presentation.closeAddElementMenu()
      },
      popover: {
        title: t('productTour.steps.taskInput.title'),
        description: t('productTour.steps.taskInput.description'),
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="add-element-trigger"]',
      onHighlightStarted: () => {
        presentation.closeAddElementMenu()
        nextTick(() => refreshActiveDriver())
      },
      popover: {
        title: t('productTour.steps.addElementTrigger.title'),
        description: t('productTour.steps.addElementTrigger.description'),
        side: 'top',
        align: 'start',
        onNextClick: (_element, _step, { driver: d }) => {
          void prepareTourTarget(ADD_ELEMENT_MENU_SELECTOR, presentation.openAddElementMenu).then(
            () => d.moveNext()
          )
        },
      },
    },
    {
      element: ADD_ELEMENT_MENU_SELECTOR,
      disableActiveInteraction: false,
      onHighlightStarted: createDeferredTourHighlightHandler(
        ADD_ELEMENT_MENU_SELECTOR,
        'addElementMenu',
        presentation.openAddElementMenu
      ),
      onDeselected: () => {
        presentation.closeAddElementMenu()
      },
      popover: {
        title: t('productTour.steps.addElementMenu.title'),
        description: t('productTour.steps.addElementMenu.description'),
        side: 'top',
        align: 'start',
      },
    },
    {
      element: '[data-tour="task-list"]',
      onDeselected: () => {
        presentation.closeModals()
      },
      popover: {
        title: t('productTour.steps.taskList.title'),
        description: t('productTour.steps.taskList.description'),
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="demo-task"]',
      onHighlightStarted: () => {
        presentation.closeModals()
      },
      popover: {
        title: t('productTour.steps.demoTask.title'),
        description: t('productTour.steps.demoTask.description'),
        side: 'bottom',
        align: 'center',
        onNextClick: (_element, _step, { driver: d }) => {
          const taskId = resolveDemoTaskId()
          if (!taskId) {
            d.moveNext()
            return
          }
          void prepareTourTarget(TASK_PREVIEW_MODAL_SELECTOR, () =>
            presentation.openPreview(taskId)
          ).then(() => d.moveNext())
        },
      },
    },
    {
      element: TASK_PREVIEW_MODAL_SELECTOR,
      disableActiveInteraction: false,
      onHighlightStarted: createDeferredTourHighlightHandler(
        TASK_PREVIEW_MODAL_SELECTOR,
        'taskPreview',
        () => {
          const taskId = resolveDemoTaskId()
          if (taskId) presentation.openPreview(taskId)
        }
      ),
      onDeselected: () => {
        if (!presentation.editTaskId.value) {
          presentation.closeModals()
        }
      },
      popover: {
        title: t('productTour.steps.taskPreview.title'),
        description: t('productTour.steps.taskPreview.description'),
        side: 'bottom',
        align: 'center',
        onNextClick: (_element, _step, { driver: d }) => {
          const taskId = resolveDemoTaskId()
          if (!taskId) {
            d.moveNext()
            return
          }
          void prepareTourTarget(TASK_EDIT_MODAL_SELECTOR, () => presentation.openEdit(taskId)).then(
            () => d.moveNext()
          )
        },
      },
    },
    {
      element: TASK_EDIT_MODAL_SELECTOR,
      disableActiveInteraction: false,
      onHighlightStarted: createDeferredTourHighlightHandler(
        TASK_EDIT_MODAL_SELECTOR,
        'taskEdit',
        () => {
          const taskId = resolveDemoTaskId()
          if (taskId) presentation.openEdit(taskId)
        }
      ),
      onDeselected: () => {
        presentation.closeModals()
      },
      popover: {
        title: t('productTour.steps.taskEdit.title'),
        description: t('productTour.steps.taskEdit.description'),
        side: 'bottom',
        align: 'center',
      },
    },
    {
      element: '[data-tour="account"]',
      onHighlightStarted: () => {
        presentation.closeModals()
        presentation.closeAddElementMenu()
      },
      popover: {
        title: t('productTour.steps.account.title'),
        description: isLoggedIn.value
          ? t('productTour.steps.account.descriptionLoggedIn')
          : t('productTour.steps.account.descriptionLocal'),
        side: 'right',
        align: 'end',
      },
    },
  ]

  const destroyActiveTour = () => {
    if (!activeDriver) return

    isResettingTour = true
    try {
      if (activeDriver.isActive()) {
        activeDriver.destroy()
      }
    } finally {
      isResettingTour = false
      activeDriver = null
      tourPersisted = false
      tourEngaged = false
      skipAddElementMenuStepSetup = false
      skipTaskPreviewStepSetup = false
      skipTaskEditStepSetup = false
      presentation.setActive(false)
      presentation.reset()
    }
  }

  const startProductTour = async (): Promise<boolean> => {
    if (!import.meta.client || hasFinishedProductTour.value) return false

    const targetsReady = await waitForTourTargets()
    if (!targetsReady) return false

    await nextTick()

    destroyActiveTour()
    tourPersisted = false
    tourEngaged = false

    await seedTourDemoData()
    await nextTick()

    presentation.setActive(true)

    const driverObj = driver({
      showProgress: true,
      progressText: 'Krok {{current}} z {{total}}',
      nextBtnText: t('productTour.next'),
      prevBtnText: t('productTour.prev'),
      doneBtnText: t('productTour.done'),
      popoverClass: 'product-tour-popover',
      steps: buildSteps(),
      onHighlighted: () => {
        tourEngaged = true
      },
      onNextClick: (_element, _step, { driver: d }) => {
        if (d.isLastStep()) {
          tourPersisted = true
          void markProductTourCompleted().finally(() => d.destroy())
        } else {
          d.moveNext()
        }
      },
      onCloseClick: (_element, _step, { driver: d }) => {
        tourPersisted = true
        void markProductTourSkipped().finally(() => d.destroy())
      },
      onDestroyed: () => {
        activeDriver = null
        if (isResettingTour) return
        void cleanupTourDemo().finally(() => {
          if (!tourPersisted && tourEngaged) {
            void markProductTourSkipped()
          }
        })
        tourPersisted = false
        tourEngaged = false
      },
    })

    activeDriver = driverObj
    driverObj.drive()
    return true
  }

  return {
    productTourLoaded: readonly(productTourLoaded),
    tourTargetsReady: readonly(tourTargetsReady),
    hasFinishedProductTour,
    shouldShowProductTour,
    setTourTargetsReady,
    loadProductTourStatus,
    markProductTourCompleted,
    markProductTourSkipped,
    startProductTour,
    destroyActiveTour,
  }
}
