// React Query hooks for Product management
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { productApi } from '../../../api/productApi'
import type {
  ListProductsRequest,
  CreateProductRequest,
  UpdateProductRequest,
  ShelveProductRequest,
} from '../../../../../shared/types/domains/product'

/**
 * 商品列表 Query Key
 */
export const productKeys = {
  all: ['products'] as const,
  lists: () => [...productKeys.all, 'list'] as const,
  list: (filters: ListProductsRequest) => [...productKeys.lists(), filters] as const,
  details: () => [...productKeys.all, 'detail'] as const,
  detail: (id: string) => [...productKeys.details(), id] as const,
};

/**
 * 获取商品列表
 */
export function useProducts(params?: ListProductsRequest) {
  return useQuery({
    queryKey: productKeys.list(params || {}),
    queryFn: () => productApi.listProducts(params),
  });
}

/**
 * 获取商品详情
 */
export function useProduct(id: string) {
  return useQuery({
    queryKey: productKeys.detail(id),
    queryFn: () => productApi.getProduct(id),
    enabled: !!id,
  });
}

/**
 * 创建商品
 */
export function useCreateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (data: CreateProductRequest) => productApi.createProduct(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('商品创建成功')
    },
    onError: (error: any) => {
      toast.error('创建失败：' + (error.response?.data?.message || error.message))
    },
  })
}

/**
 * 更新商品
 */
export function useUpdateProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateProductRequest }) =>
      productApi.updateProduct(id, data),
    onSuccess: (_data: unknown, variables: { id: string; data: UpdateProductRequest }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
      toast.success('商品更新成功')
    },
    onError: (error: any) => {
      toast.error('更新失败：' + (error.response?.data?.message || error.message))
    },
  })
}

/**
 * 删除商品
 */
export function useDeleteProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productApi.deleteProduct(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      toast.success('商品删除成功')
    },
    onError: (error: any) => {
      toast.error('删除失败：' + (error.response?.data?.message || error.message))
    },
  })
}

/**
 * 上架商品
 */
export function useShelveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ShelveProductRequest }) =>
      productApi.shelveProduct(id, data),
    onSuccess: (_data: unknown, variables: { id: string; data: ShelveProductRequest }) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(variables.id) })
      toast.success('商品上架成功')
    },
    onError: (error: any) => {
      toast.error('上架失败：' + (error.response?.data?.message || error.message))
    },
  })
}

/**
 * 下架商品
 */
export function useUnshelveProduct() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: (id: string) => productApi.unshelveProduct(id),
    onSuccess: (_data: unknown, id: string) => {
      queryClient.invalidateQueries({ queryKey: productKeys.lists() })
      queryClient.invalidateQueries({ queryKey: productKeys.detail(id) })
      toast.success('商品下架成功')
    },
    onError: (error: any) => {
      toast.error('下架失败：' + (error.response?.data?.message || error.message))
    },
  })
}

