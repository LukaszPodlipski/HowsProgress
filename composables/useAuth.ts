import type { User, Auth } from 'firebase/auth'
import {
  GoogleAuthProvider,
  onAuthStateChanged,
  signInWithPopup,
  signOut as firebaseSignOut,
} from 'firebase/auth'

const currentUser = ref<User | null>(null)
const authReady = ref(false)

export const useAuth = () => {
  const { $firebaseAuth } = useNuxtApp()

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
    const provider = new GoogleAuthProvider()
    // signInWithPopup works in both browser and Tauri v2 webview (window.open is not restricted by default)
    await signInWithPopup($firebaseAuth as Auth, provider)
  }

  const signOut = async () => {
    await firebaseSignOut($firebaseAuth as Auth)
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
    userInitials,
    initAuth,
    signInWithGoogle,
    signOut,
  }
}
