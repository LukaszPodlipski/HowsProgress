import type { User, Auth } from 'firebase/auth'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'
import { signInWithGoogleTauri } from '@/lib/googleOauthTauri'
import { isTauriRuntime } from '@/lib/tauriRuntime'

const LOCAL_MODE_KEY = 'how-is-your-progress-local-mode'

const currentUser = ref<User | null>(null)
const authReady = ref(false)
const isLocalMode = ref<boolean>(
  typeof window !== 'undefined' && localStorage.getItem(LOCAL_MODE_KEY) === 'true'
)

export const useAuth = () => {
  const { $firebaseAuth } = useNuxtApp()
  const config = useRuntimeConfig()

  const initAuth = (): Promise<void> => {
    return new Promise(resolve => {
      onAuthStateChanged($firebaseAuth as Auth, user => {
        currentUser.value = user
        if (!authReady.value) {
          authReady.value = true
          resolve()
        }
      })
    })
  }

  const signInWithGoogle = async () => {
    const auth = $firebaseAuth as Auth

    if (isTauriRuntime()) {
      const clientId = config.public.googleClientId
      const clientSecret = config.public.googleClientSecret
      if (!clientId) {
        throw new Error('Google OAuth client ID is not configured')
      }
      if (!clientSecret) {
        throw new Error('Google OAuth client secret is not configured')
      }
      await signInWithGoogleTauri(auth, clientId, clientSecret)
      return
    }

    const provider = new GoogleAuthProvider()
    await signInWithPopup(auth, provider)
  }

  const signOut = async () => {
    await firebaseSignOut($firebaseAuth as Auth)
    isLocalMode.value = false
    localStorage.removeItem(LOCAL_MODE_KEY)
  }

  const continueLocally = () => {
    isLocalMode.value = true
    localStorage.setItem(LOCAL_MODE_KEY, 'true')
  }

  const isLoggedIn = computed(() => currentUser.value !== null)

  const userInitials = computed(() => {
    const name = currentUser.value?.displayName
    if (!name) return '?'
    return name
      .split(' ')
      .slice(0, 2)
      .map(part => part[0])
      .join('')
      .toUpperCase()
  })

  return {
    currentUser: readonly(currentUser),
    isLoggedIn,
    isLocalMode: readonly(isLocalMode),
    userInitials,
    initAuth,
    signInWithGoogle,
    signOut,
    continueLocally,
  }
}
