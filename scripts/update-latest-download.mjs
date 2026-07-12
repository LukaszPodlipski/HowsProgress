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
const url = readArg('--url')
const filename = readArg('--filename')

if (!version || !url || !filename) {
  console.error(
    'Usage: node scripts/update-latest-download.mjs --version <version> --url <url> --filename <filename>'
  )
  process.exit(1)
}

mkdirSync(dirname(outputPath), { recursive: true })

writeFileSync(
  outputPath,
  `${JSON.stringify(
    {
      version,
      url,
      filename,
      publishedAt: new Date().toISOString(),
    },
    null,
    2
  )}\n`
)

console.log(`Updated ${outputPath}`)
