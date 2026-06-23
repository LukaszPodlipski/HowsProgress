import { start, cancel, onUrl, onInvalidUrl } from '@fabianlars/tauri-plugin-oauth'
import { openUrl } from '@tauri-apps/plugin-opener'
import { GoogleAuthProvider, signInWithCredential, type Auth } from 'firebase/auth'
import { OAUTH_CALLBACK_HTML } from '@/lib/oauthCallbackPage'

const GOOGLE_AUTH_URL = 'https://accounts.google.com/o/oauth2/v2/auth'
const GOOGLE_TOKEN_URL = 'https://oauth2.googleapis.com/token'
const OAUTH_SCOPES = ['openid', 'email', 'profile'].join(' ')
const OAUTH_TIMEOUT_MS = 5 * 60 * 1000
/** Must match Authorized redirect URIs on the Web OAuth client. */
export const TAURI_GOOGLE_OAUTH_PORT = 42819

type GoogleTokenResponse = {
  access_token: string
  id_token?: string
  token_type: string
  expires_in: number
}

const base64UrlEncode = (bytes: Uint8Array): string => {
  let binary = ''
  for (const byte of bytes) {
    binary += String.fromCharCode(byte)
  }
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

const createCodeVerifier = (): string => {
  const bytes = crypto.getRandomValues(new Uint8Array(32))
  return base64UrlEncode(bytes)
}

const createCodeChallenge = async (verifier: string): Promise<string> => {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(verifier))
  return base64UrlEncode(new Uint8Array(digest))
}

const buildGoogleAuthUrl = (
  clientId: string,
  redirectUri: string,
  codeChallenge: string
): string => {
  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: OAUTH_SCOPES,
    prompt: 'select_account',
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  })

  return `${GOOGLE_AUTH_URL}?${params.toString()}`
}

const parseAuthCodeFromRedirect = (url: string): string | null => {
  try {
    return new URL(url).searchParams.get('code')
  } catch {
    return null
  }
}

const isRedirectForPort = (url: string, port: number): boolean =>
  url.startsWith(`http://127.0.0.1:${port}`) || url.startsWith(`http://localhost:${port}`)

const exchangeAuthCode = async (
  code: string,
  codeVerifier: string,
  clientId: string,
  clientSecret: string,
  redirectUri: string
): Promise<GoogleTokenResponse> => {
  const response = await fetch(GOOGLE_TOKEN_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: codeVerifier,
    }),
  })

  if (!response.ok) {
    const details = await response.text()
    throw new Error(`Google token exchange failed: ${details}`)
  }

  return (await response.json()) as GoogleTokenResponse
}

const waitForOAuthRedirect = (port: number): Promise<string> => {
  return new Promise((resolve, reject) => {
    let settled = false
    let unlistenUrl: (() => void) | null = null
    let unlistenInvalid: (() => void) | null = null

    const cleanup = () => {
      clearTimeout(timeoutId)
      unlistenUrl?.()
      unlistenInvalid?.()
    }

    const finish = (callback: () => void) => {
      if (settled) return
      settled = true
      cleanup()
      callback()
    }

    const timeoutId = setTimeout(() => {
      finish(() => reject(new Error('Google sign-in timed out')))
    }, OAUTH_TIMEOUT_MS)

    void (async () => {
      try {
        unlistenUrl = await onUrl(url => {
          if (!isRedirectForPort(url, port)) return
          finish(() => resolve(url))
        })
        unlistenInvalid = await onInvalidUrl(error => {
          finish(() => reject(new Error(error)))
        })
      } catch (error) {
        finish(() =>
          reject(error instanceof Error ? error : new Error('Failed to listen for OAuth redirect'))
        )
      }
    })()
  })
}

export const signInWithGoogleTauri = async (
  auth: Auth,
  clientId: string,
  clientSecret: string
): Promise<void> => {
  if (!clientId) {
    throw new Error('Google OAuth client ID is not configured')
  }
  if (!clientSecret) {
    throw new Error('Google OAuth client secret is not configured')
  }

  const codeVerifier = createCodeVerifier()
  const codeChallenge = await createCodeChallenge(codeVerifier)
  const port = await start({ ports: [TAURI_GOOGLE_OAUTH_PORT], response: OAUTH_CALLBACK_HTML })
  const redirectUri = `http://127.0.0.1:${port}`

  try {
    const redirectPromise = waitForOAuthRedirect(port)
    await openUrl(buildGoogleAuthUrl(clientId, redirectUri, codeChallenge))

    const redirectUrl = await redirectPromise
    const authCode = parseAuthCodeFromRedirect(redirectUrl)

    if (!authCode) {
      throw new Error('Google sign-in did not return an authorization code')
    }

    const tokens = await exchangeAuthCode(
      authCode,
      codeVerifier,
      clientId,
      clientSecret,
      redirectUri
    )
    await signInWithCredential(auth, GoogleAuthProvider.credential(null, tokens.access_token))
  } finally {
    await cancel(port).catch(() => {})
  }
}
