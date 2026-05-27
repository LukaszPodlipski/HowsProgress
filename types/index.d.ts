import type { TaskStatus } from './enums'

export interface Task {
  id: string
  title: string
  description?: string
  status: TaskStatus
  createdAt: string
  displayDate: string
  gitUrl?: string
  jiraUrl?: string
  externalUrl?: string
  order: number
}

export interface Workspace {
  id: string
  name: string
  emoji: string
  order: number
  createdAt: string
}
