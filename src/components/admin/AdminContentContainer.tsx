type AdminContentContainerProps = {
  children: React.ReactNode
  className?: string
}

export default function AdminContentContainer({ children, className }: AdminContentContainerProps) {
  const containerClassName = className
    ? `mx-auto w-full max-w-[1120px] space-y-6 ${className}`
    : 'mx-auto w-full max-w-[1120px] space-y-6'

  return <div className={containerClassName}>{children}</div>
}
