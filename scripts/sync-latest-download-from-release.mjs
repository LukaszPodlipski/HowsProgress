import { mkdirSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = join(dirname(fileURLToPath(import.meta.url)), '..')
const outputPath = join(root, 'public/downloads/latest.json')

function readArg(name) {
  const index = process.argv.indexOf(name)
  if (index === -1 || index + 1 >= process.argv.length) {
    return null
  }

  return process.argv[index + 1]
}

const version = readArg('--version')
const tag = readArg('--tag')
const repo = process.env.GITHUB_REPOSITORY ?? readArg('--repo')
const token = process.env.GH_TOKEN ?? process.env.GITHUB_TOKEN

if (!version || !tag || !repo || !token) {
  console.error(
    'Usage: node scripts/sync-latest-download-from-release.mjs --version <version> --tag <tag> [--repo owner/name]',
  )
  console.error('Requires GH_TOKEN or GITHUB_TOKEN in the environment.')
  process.exit(1)
}

const response = await fetch(`https://api.github.com/repos/${repo}/releases/tags/${tag}`, {
  headers: {
    Authorization: `Bearer ${token}`,
    Accept: 'application/vnd.github+json',
    'X-GitHub-Api-Version': '2022-11-28',
  },
})

if (!response.ok) {
  console.error(`Failed to fetch release ${tag}: ${response.status} ${response.statusText}`)
  process.exit(1)
}

const release = await response.json()
const assets = Array.isArray(release.assets) ? release.assets : []
const platforms = {}

const windowsAsset =
  assets.find(asset => asset.name?.includes('-setup.exe')) ??
  assets.find(asset => asset.name?.endsWith('.msi'))

if (windowsAsset?.browser_download_url && windowsAsset?.name) {
  platforms.windows = {
    url: windowsAsset.browser_download_url,
    filename: windowsAsset.name,
  }
}

const macAsset = assets.find(asset => asset.name?.endsWith('.dmg'))

if (macAsset?.browser_download_url && macAsset?.name) {
  platforms.macos = {
    url: macAsset.browser_download_url,
    filename: macAsset.name,
  }
}

if (!platforms.windows && !platforms.macos) {
  console.error(`No desktop installer assets found on release ${tag}`)
  process.exit(1)
}

mkdirSync(dirname(outputPath), { recursive: true })

writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      version,
      publishedAt: new Date().toISOString(),
      platforms,
    },
    null,
    2,
  )}\n`,
)

console.log(`Updated ${outputPath}`)
