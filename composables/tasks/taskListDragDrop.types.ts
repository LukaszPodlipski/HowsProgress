export type DropPlacement = 'default' | 'before-separator' | 'after-separator'

export type DropTarget = {
  insertIndex: number
  targetDisplayDate: string
  placement: DropPlacement
  indicatorIndex: number
}
