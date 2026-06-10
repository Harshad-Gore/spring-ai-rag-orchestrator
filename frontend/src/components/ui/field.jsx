import { cn } from '../../lib/utils.js'

export function FieldGroup({ children, className }) {
  return <div className={cn('flex flex-col gap-5', className)}>{children}</div>
}

export function Field({ children, className }) {
  return <div className={cn('grid gap-2.5', className)}>{children}</div>
}

export function FieldLabel({ children, className, ...props }) {
  return (
    <label
      className={cn('text-[13px] font-medium leading-5 text-[#dce7e1]', className)}
      {...props}
    >
      {children}
    </label>
  )
}

export function FieldDescription({ children, className }) {
  return (
    <p className={cn('text-sm leading-6 text-[#8e9994]', className)}>
      {children}
    </p>
  )
}

export function FieldError({ children, id }) {
  if (!children) {
    return null
  }

  return (
    <p id={id} className="text-sm leading-5 text-red-300">
      {children}
    </p>
  )
}

export function FieldSeparator({ children }) {
  return (
    <div className="relative flex items-center justify-center text-[17px] text-[#b9c0ca]">
      <span className="absolute inset-x-0 top-1/2 border-t border-[#242424]" />
      <span className="relative bg-[#090909] px-3">{children}</span>
    </div>
  )
}
