import { useState } from 'react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useCreateProduct } from '../hooks/useProducts'
import type { CreateProductRequest } from '../../../../../shared/types/domains/product'

interface ProductCreateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

/**
 * 创建商品对话框
 */
export function ProductCreateDialog({ open, onOpenChange }: ProductCreateDialogProps) {
  const createMutation = useCreateProduct()

  const [formData, setFormData] = useState<CreateProductRequest>({
    name: '',
    image_url: '',
    description: '',
    initial_coins: 100,
    coin_type: 'gold',
    stock: 0,
  })

  const handleSubmit = () => {
    if (!formData.name.trim()) {
      alert('请输入商品名称')
      return
    }

    if (formData.initial_coins <= 0) {
      alert('初始金币必须大于 0')
      return
    }

    if (formData.stock < 0) {
      alert('库存不能为负数')
      return
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        // 重置表单
        setFormData({
          name: '',
          image_url: '',
          description: '',
          initial_coins: 100,
          coin_type: 'gold',
          stock: 0,
        })
        onOpenChange(false)
      },
      onError: (error: any) => {
        alert('创建失败：' + (error.response?.data?.message || error.message))
      }
    })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>新建商品</DialogTitle>
          <DialogDescription>
            创建一个新的商品，设置名称、金币、库存等信息
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4 max-h-[60vh] overflow-y-auto">
          {/* 商品名称 */}
          <div className="space-y-2">
            <Label htmlFor="name">商品名称 *</Label>
            <Input
              id="name"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="输入商品名称"
              maxLength={200}
            />
          </div>

          {/* 图片URL */}
          <div className="space-y-2">
            <Label htmlFor="image_url">商品图片 URL</Label>
            <Input
              id="image_url"
              value={formData.image_url}
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
            <Label htmlFor="description">商品描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="输入商品描述"
              rows={3}
              maxLength={5000}
            />
          </div>

          {/* 初始金币 */}
          <div className="space-y-2">
            <Label htmlFor="initial_coins">兑换所需金币 *</Label>
            <Input
              id="initial_coins"
              type="number"
              value={formData.initial_coins}
              onChange={(e) => setFormData({ ...formData, initial_coins: parseInt(e.target.value) || 0 })}
              placeholder="100"
              min={1}
            />
          </div>

          {/* 金币类型 */}
          <div className="space-y-2">
            <Label htmlFor="coin_type">金币类型</Label>
            <Select
              value={formData.coin_type}
              onValueChange={(value: 'gold' | 'silver') => setFormData({ ...formData, coin_type: value })}
            >
              <SelectTrigger>
                <SelectValue placeholder="选择金币类型" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gold">金币</SelectItem>
                <SelectItem value="silver">银币</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 总库存 */}
          <div className="space-y-2">
            <Label htmlFor="stock">总库存 *</Label>
            <Input
              id="stock"
              type="number"
              value={formData.stock}
              onChange={(e) => setFormData({ ...formData, stock: parseInt(e.target.value) || 0 })}
              placeholder="0"
              min={0}
            />
          </div>

          {/* 购买限制 */}
          <div className="space-y-2">
            <Label htmlFor="purchase_limit">每人购买限制（可选）</Label>
            <Input
              id="purchase_limit"
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
            <Label htmlFor="cost">成本（元，可选）</Label>
            <Input
              id="cost"
              type="number"
              step="0.01"
              value={formData.cost || ''}
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
          <Button onClick={handleSubmit} disabled={createMutation.isPending}>
            {createMutation.isPending ? '创建中...' : '创建'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

