import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useProducts, useDeleteProduct, useShelveProduct, useUnshelveProduct } from '../hooks/useProducts'
import { ProductTable } from '../components/ProductTable'
import { ProductFilters } from '../components/ProductFilters'
import { ProductCreateDialog } from '../components/ProductCreateDialog'
import { ProductEditDialog } from '../components/ProductEditDialog'
import { ConfirmDialog } from '@/components/ConfirmDialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { ThemeToggle } from '@/components/theme-toggle'
import { Plus, Home, ChevronLeft, ChevronRight } from 'lucide-react'
import type { ListProductsRequest, ProductResponse } from '../../../../../shared/types/domains/product'

/**
 * 商品管理页面
 * 
 * 职责：
 * - 组合 features/product 的组件
 * - 页面布局和导航
 * - 事件处理协调
 * 
 * 对应后端领域：product
 */
export default function ProductListPage() {
  const navigate = useNavigate()
  
  const [filters, setFilters] = useState<ListProductsRequest>({
    page: 1,
    limit: 20,
    sort_order: 'desc',
  })

  // React Query hooks
  const { data, isLoading, error } = useProducts(filters)
  const deleteMutation = useDeleteProduct()
  const shelveMutation = useShelveProduct()
  const unshelveMutation = useUnshelveProduct()

  // 调试：打印返回的数据
  useEffect(() => {
    if (data) {
      console.log('[DEBUG] 商品数据:', data)
      console.log('[DEBUG] 商品列表:', data.products)
      console.log('[DEBUG] 商品数量:', data.products?.length)
    }
    if (error) {
      console.error('[DEBUG] 错误:', error)
    }
  }, [data, error])

  // Dialog states
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false)
  const [editingProduct, setEditingProduct] = useState<ProductResponse | null>(null)
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null)
  const [shelveProductId, setShelveProductId] = useState<string | null>(null)
  const [shelveQuantity, setShelveQuantity] = useState<string>('')

  const handleEdit = (product: ProductResponse) => {
    setEditingProduct(product)
    setIsEditDialogOpen(true)
  }

  const handleDelete = (productId: string) => {
    setDeleteConfirmId(productId)
  }

  const confirmDelete = () => {
    if (deleteConfirmId) {
      deleteMutation.mutate(deleteConfirmId, {
        onSuccess: () => {
          setDeleteConfirmId(null)
        }
      })
    }
  }

  const handleShelve = (productId: string) => {
    setShelveProductId(productId)
    setShelveQuantity('')
  }

  const confirmShelve = () => {
    if (shelveProductId && shelveQuantity) {
      const quantity = parseInt(shelveQuantity, 10)
      if (quantity > 0) {
        shelveMutation.mutate(
          { id: shelveProductId, data: { quantity } },
          {
            onSuccess: () => {
              setShelveProductId(null)
              setShelveQuantity('')
            }
          }
        )
      }
    }
  }

  const handleUnshelve = (productId: string) => {
    unshelveMutation.mutate(productId)
  }

  const totalPages = data ? Math.ceil(data.total_count / (filters.limit || 20)) : 0

  console.log('[DEBUG] 商品数据:', data)

  return (
    <div className="min-h-screen bg-background">
      {/* 顶部导航 */}
      <div className="bg-card shadow border-b">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold">商品管理</h1>
            <div className="flex gap-2">
              <ThemeToggle />
              <Button variant="outline" onClick={() => navigate('/')}>
                <Home className="mr-2 h-4 w-4" /> 首页
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* 主内容区 */}
      <div className="container mx-auto px-4 py-6">
        {/* 操作栏 */}
        <div className="flex justify-between items-center mb-6">
          <div className="text-muted-foreground">
            共 {data?.total_count || 0} 个商品
          </div>
          <Button onClick={() => setIsCreateDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" /> 新建商品
          </Button>
        </div>

        {/* 筛选器 */}
        <ProductFilters filters={filters} onFiltersChange={setFilters} />

        {/* 商品表格 */}
        <ProductTable
          products={data?.products || []}
          loading={isLoading}
          onEdit={handleEdit}
          onDelete={handleDelete}
          onShelve={handleShelve}
          onUnshelve={handleUnshelve}
          currentPage={filters.page || 1}
          pageSize={filters.limit || 20}
        />

        {/* 分页 */}
        {data && data.total_count > 0 && (
          <div className="mt-6 flex items-center justify-between">
            <div className="text-sm text-muted-foreground">
              第 {filters.page}/{totalPages} 页，共 {data.total_count} 条
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) - 1 })}
                disabled={filters.page === 1}
              >
                <ChevronLeft className="h-4 w-4" />
                上一页
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setFilters({ ...filters, page: (filters.page || 1) + 1 })}
                disabled={!data.has_more}
              >
                下一页
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {/* 对话框 */}
      <ProductCreateDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />

      <ProductEditDialog
        open={isEditDialogOpen}
        onOpenChange={setIsEditDialogOpen}
        product={editingProduct}
      />

      <ConfirmDialog
        open={!!deleteConfirmId}
        onOpenChange={(open) => !open && setDeleteConfirmId(null)}
        onConfirm={confirmDelete}
        title="确认删除"
        description="确定要删除这个商品吗？此操作无法撤销。"
        confirmText="删除"
        cancelText="取消"
        variant="destructive"
        loading={deleteMutation.isPending}
      />

      {/* 上架对话框 */}
      {shelveProductId && (
        <Dialog open={true} onOpenChange={(open) => {
          if (!open) {
            setShelveProductId(null)
            setShelveQuantity('')
          }
        }}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>上架商品</DialogTitle>
              <DialogDescription>
                请输入上架数量
              </DialogDescription>
            </DialogHeader>
            <div className="py-4">
              <Input
                type="number"
                min={1}
                value={shelveQuantity}
                onChange={(e) => setShelveQuantity(e.target.value)}
                placeholder="输入上架数量"
                autoFocus
              />
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => {
                setShelveProductId(null)
                setShelveQuantity('')
              }}>
                取消
              </Button>
              <Button onClick={confirmShelve} disabled={shelveMutation.isPending || !shelveQuantity}>
                {shelveMutation.isPending ? '上架中...' : '确认上架'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  )
}
