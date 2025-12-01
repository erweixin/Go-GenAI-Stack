import type {
  CreateProductRequest,
  CreateProductResponse,
  UpdateProductRequest,
  UpdateProductResponse,
  ProductResponse,
  ListProductsRequest,
  ListProductsResponse,
  ShelveProductRequest,
  ShelveProductResponse,
  UnshelveProductResponse,
  DeleteProductResponse,
} from '../../../../shared/types/domains/product';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080';
import { api as axios } from '@/lib/api-client'

export const productApi = {
  /**
   * 创建商品
   */
  async createProduct(data: CreateProductRequest): Promise<CreateProductResponse> {
    const response = await axios.post<CreateProductResponse>(
      `${API_BASE_URL}/api/products`,
      data
    );
    return response;
  },

  /**
   * 获取商品列表
   */
  async listProducts(params?: ListProductsRequest): Promise<ListProductsResponse> {
    const response = await axios.get<ListProductsResponse>(
      `${API_BASE_URL}/api/products`,
      { params }
    );

    return response;
  },

  /**
   * 获取商品详情
   */
  async getProduct(id: string): Promise<ProductResponse> {
    const response = await axios.get<ProductResponse>(
      `${API_BASE_URL}/api/products/${id}`
    );
    return response;
  },

  /**
   * 更新商品
   */
  async updateProduct(
    id: string,
    data: UpdateProductRequest
  ): Promise<UpdateProductResponse> {
    const response = await axios.put<UpdateProductResponse>(
      `${API_BASE_URL}/api/products/${id}`,
      data
    );
    return response;
  },

  /**
   * 删除商品
   */
  async deleteProduct(id: string): Promise<DeleteProductResponse> {
    const response = await axios.delete<DeleteProductResponse>(
      `${API_BASE_URL}/api/products/${id}`
    );
    return response;
  },

  /**
   * 上架商品
   */
  async shelveProduct(
    id: string,
    data: ShelveProductRequest
  ): Promise<ShelveProductResponse> {
    const response = await axios.post<ShelveProductResponse>(
      `${API_BASE_URL}/api/products/${id}/shelve`,
      data
    );
    return response;
  },

  /**
   * 下架商品
   */
  async unshelveProduct(id: string): Promise<UnshelveProductResponse> {
    const response = await axios.post<UnshelveProductResponse>(
      `${API_BASE_URL}/api/products/${id}/unshelve`
    );
    return response;
  },
};

