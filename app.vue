<template>
  <div class="min-h-screen flex flex-col">
    <nav class="bg-background border border-border p-1">
      <div class="flex items-center gap-4 justify-between max-w-3xl mx-auto">
        <NuxtImg src="/logo.png" alt="How's progress?" width="50" height="50" />
        <Avatar class="w-[32px] h-[32px]">
          <AvatarImage src="https://github.com/shadcn.png" alt="@evilrabbit" />
          <AvatarFallback>ER</AvatarFallback>
        </Avatar>
      </div>
    </nav>
    <main class="flex-1 flex flex-col">
      <NuxtPage class="flex-1" />
    </main>
  </div>
</template>
