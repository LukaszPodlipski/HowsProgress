import { spawnSync } from 'node:child_process'

process.env.NUXT_APP_BASE_URL = './'
process.env.TAURI_ENV_PLATFORM = 'desktop'

const result = spawnSync('npx', ['nuxt', 'generate'], {
  stdio: 'inherit',
  shell: true,
  env: process.env,
})

process.exit(result.status ?? 1)
