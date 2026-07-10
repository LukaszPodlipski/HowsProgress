import type { Task } from '@/types'
import {
  formatDateGroupLabel,
  getGroupKey,
  sortTasksByDisplayDate,
} from '@/composables/tasks/taskDateGroups'
import type { Ref } from 'vue'
import { useI18n } from 'vue-i18n'

export const useSortedTasks = (tasks: Ref<Task[]>) => {
  const { t } = useI18n()

  const sortedTasks = computed(() => sortTasksByDisplayDate(tasks.value, new Date()))

  const isEmpty = computed(() => sortedTasks.value.length === 0)

  const dateSeparators = computed(() => {
    const now = new Date()
    const separators = new Map<string, string>()
    let lastGroupKey = ''

    for (const task of sortedTasks.value) {
      const key = getGroupKey(task.displayDate, now)
      if (key !== lastGroupKey) {
        separators.set(
          task.id,
          formatDateGroupLabel(task.displayDate, now, {
            today: t('dateSeparator.today'),
            yesterday: t('dateSeparator.yesterday'),
            dayBeforeYesterday: t('dateSeparator.dayBeforeYesterday'),
            friday: displayDate => {
              const date = new Date(displayDate + 'T00:00:00')
              const formatted = date.toLocaleDateString('pl-PL', {
                day: 'numeric',
                month: 'long',
              })
              return t('dateSeparator.friday', { date: formatted })
            },
          })
        )
        lastGroupKey = key
      }
    }

    return separators
  })

  const hasSeparatorBefore = (taskIndex: number): boolean => {
    const task = sortedTasks.value[taskIndex]
    return task != null && dateSeparators.value.has(task.id)
  }

  return {
    sortedTasks,
    isEmpty,
    dateSeparators,
    hasSeparatorBefore,
  }
}
