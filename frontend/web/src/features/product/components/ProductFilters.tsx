import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Search } from 'lucide-react'
import type { ListProductsRequest } from '../../../../../shared/types/domains/product'

interface ProductFiltersProps {
  filters: ListProductsRequest
  onFiltersChange: (filters: ListProductsRequest) => void
}

/**
 * 商品筛选器组件
 */
export function ProductFilters({ filters, onFiltersChange }: ProductFiltersProps) {
  return (
    <div className="bg-card p-4 rounded-lg border mb-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* 关键词搜索 */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="搜索商品名称..."
            value={filters.keyword || ''}
            onChange={(e) => onFiltersChange({ ...filters, keyword: e.target.value, page: 1 })}
            className="pl-9"
          />
        </div>

        {/* 状态筛选 */}
        <Select
          value={filters.status || 'all'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              status: value === 'all' ? undefined : (value as 'on_shelf' | 'off_shelf'),
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="全部状态" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">全部状态</SelectItem>
            <SelectItem value="on_shelf">上架</SelectItem>
            <SelectItem value="off_shelf">下架</SelectItem>
          </SelectContent>
        </Select>

        {/* 排序 */}
        <Select
          value={filters.sort_by || 'created_at'}
          onValueChange={(value) =>
            onFiltersChange({
              ...filters,
              sort_by: value as any,
              page: 1,
            })
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="created_at">创建时间</SelectItem>
            <SelectItem value="updated_at">更新时间</SelectItem>
            <SelectItem value="initial_coins">金币数</SelectItem>
            <SelectItem value="redeemed_count">兑换数量</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  )
}

