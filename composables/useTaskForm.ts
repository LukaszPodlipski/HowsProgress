import { useForm } from 'vee-validate'
import { toTypedSchema } from '@vee-validate/zod'
import { z } from 'zod'
import { AddElementType, TaskStatus } from '@/types/enums'
import { useI18n } from 'vue-i18n'

// Strukturalny schemat używany wyłącznie do inferencji typu TaskForm
const _optionalUrl = z.union([z.literal(''), z.string().url()]).optional()

export const taskFormSchema = z.object({
  title: z.string().max(100),
  description: z.string().max(1000).optional(),
  taskStatus: z.nativeEnum(TaskStatus),
  gitUrl: _optionalUrl,
  jiraUrl: _optionalUrl,
  externalUrl: _optionalUrl,
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
  const { t } = useI18n()

  const urlSchema = z.string().url(t('validation.invalidUrl'))
  const optionalUrlSchema = z.union([z.literal(''), urlSchema]).optional()

  const schema = z.object({
    title: z.string().max(100, t('validation.titleMaxLength')),
    description: z.string().max(1000, t('validation.descriptionMaxLength')).optional(),
    taskStatus: z.nativeEnum(TaskStatus),
    gitUrl: optionalUrlSchema,
    jiraUrl: optionalUrlSchema,
    externalUrl: optionalUrlSchema,
  })

  const TASK_STATUS_OPTIONS = [
    {
      label: t('task.statusCompleted'),
      icon: 'lets-icons:done-duotone',
      iconColor: 'text-green-500',
      value: TaskStatus.COMPLETED,
    },
    {
      label: t('task.statusInProgress'),
      icon: 'lets-icons:clock-duotone',
      iconColor: 'text-yellow-500',
      value: TaskStatus.IN_PROGRESS,
    },
  ] as const

  const ADD_ELEMENT_OPTIONS: ReadonlyArray<{
    type: AddElementType
    label: string
    icon: string
  }> = [
    {
      type: AddElementType.DESCRIPTION,
      label: t('task.elementDescription'),
      icon: 'lucide:align-left',
    },
    { type: AddElementType.GIT, label: t('task.elementGit'), icon: 'lucide:git-branch' },
    { type: AddElementType.JIRA, label: t('task.elementJira'), icon: 'simple-icons:jira' },
    {
      type: AddElementType.EXTERNAL,
      label: t('task.elementExternal'),
      icon: 'lucide:external-link',
    },
  ]

  const startValues: TaskForm = { ...INITIAL_VALUES, ...initial }

  const { handleSubmit, defineField, errors } = useForm<TaskForm>({
    validationSchema: toTypedSchema(schema),
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
