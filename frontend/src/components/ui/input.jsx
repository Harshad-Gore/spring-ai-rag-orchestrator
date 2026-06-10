import { cn } from '../../lib/utils.js'

export function Input({ className, error, icon: Icon, trailing, ...props }) {
  return (
    <div className="relative">
      {Icon ? (
        <Icon
          aria-hidden="true"
          className="pointer-events-none absolute left-3.5 top-1/2 size-3.5 -translate-y-1/2 text-[#7d8882]"
        />
      ) : null}
      <input
        className={cn(
          'h-10 w-full rounded-[11px] border bg-[#101211]/95 px-3.5 py-2 text-sm font-medium text-[#f6fff9] caret-[#dffdee] outline-none transition placeholder:text-[#657069] focus:bg-[#111512] focus:ring-2 focus:ring-[#b9f7d3]/15 disabled:cursor-not-allowed disabled:border-[#1c211f] disabled:bg-[#0c0e0d] disabled:text-[#68736d]',
          Icon && 'pl-10',
          trailing && 'pr-10',
          error
            ? 'border-red-500/70 focus:border-red-400 focus:ring-red-500/20'
            : 'border-white/10 focus:border-[#dffdee]/45',
          className,
        )}
        {...props}
      />
      {trailing}
    </div>
  )
}
