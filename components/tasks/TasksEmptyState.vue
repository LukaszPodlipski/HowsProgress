<script setup lang="ts">
import { Button } from '@/components/ui/button'

const emit = defineEmits<{
  (e: 'select-suggestion', title: string): void
}>()

const { t } = useI18n()
const { currentUser, isLoggedIn } = useAuth()

const firstName = computed(() => currentUser.value?.displayName?.split(' ')[0] ?? '')

const welcomeTitle = computed(() =>
  isLoggedIn.value && firstName.value
    ? t('onboarding.welcomeNamed', { name: firstName.value })
    : t('onboarding.welcome')
)

const tips = computed(() => [
  { icon: 'lucide:pencil-line', text: t('onboarding.tip1') },
  { icon: 'lucide:link', text: t('onboarding.tip2') },
  { icon: 'lucide:hand', text: t('onboarding.tip3') },
])

const suggestions = computed(() => [
  t('onboarding.suggestion1'),
  t('onboarding.suggestion2'),
  t('onboarding.suggestion3'),
])
</script>

<template>
  <div class="flex flex-col items-center gap-6 px-4 py-8 text-center max-w-md mx-auto">
    <div class="flex flex-col items-center gap-2">
      <div
        class="flex size-12 items-center justify-center rounded-xl bg-primary/10 text-primary"
        aria-hidden="true"
      >
        <Icon name="lucide:sparkles" class="size-6" />
      </div>
      <h2 class="text-lg font-semibold tracking-tight">{{ welcomeTitle }}</h2>
      <p class="text-sm text-muted-foreground leading-relaxed">{{ t('onboarding.description') }}</p>
    </div>

    <ul class="w-full flex flex-col gap-2.5 text-left">
      <li
        v-for="tip in tips"
        :key="tip.text"
        class="flex items-start gap-3 text-sm text-muted-foreground"
      >
        <Icon
          :name="tip.icon"
          class="size-4 shrink-0 mt-0.5 text-foreground/70"
          aria-hidden="true"
        />
        <span>{{ tip.text }}</span>
      </li>
    </ul>

    <div class="w-full flex flex-col gap-2">
      <p class="text-xs font-medium text-muted-foreground uppercase tracking-wide">
        {{ t('onboarding.suggestionsLabel') }}
      </p>
      <div class="flex flex-wrap justify-center gap-2">
        <Button
          v-for="suggestion in suggestions"
          :key="suggestion"
          type="button"
          variant="outline"
          size="sm"
          class="rounded-full"
          @click="emit('select-suggestion', suggestion)"
        >
          {{ suggestion }}
        </Button>
      </div>
    </div>
  </div>
</template>
