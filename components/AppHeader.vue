<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { toast } from 'vue-sonner'

const { carryOverOpenTasks, carryOverOpenTaskCount, restoreTasksSnapshot } = useTasks()
const { t } = useI18n()

const isCarryingOver = ref(false)

const isCarryOverDisabled = computed(
  () => carryOverOpenTaskCount.value === 0 || isCarryingOver.value
)

const handleCarryOver = async () => {
  if (isCarryingOver.value) return
  isCarryingOver.value = true
  try {
    const { count, snapshot } = await carryOverOpenTasks()
    if (count > 0) {
      toast(t('carryOver.success', { count }), {
        action: {
          label: t('task.undo'),
          onClick: () => restoreTasksSnapshot(snapshot),
        },
      })
    } else {
      toast(t('carryOver.none'))
    }
  } finally {
    isCarryingOver.value = false
  }
}
</script>

<template>
  <header class="flex h-12 shrink-0 items-center gap-2 px-4 border-b border-border/50">
    <SidebarTrigger class="-ml-1" />
    <Button
      variant="outline"
      size="sm"
      class="ml-auto hidden gap-2 md:inline-flex"
      :disabled="isCarryOverDisabled"
      :aria-label="t('carryOver.buttonAriaLabel')"
      @click="handleCarryOver"
    >
      <Icon name="lucide:calendar-arrow-down" class="size-4" />
      {{ t('carryOver.button') }}
    </Button>

    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          variant="outline"
          size="icon-sm"
          class="ml-auto md:hidden"
          :aria-label="t('carryOver.menuAriaLabel')"
        >
          <Icon name="lucide:ellipsis" class="size-4" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem :disabled="isCarryOverDisabled" @click="handleCarryOver">
          <Icon name="lucide:calendar-arrow-down" class="size-4" />
          {{ t('carryOver.button') }}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  </header>
</template>
