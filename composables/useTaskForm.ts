import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { AddElementType, TaskStatus } from '@/types/enums'

const urlSchema = z.string().url('Wprowadź prawidłowy adres URL')
const optionalUrlSchema = z.union([z.literal(''), urlSchema]).optional()

export const taskFormSchema = z.object({
  title: z.string().max(100, 'Tytuł nie może przekraczać 100 znaków'),
  description: z.string().max(1000, 'Opis nie może przekraczać 1000 znaków').optional(),
  taskStatus: z.nativeEnum(TaskStatus),
  gitUrl: optionalUrlSchema,
  jiraUrl: optionalUrlSchema,
  externalUrl: optionalUrlSchema,
})

export type TaskForm = z.infer<typeof taskFormSchema>

const INITIAL_VALUES: TaskForm = {
  title: '',
  description: '',
  taskStatus: TaskStatus.COMPLETED,
  gitUrl: '',
  jiraUrl: '',
  externalUrl: '',
}

export const TASK_STATUS_OPTIONS = [
  {
    label: 'Completed',
    icon: 'lets-icons:done-duotone',
    iconColor: 'text-green-500',
    value: TaskStatus.COMPLETED,
  },
  {
    label: 'In progress',
    icon: 'lets-icons:clock-duotone',
    iconColor: 'text-yellow-500',
    value: TaskStatus.IN_PROGRESS,
  },
] as const

export const ADD_ELEMENT_OPTIONS: ReadonlyArray<{
  type: AddElementType
  label: string
  icon: string
}> = [
  { type: AddElementType.DESCRIPTION, label: 'Opis', icon: 'lucide:align-left' },
  { type: AddElementType.GIT, label: 'Link repozytorium Git', icon: 'lucide:git-branch' },
  { type: AddElementType.JIRA, label: 'Link Jira', icon: 'simple-icons:jira' },
  { type: AddElementType.EXTERNAL, label: 'Zewnętrzny link', icon: 'lucide:external-link' },
]

function normalizeSubmitPayload(values: TaskForm): TaskForm {
  return {
    ...values,
    description: values.description?.trim() || undefined,
    gitUrl: values.gitUrl?.trim() || undefined,
    jiraUrl: values.jiraUrl?.trim() || undefined,
    externalUrl: values.externalUrl?.trim() || undefined,
  }
}

export function useTaskForm(
  onSubmitCallback: (form: TaskForm) => void,
  initial?: Partial<TaskForm>
) {
  const startValues: TaskForm = { ...INITIAL_VALUES, ...initial }

  const { handleSubmit, defineField, errors } = useForm<TaskForm>({
    validationSchema: toTypedSchema(taskFormSchema),
    initialValues: startValues,
  })

  const [title, titleAttrs] = defineField('title')
  const [description, descriptionAttrs] = defineField('description')
  const [taskStatus] = defineField('taskStatus')
  const [gitUrl, gitUrlAttrs] = defineField('gitUrl')
  const [jiraUrl, jiraUrlAttrs] = defineField('jiraUrl')
  const [externalUrl, externalUrlAttrs] = defineField('externalUrl')

  const hasDescriptionElement = ref(Boolean(startValues.description))
  const hasGitElement = ref(Boolean(startValues.gitUrl))
  const hasJiraElement = ref(Boolean(startValues.jiraUrl))
  const hasExternalElement = ref(Boolean(startValues.externalUrl))

  const selectedTaskStatus = computed(() =>
    TASK_STATUS_OPTIONS.find(opt => opt.value === taskStatus.value)
  )

  const visibleAddElementOptions = computed(() =>
    ADD_ELEMENT_OPTIONS.filter(opt => {
      if (opt.type === AddElementType.DESCRIPTION) return !hasDescriptionElement.value
      if (opt.type === AddElementType.GIT) return !hasGitElement.value
      if (opt.type === AddElementType.JIRA) return !hasJiraElement.value
      if (opt.type === AddElementType.EXTERNAL) return !hasExternalElement.value
      return true
    })
  )

  const hasExtendedContent = computed(
    () =>
      hasDescriptionElement.value ||
      hasGitElement.value ||
      hasJiraElement.value ||
      hasExternalElement.value
  )

  const formErrors = computed(() => {
    const entries = Object.entries(errors.value).filter(
      (entry): entry is [string, string] => typeof entry[1] === 'string'
    )
    const byMessage = new Map<string, string[]>()
    for (const [key, message] of entries) {
      const keys = byMessage.get(message) ?? []
      keys.push(key)
      byMessage.set(message, keys)
    }
    return Array.from(byMessage.entries(), ([message, keys]) => ({ message, keys }))
  })

  function resetForm() {
    title.value = ''
    description.value = ''
    hasDescriptionElement.value = false
    gitUrl.value = ''
    jiraUrl.value = ''
    hasGitElement.value = false
    hasJiraElement.value = false
    externalUrl.value = ''
    hasExternalElement.value = false
  }

  const onSubmit = handleSubmit(values => {
    onSubmitCallback(normalizeSubmitPayload(values))
    resetForm()
  })

  function onAddElement(type: AddElementType) {
    if (type === AddElementType.DESCRIPTION) hasDescriptionElement.value = true
    else if (type === AddElementType.GIT) hasGitElement.value = true
    else if (type === AddElementType.JIRA) hasJiraElement.value = true
    else if (type === AddElementType.EXTERNAL) hasExternalElement.value = true
  }

  function removeGitElement() {
    hasGitElement.value = false
    gitUrl.value = ''
  }

  function removeJiraElement() {
    hasJiraElement.value = false
    jiraUrl.value = ''
  }

  function removeExternalElement() {
    hasExternalElement.value = false
    externalUrl.value = ''
  }

  return {
    // Form
    handleSubmit: onSubmit,
    errors,
    formErrors,
    isSubmitDisabled: computed(() => !title.value?.trim()),

    // Fields
    title,
    titleAttrs,
    description,
    descriptionAttrs,
    taskStatus,
    gitUrl,
    gitUrlAttrs,
    jiraUrl,
    jiraUrlAttrs,
    externalUrl,
    externalUrlAttrs,

    // UI state
    hasDescriptionElement,
    hasGitElement,
    hasJiraElement,
    hasExternalElement,
    hasExtendedContent,

    // Options
    taskStatusOptions: TASK_STATUS_OPTIONS,
    selectedTaskStatus,
    visibleAddElementOptions,

    // Actions
    onAddElement,
    removeGitElement,
    removeJiraElement,
    removeExternalElement,
  }
}
