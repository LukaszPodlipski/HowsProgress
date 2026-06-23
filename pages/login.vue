<script setup lang="ts">
import { toast } from 'vue-sonner'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

const { isLoggedIn, signInWithGoogle, continueLocally } = useAuth()
const { t } = useI18n()

const isSigningIn = ref(false)

if (isLoggedIn.value) {
  await navigateTo('/')
}

const handleContinueLocally = () => {
  continueLocally()
  navigateTo('/')
}

const handleSignInWithGoogle = async () => {
  if (isSigningIn.value) return

  isSigningIn.value = true
  const toastId = toast.loading(t('auth.signInInProgress'))

  try {
    await signInWithGoogle()
    toast.dismiss(toastId)
    await navigateTo('/')
  } catch (error) {
    toast.dismiss(toastId)

    const message = error instanceof Error ? error.message : t('auth.signInFailed')
    if (message.includes('Google OAuth client secret')) {
      toast.error(t('auth.signInMissingClientSecret'))
    } else if (message.includes('Desktop Google OAuth client ID')) {
      toast.error(t('auth.signInMissingDesktopClientId'))
    } else if (message.includes('Google OAuth client ID')) {
      toast.error(t('auth.signInMissingClientId'))
    } else {
      toast.error(message.length > 120 ? t('auth.signInFailed') : message)
    }
  } finally {
    isSigningIn.value = false
  }
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
        <Button class="w-full" :disabled="isSigningIn" @click="handleSignInWithGoogle">
          <Icon name="logos:google-icon" class="size-4" />
          {{ t('auth.signInWithGoogle') }}
        </Button>

        <div class="flex items-center gap-3">
          <Separator class="flex-1" />
          <span class="text-xs text-muted-foreground">lub</span>
          <Separator class="flex-1" />
        </div>

        <Button
          variant="outline"
          class="w-full"
          :disabled="isSigningIn"
          @click="handleContinueLocally"
        >
          {{ t('auth.continueLocally') }}
        </Button>
      </div>

      <p class="text-xs text-muted-foreground text-center">
        {{ t('auth.localModeDisclaimer') }}
      </p>
    </div>
  </div>
</template>
