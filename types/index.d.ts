import type { TaskStatus } from './enums'

export interface Task {
  id: string
  text: string
  status: TaskStatus
  createdAt: string // ISO timestamp
}
