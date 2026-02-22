<script setup lang="ts">
import { Toaster } from '@/components/ui/sonner'
</script>

<template>
  <div class="min-h-screen flex flex-col items-center">
    <nav class="fixed top-0 left-0 right-0 z-100 py-1 px-2">
      <div class="flex items-center gap-4 justify-between max-w-4xl mx-auto">
        <NuxtImg src="/logo.png" alt="How's progress?" width="50" height="50" />
        <Avatar class="w-[32px] h-[32px]">
          <AvatarImage src="https://github.com/shadcn.png" alt="@evilrabbit" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
    </nav>
    <main class="flex flex-col tems-center w-full">
      <NuxtPage class="w-full" />
    </main>
  </div>
  <Toaster position="top-center" theme="dark" />
</template>
