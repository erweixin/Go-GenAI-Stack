// Code generated from Go structs. DO NOT EDIT manually.
// Source: backend/domains/product/http/dto
// Generated: 2025-12-01

/**
 * 创建商品请求
 */
export interface CreateProductRequest {
  name: string;
  image_url?: string;
  description?: string;
  initial_coins: number;
  coin_type?: 'gold' | 'silver';
  stock: number;
  purchase_limit?: number;
  cost?: number;
}

/**
 * 创建商品响应
 */
export interface CreateProductResponse {
  product_id: string;
  name: string;
  status: string;
  created_at: string;
}

/**
 * 更新商品请求
 */
export interface UpdateProductRequest {
  name?: string;
  image_url?: string;
  description?: string;
  initial_coins?: number;
  stock?: number;
  purchase_limit?: number;
  cost?: number;
}

/**
 * 更新商品响应
 */
export interface UpdateProductResponse {
  product_id: string;
  name: string;
  status: string;
  updated_at: string;
}

/**
 * 商品详情响应
 */
export interface ProductResponse {
  id: string;
  name: string;
  image_url: string;
  description: string;
  initial_coins: number;
  coin_type: 'gold' | 'silver';
  stock: number;
  listed_quantity: number;
  listed_limit?: number;
  redeemed_count: number;
  available_quantity: number;
  sales_count: number;
  purchase_limit?: number;
  cost?: number;
  revenue: number;
  status: 'on_shelf' | 'off_shelf';
  operator_id: string;
  created_at: string;
  updated_at: string;
}

/**
 * 列出商品请求
 */
export interface ListProductsRequest {
  status?: 'on_shelf' | 'off_shelf';
  keyword?: string;
  sort_by?: 'created_at' | 'initial_coins' | 'redeemed_count' | 'updated_at';
  sort_order?: 'asc' | 'desc';
  page?: number;
  limit?: number;
}

/**
 * 列出商品响应
 */
export interface ListProductsResponse {
  products: ProductResponse[];
  total_count: number;
  page: number;
  limit: number;
  has_more: boolean;
}

/**
 * 上架商品请求
 */
export interface ShelveProductRequest {
  quantity: number;
}

/**
 * 上架商品响应
 */
export interface ShelveProductResponse {
  product_id: string;
  status: string;
  listed_quantity: number;
  shelved_at: string;
}

/**
 * 下架商品响应
 */
export interface UnshelveProductResponse {
  product_id: string;
  status: string;
  unshelved_at: string;
}

/**
 * 删除商品响应
 */
export interface DeleteProductResponse {
  success: boolean;
  deleted_at: string;
}

/**
 * 错误响应
 */
export interface ErrorResponse {
  error: string;
  message: string;
  code?: string;
}

