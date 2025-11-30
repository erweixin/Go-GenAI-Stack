import { cn } from '@/lib/utils'
import { Inbox } from 'lucide-react'
import { ReactNode } from 'react'

interface EmptyProps {
  className?: string
  icon?: ReactNode
  title?: string
  description?: string
  action?: ReactNode
}

export function Empty({
  className,
  icon,
  title = '暂无数据',
  description,
  action,
}: EmptyProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      <div className="rounded-full bg-muted p-6 mb-4">
        {icon || <Inbox className="h-10 w-10 text-muted-foreground" />}
      </div>
      <h3 className="text-lg font-semibold mb-1">{title}</h3>
      {description && (
        <p className="text-sm text-muted-foreground mb-4 max-w-sm">{description}</p>
      )}
      {action && <div className="mt-2">{action}</div>}
    </div>
  )
}

