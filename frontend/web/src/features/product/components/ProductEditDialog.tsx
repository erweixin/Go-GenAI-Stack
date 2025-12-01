import { useState, useEffect } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { useUpdateProduct } from '../hooks/useProducts'
import type { ProductResponse, UpdateProductRequest } from '../../../../../shared/types/domains/product'

interface ProductEditDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  product: ProductResponse | null
}

/**
 * 编辑商品对话框
 */
export function ProductEditDialog({ open, onOpenChange, product }: ProductEditDialogProps) {
  const updateMutation = useUpdateProduct()

  const [formData, setFormData] = useState<UpdateProductRequest>({})

  useEffect(() => {
    if (product) {
      setFormData({
        name: product.name,
        image_url: product.image_url,
        description: product.description,
        initial_coins: product.initial_coins,
        stock: product.stock,
        purchase_limit: product.purchase_limit,
        cost: product.cost,
      })
    }
  }, [product])

  const handleSubmit = () => {
    if (!product) return

    if (formData.name && !formData.name.trim()) {
      alert('商品名称不能为空')
      return
    }

    if (formData.initial_coins !== undefined && formData.initial_coins <= 0) {
      alert('初始金币必须大于 0')
      return
    }

    if (formData.stock !== undefined && formData.stock < 0) {
      alert('库存不能为负数')
      return
    }

    updateMutation.mutate(
      { id: product.id, data: formData },
      {
        onSuccess: () => {
          onOpenChange(false)
        },
        onError: (error: any) => {
          alert('更新失败：' + (error.response?.data?.message || error.message))
        }
      }
    )
  }

  if (!product) return null

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>编辑商品</DialogTitle>
          <DialogDescription>
            修改商品信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* 商品名称 */}
          <div className="space-y-2">
            <Label htmlFor="edit_name">商品名称</Label>
            <Input
              id="edit_name"
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入商品名称"
              maxLength={200}
            />
          </div>

          {/* 图片URL */}
          <div className="space-y-2">
            <Label htmlFor="edit_image_url">商品图片 URL</Label>
            <Input
              id="edit_image_url"
              value={formData.image_url || ''}
              onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
              placeholder="https://example.com/image.jpg"
              type="url"
            />
            {formData.image_url && (
              <div className="mt-2">
                <img
                  src={formData.image_url}
                  alt="预览"
                  className="w-20 h-20 object-cover rounded border"
                  onError={(e) => {
                    e.currentTarget.style.display = 'none'
                  }}
                />
              </div>
            )}
          </div>

          {/* 商品描述 */}
          <div className="space-y-2">
            <Label htmlFor="edit_description">商品描述</Label>
            <Textarea
              id="edit_description"
              value={formData.description || ''}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入商品描述"
              rows={3}
              maxLength={5000}
            />
          </div>

          {/* 初始金币 */}
          <div className="space-y-2">
            <Label htmlFor="edit_initial_coins">兑换所需金币</Label>
            <Input
              id="edit_initial_coins"
              type="number"
              value={formData.initial_coins || ''}
              onChange={(e) => setFormData({ ...formData, initial_coins: parseInt(e.target.value) || undefined })}
              placeholder="100"
              min={1}
            />
          </div>

          {/* 总库存 */}
          <div className="space-y-2">
            <Label htmlFor="edit_stock">总库存</Label>
            <Input
              id="edit_stock"
              type="number"
              value={formData.stock !== undefined ? formData.stock : ''}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || undefined })}
              placeholder="0"
              min={product.redeemed_count} // 不能小于已兑换数量
            />
            <p className="text-xs text-muted-foreground">
              已兑换 {product.redeemed_count} 件，库存不能小于已兑换数量
            </p>
          </div>

          {/* 购买限制 */}
          <div className="space-y-2">
            <Label htmlFor="edit_purchase_limit">每人购买限制</Label>
            <Input
              id="edit_purchase_limit"
              type="number"
              value={formData.purchase_limit || ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                purchase_limit: e.target.value ? parseInt(e.target.value) : undefined 
              })}
              placeholder="不限制"
              min={1}
            />
          </div>

          {/* 成本 */}
          <div className="space-y-2">
            <Label htmlFor="edit_cost">成本（元）</Label>
            <Input
              id="edit_cost"
              type="number"
              step="0.01"
              value={formData.cost !== undefined ? formData.cost : ''}
              onChange={(e) => setFormData({ 
                ...formData, 
                cost: e.target.value ? parseFloat(e.target.value) : undefined 
              })}
              placeholder="0.00"
              min={0}
            />
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          <Button onClick={handleSubmit} disabled={updateMutation.isPending}>
            {updateMutation.isPending ? '保存中...' : '保存'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

