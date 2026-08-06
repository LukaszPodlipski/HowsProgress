<script setup lang="ts">
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  useSidebar,
} from '@/components/ui/sidebar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip'
import type { Workspace } from '@/types'

const { t } = useI18n()
const { workspaces, activeWorkspaceId, setActiveWorkspace, deleteWorkspace, reorderWorkspaces } =
  useWorkspaces()
const { isMobile, setOpenMobile } = useSidebar()

const showAddDialog = ref(false)
const showEditDialog = ref(false)
const showDeleteDialog = ref(false)
const workspaceToEdit = ref<Workspace | null>(null)
const workspaceToDelete = ref<Workspace | null>(null)
const openMenuWsId = ref<string | null>(null)

const workspaceRefs = ref(new Map<string, HTMLElement>())

const setWorkspaceRef = (el: unknown, wsId: string) => {
  const htmlEl = el && typeof el === 'object' && '$el' in el ? (el as { $el: unknown }).$el : el

  if (htmlEl instanceof HTMLElement) workspaceRefs.value.set(wsId, htmlEl)
  else workspaceRefs.value.delete(wsId)
}

const { draggedWsId, pressingId, dropIndicatorIndex, onPointerDown, onClickCapture } =
  useWorkspaceListDragDrop({
    workspaces,
    workspaceRefs,
    reorderWorkspaces,
  })

const openAddDialog = () => {
  showAddDialog.value = true
}

const openEditDialog = (ws: Workspace) => {
  workspaceToEdit.value = ws
  showEditDialog.value = true
}

const openDeleteDialog = (ws: Workspace) => {
  workspaceToDelete.value = ws
  showDeleteDialog.value = true
}

const handleDeleteConfirm = async (wsId: string) => {
  await deleteWorkspace(wsId)
}

const handleSelectWorkspace = (wsId: string) => {
  if (draggedWsId.value) return
  setActiveWorkspace(wsId)
  if (isMobile.value) setOpenMobile(false)
}
</script>

<template>
  <SidebarGroup class="pr-1!" data-tour="workspaces">
    <SidebarGroupLabel>{{ t('workspace.sectionLabel') }}</SidebarGroupLabel>
    <SidebarGroupContent>
      <TooltipProvider :delay-duration="300">
        <SidebarMenu>
          <template v-for="(ws, index) in workspaces" :key="ws.id">
            <SidebarMenuItem
              :ref="el => setWorkspaceRef(el, ws.id)"
              class="group/item relative min-w-0 touch-manipulation"
              :data-workspace-drop-id="ws.id"
              :class="{ 'opacity-35 pointer-events-none': draggedWsId === ws.id }"
              @pointerdown="onPointerDown(ws.id, $event)"
              @click.capture="onClickCapture"
            >
              <div
                v-if="dropIndicatorIndex === index"
                class="absolute inset-x-2 top-0 z-10 h-0.5 -translate-y-[calc(50%+0.125rem)] rounded-full bg-primary pointer-events-none"
                aria-hidden="true"
              />
              <div
                v-if="index === workspaces.length - 1 && dropIndicatorIndex === workspaces.length"
                class="absolute inset-x-2 bottom-0 z-10 h-0.5 translate-y-[calc(50%+0.125rem)] rounded-full bg-primary pointer-events-none"
                aria-hidden="true"
              />
              <SidebarMenuButton
                :is-active="ws.id === activeWorkspaceId"
                :class="[
                  'min-w-0 pr-8 group-hover/item:bg-sidebar-accent group-hover/item:text-sidebar-accent-foreground',
                  openMenuWsId === ws.id || pressingId === ws.id
                    ? 'bg-sidebar-accent text-sidebar-accent-foreground'
                    : '',
                ]"
                @click="handleSelectWorkspace(ws.id)"
              >
                <span class="text-base leading-none shrink-0">{{ ws.emoji }}</span>
                <Tooltip>
                  <TooltipTrigger as-child>
                    <span class="group-data-[collapsible=icon]:hidden min-w-0 truncate">{{
                      ws.name
                    }}</span>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    {{ ws.name }}
                  </TooltipContent>
                </Tooltip>
              </SidebarMenuButton>

              <DropdownMenu @update:open="val => (openMenuWsId = val ? ws.id : null)">
                <DropdownMenuTrigger as-child>
                  <button
                    data-no-long-press
                    :class="[
                      'absolute cursor-pointer right-1 top-1/2 -translate-y-1/2 flex items-center justify-center size-6 rounded-md hover:bg-accent transition-opacity group-hover/item:opacity-100',
                      openMenuWsId === ws.id ? 'opacity-100' : 'opacity-0',
                    ]"
                    @click.stop
                  >
                    <Icon name="lucide:ellipsis" class="size-3.5" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent side="bottom" align="start">
                  <DropdownMenuItem @click="openEditDialog(ws)">
                    <Icon name="lucide:pencil" class="size-4" />
                    {{ t('workspace.edit') }}
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    class="text-destructive focus:text-destructive"
                    @click="openDeleteDialog(ws)"
                  >
                    <Icon name="lucide:trash-2" class="size-4" />
                    {{ t('workspace.delete') }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </SidebarMenuItem>
          </template>

          <SidebarMenuItem>
            <SidebarMenuButton
              class="group-data-[collapsible=icon]:px-[10px]!"
              @click="openAddDialog"
            >
              <Icon name="lucide:plus" class="size-4 shrink-0" />
              <span class="group-data-[collapsible=icon]:hidden">{{ t('workspace.add') }}</span>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </TooltipProvider>
    </SidebarGroupContent>
  </SidebarGroup>

  <AppSidebarAddWorkspaceDialog v-model:open="showAddDialog" />
  <AppSidebarAddWorkspaceDialog v-model:open="showEditDialog" :workspace="workspaceToEdit" />

  <AppSidebarDeleteWorkspaceDialog
    v-model:open="showDeleteDialog"
    :workspace="workspaceToDelete"
    @confirm="handleDeleteConfirm"
  />
</template>
