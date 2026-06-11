import { cn } from '../../lib/utils.js'

const variants = {
  default:
    'border-[#dffdee] bg-[#dffdee] text-[#07110c] hover:border-[#f4fff8] hover:bg-[#f4fff8] disabled:border-[#25302a] disabled:bg-[#18211c] disabled:text-[#68736d]',
  outline:
    'border-white/10 bg-[#101211] text-[#f5fff8] hover:border-white/15 hover:bg-[#151917] disabled:bg-[#0d0f0e] disabled:text-[#68736d]',
  ghost:
    'border-transparent bg-transparent text-[#9aa39f] hover:bg-white/[0.06] hover:text-white disabled:text-[#606a65]',
}

const sizes = {
  default: 'h-10 px-4 py-2',
  icon: 'size-10 p-0',
  sm: 'h-8 px-3',
}

export function Button({
  children,
  className,
  size = 'default',
  type = 'button',
  variant = 'default',
  ...props
}) {
  return (
    <button
      type={type}
      className={cn(
        'inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-[#b9f7d3]/25 disabled:cursor-not-allowed',
        sizes[size] ?? sizes.default,
        variants[variant],
        className,
      )}
      {...props}
    >
      {children}
    </button>
  )
}
