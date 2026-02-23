import type { VariantProps } from 'class-variance-authority'
import { cva } from 'class-variance-authority'

export { default as Avatar } from './Avatar.vue'
export { default as AvatarFallback } from './AvatarFallback.vue'
export { default as AvatarImage } from './AvatarImage.vue'

export const avatarVariant = cva(
  'relative inline-flex items-center justify-center font-normal text-foreground select-none shrink-0 bg-secondary overflow-hidden',
  {
    variants: {
      size: {
        xs: 'h-8 min-w-8 w-8 text-xs',
        sm: 'h-10 min-w-10 w-10 text-xs',
        base: 'h-16 min-w-16 w-16 text-2xl',
        lg: 'h-32 min-w-32 w-32 text-5xl',
      },
      shape: {
        circle: 'rounded-full',
        square: 'rounded-md',
      },
    },
  }
)

export type AvatarVariants = VariantProps<typeof avatarVariant>
