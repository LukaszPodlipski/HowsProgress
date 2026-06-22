export enum TaskStatus {
  TO_DO = 'to_do',
  IN_PROGRESS = 'in_progress',
  COMPLETED = 'completed',
}

export const TASK_STATUS_CYCLE_ORDER: TaskStatus[] = [
  TaskStatus.TO_DO,
  TaskStatus.IN_PROGRESS,
  TaskStatus.COMPLETED,
]

export const getNextTaskStatus = (current: TaskStatus): TaskStatus => {
  const index = TASK_STATUS_CYCLE_ORDER.indexOf(current)
  const nextIndex = (index + 1) % TASK_STATUS_CYCLE_ORDER.length
  return TASK_STATUS_CYCLE_ORDER[nextIndex]!
}

export enum AddElementType {
  DESCRIPTION = 'description',
  GIT = 'git',
  JIRA = 'jira',
  EXTERNAL = 'external',
}

export const WORKSPACE_EMOJI_OPTIONS = [
  '📋',
  '🚀',
  '💡',
  '🔧',
  '🎯',
  '📝',
  '⚙️',
  '🏗️',
  '🔍',
  '✅',
  '📊',
  '🛠️',
]
