import { initializeApp, getApps } from 'firebase/app'
import { getAuth } from 'firebase/auth'
import { getFirestore } from 'firebase/firestore'

export default defineNuxtPlugin(() => {
  const config = useRuntimeConfig()

  // Guard against double-initialization on hot reload
  const app =
    getApps().length > 0
      ? getApps()[0]!
      : initializeApp({
          apiKey: config.public.firebaseApiKey,
          authDomain: config.public.firebaseAuthDomain,
          projectId: config.public.firebaseProjectId,
          storageBucket: config.public.firebaseStorageBucket,
          messagingSenderId: config.public.firebaseMessagingSenderId,
          appId: config.public.firebaseAppId,
        })

  const auth = getAuth(app)
  const db = getFirestore(app)

  return {
    provide: {
      firebaseAuth: auth,
      firebaseDb: db,
    },
  }
})
