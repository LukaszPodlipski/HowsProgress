<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { SidebarTrigger } from '@/components/ui/sidebar'
import { toast } from 'vue-sonner'

const { carryOverOpenTasks, carryOverOpenTaskCount } = useTasks()
const { t } = useI18n()

const isCarryingOver = ref(false)

const handleCarryOver = async () => {
  if (isCarryingOver.value) return
  isCarryingOver.value = true
  try {
    const count = await carryOverOpenTasks()
    if (count > 0) {
      toast(t('carryOver.success', { count }))
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
      class="ml-auto gap-2"
      :disabled="carryOverOpenTaskCount === 0 || isCarryingOver"
      :aria-label="t('carryOver.buttonAriaLabel')"
      @click="handleCarryOver"
    >
      <Icon name="lucide:calendar-arrow-down" class="size-4" />
      {{ t('carryOver.button') }}
    </Button>
  </header>
</template>
