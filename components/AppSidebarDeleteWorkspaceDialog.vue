<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import type { Workspace } from '@/types'

const props = defineProps<{ workspace: Workspace | null }>()
const open = defineModel<boolean>('open', { required: true })

const emit = defineEmits<{ confirm: [wsId: string] }>()

const { t } = useI18n()

const handleConfirm = () => {
  if (!props.workspace) return
  emit('confirm', props.workspace.id)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ t('workspace.deleteTitle') }}</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-6 px-4 pb-4">
        <p class="text-sm text-muted-foreground">
          {{ t('workspace.deleteDescription', { name: workspace?.name ?? '' }) }}
        </p>

        <div class="flex justify-end gap-3">
          <Button variant="outline" @click="open = false">
            {{ t('workspace.cancel') }}
          </Button>
          <Button variant="destructive" @click="handleConfirm">
            {{ t('workspace.deleteConfirm') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
