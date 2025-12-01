import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Edit, Trash2, TrendingUp, TrendingDown } from 'lucide-react'
import type { ProductResponse } from '../../../../../shared/types/domains/product'

interface ProductTableProps {
  products: ProductResponse[]
  loading?: boolean
  onEdit?: (product: ProductResponse) => void
  onDelete?: (productId: string) => void
  onShelve?: (productId: string) => void
  onUnshelve?: (productId: string) => void
  currentPage?: number
  pageSize?: number
}

/**
 * 商品表格组件
 */
export function ProductTable({
  products,
  loading,
  onEdit,
  onDelete,
  onShelve,
  onUnshelve,
  currentPage = 1,
  pageSize = 20,
}: ProductTableProps) {
  if (loading) {
    return (
      <div className="flex justify-center items-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 text-muted-foreground border rounded-lg">
        <p className="text-lg">暂无商品</p>
        <p className="text-sm mt-2">点击"新建商品"创建第一个商品</p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[60px]">序号</TableHead>
            <TableHead className="w-[80px]">图片</TableHead>
            <TableHead className="min-w-[150px]">商品名称</TableHead>
            <TableHead className="w-[100px]">金币/类型</TableHead>
            <TableHead className="w-[80px]">库存</TableHead>
            <TableHead className="w-[80px]">上架</TableHead>
            <TableHead className="w-[80px]">已兑换</TableHead>
            <TableHead className="w-[80px]">剩余</TableHead>
            <TableHead className="w-[100px]">成本/收益</TableHead>
            <TableHead className="w-[80px]">状态</TableHead>
            <TableHead className="w-[140px]">操作时间</TableHead>
            <TableHead className="w-[200px]">操作</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product, index) => (
            <TableRow key={product.id}>
              <TableCell>{(currentPage - 1) * pageSize + index + 1}</TableCell>
              <TableCell>
                {product.image_url ? (
                  <img
                    src={product.image_url}
                    alt={product.name}
                    className="w-12 h-12 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = 'https://via.placeholder.com/48'
                    }}
                  />
                ) : (
                  <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400 text-xs">
                    无图
                  </div>
                )}
              </TableCell>
              <TableCell className="font-medium">
                <div className="max-w-[200px] truncate" title={product.name}>
                  {product.name}
                </div>
                {product.description && (
                  <div className="text-xs text-muted-foreground max-w-[200px] truncate" title={product.description}>
                    {product.description}
                  </div>
                )}
              </TableCell>
              <TableCell>
                <div className="font-semibold">{product.initial_coins}</div>
                <div className="text-xs text-muted-foreground">
                  {product.coin_type === 'gold' ? '金币' : '银币'}
                </div>
              </TableCell>
              <TableCell>{product.stock}</TableCell>
              <TableCell>{product.listed_quantity}</TableCell>
              <TableCell>
                <span className={product.redeemed_count > 0 ? 'font-semibold text-green-600' : ''}>
                  {product.redeemed_count}
                </span>
              </TableCell>
              <TableCell>
                <span className={product.available_quantity === 0 ? 'text-red-600' : ''}>
                  {product.available_quantity}
                </span>
              </TableCell>
              <TableCell>
                <div className="text-xs">
                  <div className="text-muted-foreground">
                    成本: {product.cost?.toFixed(2) || '-'}
                  </div>
                  <div className="font-semibold text-green-600">
                    收益: {product.revenue.toFixed(2)}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <Badge variant={product.status === 'on_shelf' ? 'default' : 'secondary'}>
                  {product.status === 'on_shelf' ? '上架' : '下架'}
                </Badge>
              </TableCell>
              <TableCell className="text-xs text-muted-foreground">
                {new Date(product.updated_at).toLocaleString('zh-CN')}
              </TableCell>
              <TableCell>
                <div className="flex gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => onEdit?.(product)}
                    title="编辑"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  {product.status === 'off_shelf' ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onShelve?.(product.id)}
                      className="text-green-600 hover:text-green-700"
                      title="上架"
                    >
                      <TrendingUp className="h-4 w-4" />
                    </Button>
                  ) : (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onUnshelve?.(product.id)}
                      className="text-orange-600 hover:text-orange-700"
                      title="下架"
                    >
                      <TrendingDown className="h-4 w-4" />
                    </Button>
                  )}
                  {product.status === 'off_shelf' && product.redeemed_count === 0 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onDelete?.(product.id)}
                      className="text-red-600 hover:text-red-700"
                      title="删除"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}

