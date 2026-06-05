<script setup lang="ts">
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
  useSidebar,
} from '@/components/ui/sidebar'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { Button } from '@/components/ui/button'

const { currentUser, isLoggedIn, isLocalMode, userInitials, signOut } = useAuth()
const { t } = useI18n()
const { open } = useSidebar()
</script>

<template>
  <Sidebar variant="inset" collapsible="icon">
    <SidebarHeader>
      <div class="flex items-center gap-4 px-1 py-1 h-8 min-h-8">
        <NuxtImg
          src="/logo.png"
          alt="How's progress?"
          width="16"
          height="16"
          class="shrink-0 min-w-5 min-h-5"
        />
        <span class="font-sans font-semibold group-data-[collapsible=icon]:hidden truncate"
          >So How's Progress?</span
        >
      </div>
    </SidebarHeader>

    <SidebarContent>
      <AppSidebarWorkspaces />
    </SidebarContent>

    <SidebarFooter data-tour="account">
      <SidebarMenu>
        <SidebarMenuItem>
          <template v-if="isLoggedIn">
            <DropdownMenu>
              <DropdownMenuTrigger as-child>
                <SidebarMenuButton size="lg">
                  <Avatar class="h-8 w-8 min-w-8 min-h-8 rounded-lg shrink-0">
                    <AvatarImage
                      v-if="currentUser?.photoURL"
                      :src="currentUser.photoURL"
                      :alt="currentUser?.displayName ?? ''"
                      referrer-policy="no-referrer"
                      class="h-8 w-8 min-w-8 min-h-8"
                    />
                    <AvatarFallback class="rounded-lg text-xs">{{ userInitials }}</AvatarFallback>
                  </Avatar>
                  <div
                    class="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden"
                  >
                    <span class="truncate font-semibold">{{ currentUser?.displayName }}</span>
                    <span class="truncate text-xs text-muted-foreground">{{
                      currentUser?.email
                    }}</span>
                  </div>
                  <Icon
                    name="lucide:chevrons-up-down"
                    class="ml-auto size-4 shrink-0 group-data-[collapsible=icon]:hidden"
                  />
                </SidebarMenuButton>
              </DropdownMenuTrigger>
              <DropdownMenuContent :side="open ? 'top' : 'right'" align="end" class="min-w-48">
                <DropdownMenuLabel>{{ currentUser?.displayName }}</DropdownMenuLabel>
                <DropdownMenuLabel class="font-normal text-muted-foreground text-xs -mt-2">
                  {{ currentUser?.email }}
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem @click="signOut">
                  <Icon name="lucide:log-out" class="size-4" />
                  {{ t('auth.signOut') }}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </template>

          <template v-else-if="isLocalMode">
            <Button
              variant="outline"
              class="w-full justify-center gap-2"
              @click="navigateTo('/login')"
            >
              <Icon name="lucide:log-in" class="size-4 shrink-0" />
              <span class="group-data-[collapsible=icon]:hidden">{{ t('auth.signIn') }}</span>
            </Button>
          </template>
        </SidebarMenuItem>
      </SidebarMenu>
    </SidebarFooter>

    <SidebarRail />
  </Sidebar>
</template>
