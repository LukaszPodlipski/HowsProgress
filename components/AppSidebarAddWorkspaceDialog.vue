<script setup lang="ts">
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { WORKSPACE_EMOJI_OPTIONS } from '@/types/enums'
import type { Workspace } from '@/types'

const props = defineProps<{ workspace?: Workspace | null }>()
const open = defineModel<boolean>('open', { required: true })

const { t } = useI18n()
const { addWorkspace, updateWorkspace, setActiveWorkspace } = useWorkspaces()

const isEdit = computed(() => !!props.workspace)

const name = ref('')
const emoji = ref(WORKSPACE_EMOJI_OPTIONS[0])

watch(open, val => {
  if (val) {
    name.value = props.workspace?.name ?? ''
    emoji.value = props.workspace?.emoji ?? WORKSPACE_EMOJI_OPTIONS[0]
  }
})

const handleSubmit = async () => {
  const trimmed = name.value.trim()
  if (!trimmed) return

  if (isEdit.value && props.workspace) {
    await updateWorkspace(props.workspace.id, trimmed, emoji.value!)
  } else {
    const ws = await addWorkspace(trimmed, emoji.value!)
    setActiveWorkspace(ws.id)
  }

  open.value = false
}
</script>

<template>
  <Dialog v-model:open="open">
    <DialogContent class="sm:max-w-sm">
      <DialogHeader>
        <DialogTitle>{{ isEdit ? t('workspace.editTitle') : t('workspace.addTitle') }}</DialogTitle>
      </DialogHeader>

      <div class="flex flex-col gap-4 px-4 mt-1">
        <Input
          v-model="name"
          :placeholder="t('workspace.namePlaceholder')"
          @keyup.enter="handleSubmit"
        />

        <div class="grid grid-cols-6 gap-4 justify-items-center">
          <button
            v-for="e in WORKSPACE_EMOJI_OPTIONS"
            :key="e"
            type="button"
            class="flex items-center justify-center h-9 w-9 rounded-md text-xl transition-colors hover:bg-accent"
            :class="emoji === e ? 'bg-accent ring-2 ring-ring' : ''"
            @click="emoji = e"
          >
            {{ e }}
          </button>
        </div>

        <div class="flex justify-end gap-3 pb-4">
          <Button variant="outline" @click="open = false">
            {{ t('workspace.cancel') }}
          </Button>
          <Button :disabled="!name.trim()" @click="handleSubmit">
            {{ isEdit ? t('workspace.save') : t('workspace.create') }}
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
