import { copyFileSync, existsSync } from 'node:fs'
import { spawnSync } from 'node:child_process'
import sharp from 'sharp'

const logoPath = 'assets/images/logo.png'
const appIconPath = 'src-tauri/app-icon.png'

async function writeSquareIcon(input, output, size) {
  await sharp(input)
    .resize(size, size, {
      fit: 'cover',
      position: 'centre',
    })
    .png()
    .toFile(output)
}

await writeSquareIcon(logoPath, appIconPath, 1024)

console.log(`Created ${appIconPath}`)

const result = spawnSync('npx', ['tauri', 'icon', appIconPath], {
  stdio: 'inherit',
  shell: true,
})

if (result.status !== 0) {
  process.exit(result.status ?? 1)
}

copyFileSync('src-tauri/icons/icon.ico', 'public/favicon.ico')

await writeSquareIcon(logoPath, 'public/favicon.png', 512)

copyFileSync(logoPath, 'public/logo.png')

const outputPublic = '.output/public'
if (existsSync(outputPublic)) {
  copyFileSync('public/favicon.ico', `${outputPublic}/favicon.ico`)
  copyFileSync('public/favicon.png', `${outputPublic}/favicon.png`)
  copyFileSync('public/logo.png', `${outputPublic}/logo.png`)
}

console.log(
  'Icons generated: src-tauri/icons/, public/favicon.ico, public/favicon.png, public/logo.png'
)
