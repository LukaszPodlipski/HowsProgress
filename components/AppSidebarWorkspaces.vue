<script setup lang="ts">
import {
  SidebarGroup,
  SidebarGroupLabel,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
} from '@/components/ui/sidebar'

const { t } = useI18n()
const { workspaces, activeWorkspaceId, setActiveWorkspace } = useWorkspaces()

const showAddDialog = ref(false)

const openAddDialog = () => {
  showAddDialog.value = true
}
</script>

<template>
  <SidebarGroup>
    <SidebarGroupLabel>{{ t('workspace.sectionLabel') }}</SidebarGroupLabel>
    <SidebarGroupContent>
      <SidebarMenu>
        <SidebarMenuItem v-for="ws in workspaces" :key="ws.id">
          <SidebarMenuButton
            :is-active="ws.id === activeWorkspaceId"
            @click="setActiveWorkspace(ws.id)"
          >
            <span class="text-base leading-none shrink-0">{{ ws.emoji }}</span>
            <span class="group-data-[collapsible=icon]:hidden truncate">{{ ws.name }}</span>
          </SidebarMenuButton>
        </SidebarMenuItem>

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
    </SidebarGroupContent>
  </SidebarGroup>

  <AppSidebarAddWorkspaceDialog v-model:open="showAddDialog" />
</template>
