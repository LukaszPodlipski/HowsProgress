<script setup lang="ts">
import type { BootstrapPhase } from '@/composables/useAppBootstrap'

const props = defineProps<{
  phase: BootstrapPhase
  exiting?: boolean
}>()

const { t } = useI18n()

const phaseLabel = computed(() => {
  switch (props.phase) {
    case 'auth':
      return t('loader.phaseAuth')
    case 'workspaces':
      return t('loader.phaseWorkspaces')
    case 'tasks':
      return t('loader.phaseTasks')
    case 'ready':
      return t('loader.phaseReady')
    default:
      return t('loader.phaseAuth')
  }
})

const progress = computed(() => {
  switch (props.phase) {
    case 'auth':
      return 28
    case 'workspaces':
      return 62
    case 'tasks':
      return 88
    case 'ready':
      return 100
    default:
      return 0
  }
})

const removeStaticSplash = () => {
  window.__removeAppSplash?.()
}

onMounted(() => {
  removeStaticSplash()
})
</script>

<template>
  <div
    class="app-loader"
    :class="{ 'app-loader--exiting': exiting }"
    role="status"
    aria-live="polite"
    :aria-label="phaseLabel"
  >
    <div class="app-loader__backdrop" aria-hidden="true">
      <div class="app-loader__orb app-loader__orb--primary" />
      <div class="app-loader__orb app-loader__orb--secondary" />
      <div class="app-loader__grid" />
    </div>

    <div class="app-loader__content">
      <div class="app-loader__mark">
        <div class="app-loader__ring" aria-hidden="true" />
        <NuxtImg
          src="/logo.png"
          alt=""
          width="72"
          height="72"
          class="app-loader__logo"
          aria-hidden="true"
        />
      </div>

      <div class="app-loader__copy">
        <h1 class="app-loader__title">How's Progress?</h1>
        <p :key="phase" class="app-loader__phase">{{ phaseLabel }}</p>
      </div>

      <div class="app-loader__progress" aria-hidden="true">
        <div class="app-loader__progress-track">
          <div class="app-loader__progress-bar" :style="{ width: `${progress}%` }" />
        </div>
        <div class="app-loader__dots">
          <span
            v-for="step in 3"
            :key="step"
            class="app-loader__dot"
            :class="{ 'app-loader__dot--active': progress >= step * 33 }"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.app-loader {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: grid;
  place-items: center;
  background: oklch(0.18 0 0);
  color: oklch(0.985 0 0);
  transition:
    opacity 520ms cubic-bezier(0.4, 0, 0.2, 1),
    transform 520ms cubic-bezier(0.4, 0, 0.2, 1);
}

.app-loader--exiting {
  opacity: 0;
  transform: scale(1.02);
  pointer-events: none;
}

.app-loader__backdrop {
  position: absolute;
  inset: 0;
  overflow: hidden;
  pointer-events: none;
}

.app-loader__orb {
  position: absolute;
  border-radius: 9999px;
  filter: blur(80px);
  opacity: 0.45;
  animation: app-loader-float 8s ease-in-out infinite;
}

.app-loader__orb--primary {
  top: 18%;
  left: 50%;
  width: min(42vw, 320px);
  height: min(42vw, 320px);
  transform: translateX(-50%);
  background: oklch(0.488 0.243 264.376 / 0.35);
}

.app-loader__orb--secondary {
  right: 12%;
  bottom: 14%;
  width: min(34vw, 240px);
  height: min(34vw, 240px);
  background: oklch(0.623 0.214 259.815 / 0.22);
  animation-delay: -3s;
}

.app-loader__grid {
  position: absolute;
  inset: 0;
  background-image:
    linear-gradient(oklch(1 0 0 / 3%) 1px, transparent 1px),
    linear-gradient(90deg, oklch(1 0 0 / 3%) 1px, transparent 1px);
  background-size: 48px 48px;
  mask-image: radial-gradient(circle at center, black 20%, transparent 72%);
}

.app-loader__content {
  position: relative;
  z-index: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1.75rem;
  padding: 2rem;
  animation: app-loader-enter 680ms cubic-bezier(0.22, 1, 0.36, 1) both;
}

.app-loader__mark {
  position: relative;
  display: grid;
  place-items: center;
  width: 7.5rem;
  height: 7.5rem;
}

.app-loader__ring {
  position: absolute;
  inset: 0;
  border-radius: 9999px;
  background: conic-gradient(
    from 0deg,
    oklch(0.488 0.243 264.376),
    oklch(0.623 0.214 259.815),
    oklch(0.488 0.243 264.376 / 0.15),
    oklch(0.488 0.243 264.376)
  );
  mask: radial-gradient(farthest-side, transparent calc(100% - 3px), black calc(100% - 3px));
  animation: app-loader-spin 1.4s linear infinite;
}

.app-loader__logo {
  position: relative;
  z-index: 1;
  border-radius: 1rem;
  box-shadow: 0 12px 40px oklch(0.488 0.243 264.376 / 0.25);
  animation: app-loader-pulse 2.4s ease-in-out infinite;
}

.app-loader__copy {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  text-align: center;
}

.app-loader__title {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  letter-spacing: -0.02em;
}

.app-loader__phase {
  margin: 0;
  min-height: 1.25rem;
  font-size: 0.875rem;
  color: oklch(0.705 0.015 286.067);
  animation: app-loader-phase 420ms cubic-bezier(0.22, 1, 0.36, 1);
}

.app-loader__progress {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  width: min(16rem, 72vw);
}

.app-loader__progress-track {
  width: 100%;
  height: 3px;
  overflow: hidden;
  border-radius: 9999px;
  background: oklch(1 0 0 / 8%);
}

.app-loader__progress-bar {
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, oklch(0.488 0.243 264.376), oklch(0.623 0.214 259.815));
  transition: width 520ms cubic-bezier(0.22, 1, 0.36, 1);
  box-shadow: 0 0 16px oklch(0.488 0.243 264.376 / 0.55);
}

.app-loader__dots {
  display: flex;
  gap: 0.5rem;
}

.app-loader__dot {
  width: 0.375rem;
  height: 0.375rem;
  border-radius: 9999px;
  background: oklch(1 0 0 / 18%);
  transition:
    background-color 320ms ease,
    transform 320ms ease;
}

.app-loader__dot--active {
  background: oklch(0.623 0.214 259.815);
  transform: scale(1.15);
}

@keyframes app-loader-enter {
  from {
    opacity: 0;
    transform: translateY(12px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes app-loader-spin {
  to {
    transform: rotate(360deg);
  }
}

@keyframes app-loader-pulse {
  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.04);
  }
}

@keyframes app-loader-float {
  0%,
  100% {
    transform: translate(-50%, 0) scale(1);
  }

  50% {
    transform: translate(-50%, -12px) scale(1.06);
  }
}

@keyframes app-loader-phase {
  from {
    opacity: 0;
    transform: translateY(4px);
  }

  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
