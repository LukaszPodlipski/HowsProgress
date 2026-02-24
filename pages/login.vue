<script setup lang="ts">
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const { isLoggedIn, signInWithGoogle, continueLocally } = useAuth()
const { t } = useI18n()

if (isLoggedIn.value) {
  await navigateTo('/')
}

const handleContinueLocally = () => {
  continueLocally()
  navigateTo('/')
}

const handleSignInWithGoogle = () => {
  signInWithGoogle().then(async () => {
    await navigateTo('/')
  })
}
</script>

<template>
  <div class="min-h-screen bg-background flex items-center justify-center p-4">
    <div
      class="w-full max-w-sm bg-card border border-border rounded-xl shadow-sm p-8 flex flex-col gap-6"
    >
      <div class="flex flex-col items-center gap-2 text-center">
        <NuxtImg src="/logo.png" alt="How's Progress?" width="56" height="56" />
        <h1 class="text-xl font-semibold tracking-tight">How's Progress?</h1>
        <p class="text-sm text-muted-foreground">{{ t('auth.tagline') }}</p>
      </div>

      <div class="flex flex-col gap-3">
        <Button class="w-full" @click="handleSignInWithGoogle">
          <Icon name="logos:google-icon" class="size-4" />
          {{ t('auth.signInWithGoogle') }}
        </Button>

        <div class="flex items-center gap-3">
          <Separator class="flex-1" />
          <span class="text-xs text-muted-foreground">lub</span>
          <Separator class="flex-1" />
        </div>

        <Button variant="outline" class="w-full" @click="handleContinueLocally">
          {{ t('auth.continueLocally') }}
        </Button>
      </div>

      <p class="text-xs text-muted-foreground text-center">
        {{ t('auth.localModeDisclaimer') }}
      </p>
    </div>
  </div>
</template>
