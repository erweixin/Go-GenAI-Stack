import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { useTaskStore } from '../stores/task.store'

/**
 * 任务筛选器组件
 *
 * 用例：ListTasks（带筛选条件）
 *
 * 提供状态、优先级、标签、关键词筛选
 */
export function TaskFilters() {
  const { filters, setFilters } = useTaskStore()

  const handleStatusChange = (value: string) => {
    setFilters({
      ...filters,
      status: value === 'all' ? undefined : (value as any),
    })
  }

  const handlePriorityChange = (value: string) => {
    setFilters({
      ...filters,
      priority: value === 'all' ? undefined : (value as any),
    })
  }

  const handleKeywordChange = (value: string) => {
    setFilters({
      ...filters,
      keyword: value || undefined,
    })
  }

  const handleReset = () => {
    setFilters({})
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex flex-wrap gap-4 items-end">
        {/* 状态筛选 */}
        <div className="flex-1 min-w-[150px]">
          <label className="text-sm font-medium mb-2 block">状态</label>
          <Select value={filters.status || 'all'} onValueChange={handleStatusChange}>
            <SelectTrigger>
              <SelectValue placeholder="所有状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有状态</SelectItem>
              <SelectItem value="pending">待办</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 优先级筛选 */}
        <div className="flex-1 min-w-[150px]">
          <label className="text-sm font-medium mb-2 block">优先级</label>
          <Select value={filters.priority || 'all'} onValueChange={handlePriorityChange}>
            <SelectTrigger>
              <SelectValue placeholder="所有优先级" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">所有优先级</SelectItem>
              <SelectItem value="low">低</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="high">高</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 关键词搜索 */}
        <div className="flex-1 min-w-[200px]">
          <label className="text-sm font-medium mb-2 block">搜索</label>
          <Input
            value={filters.keyword || ''}
            onChange={(e) => handleKeywordChange(e.target.value)}
            placeholder="搜索任务..."
          />
        </div>

        {/* 重置按钮 */}
        <Button variant="outline" onClick={handleReset}>
          重置
        </Button>
      </div>
    </div>
  )
}
