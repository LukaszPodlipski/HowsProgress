import type { TaskStatus } from './enums'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: string
  gitUrl?: string
  jiraUrl?: string
  externalUrl?: string
  order: number
}
