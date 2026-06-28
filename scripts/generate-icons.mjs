import { copyFileSync, existsSync, mkdirSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

const logoPath = 'assets/images/logo.png'
const appIconPath = 'src-tauri/app-icon.png'
const squareSize = 1024

await sharp(logoPath)
  .resize(squareSize, squareSize, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  })
  .png()
  .toFile(appIconPath)

console.log(`Created ${appIconPath}`)

const result = spawnSync('npx', ['tauri', 'icon', appIconPath], {
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

copyFileSync('src-tauri/icons/icon.ico', 'public/favicon.ico')

await sharp(logoPath)
  .resize(512, 512, {
    fit: 'contain',
    background: { r: 0, g: 0, b: 0, alpha: 1 },
  })
  .png()
  .toFile('public/favicon.png')

copyFileSync(logoPath, 'public/logo.png')

const outputPublic = '.output/public'
if (existsSync(outputPublic)) {
  copyFileSync('public/favicon.ico', `${outputPublic}/favicon.ico`)
  copyFileSync('public/favicon.png', `${outputPublic}/favicon.png`)
  copyFileSync('public/logo.png', `${outputPublic}/logo.png`)
}

console.log('Icons generated: src-tauri/icons/, public/favicon.ico, public/favicon.png, public/logo.png')
