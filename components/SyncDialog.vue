<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'

defineProps<{ open: boolean; taskCount: number }>()

const emit = defineEmits<{
  (e: 'sync' | 'dismiss'): void
}>()

const { t } = useI18n()
</script>

<template>
  <Dialog :open="open">
    <DialogContent hide-close-button class="max-w-sm">
      <DialogHeader class="pb-0">
        <DialogTitle class="text-base">{{ t('sync.title') }}</DialogTitle>
      </DialogHeader>
      <div class="flex flex-col gap-4 px-4 pb-4">
        <p class="text-sm text-muted-foreground leading-relaxed">
          {{ t('sync.description', { count: taskCount }) }}
        </p>
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="emit('dismiss')">{{ t('sync.dismiss') }}</Button>
          <Button @click="emit('sync')">{{ t('sync.confirm') }}</Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
