<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WORKSPACE_EMOJI_OPTIONS } from '@/types/enums'

const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { addWorkspace, setActiveWorkspace } = useWorkspaces()

const newName = ref('')
const newEmoji = ref(WORKSPACE_EMOJI_OPTIONS[0])

watch(open, val => {
  if (val) {
    newName.value = ''
    newEmoji.value = WORKSPACE_EMOJI_OPTIONS[0]
  }
})

const handleCreate = async () => {
  const name = newName.value.trim()
  if (!name) return

  const ws = await addWorkspace(name, newEmoji.value!)
  setActiveWorkspace(ws.id)
  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ t('workspace.addTitle') }}</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-4 px-4 mt-1">
        <Input
          v-model="newName"
          :placeholder="t('workspace.namePlaceholder')"
          @keyup.enter="handleCreate"
        />

        <div class="grid grid-cols-6 gap-4 justify-items-center">
          <button
            v-for="emoji in WORKSPACE_EMOJI_OPTIONS"
            :key="emoji"
            type="button"
            class="flex items-center justify-center h-9 w-9 rounded-md text-xl transition-colors hover:bg-accent"
            :class="newEmoji === emoji ? 'bg-accent ring-2 ring-ring' : ''"
            @click="newEmoji = emoji"
          >
            {{ emoji }}
          </button>
        </div>

        <div class="flex justify-end gap-3 pb-4">
          <Button variant="outline" @click="open = false">
            {{ t('workspace.cancel') }}
          </Button>
          <Button :disabled="!newName.trim()" @click="handleCreate">
            {{ t('workspace.create') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
