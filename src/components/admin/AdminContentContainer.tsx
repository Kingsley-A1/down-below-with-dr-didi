type AdminContentContainerProps = {
  children: React.ReactNode
  className?: string
}

export default function AdminContentContainer({ children, className }: AdminContentContainerProps) {
  const containerClassName = className
    ? `mx-auto w-full max-w-[1240px] space-y-5 ${className}`
    : 'mx-auto w-full max-w-[1240px] space-y-5'

  return <div className={containerClassName}>{children}</div>
}
