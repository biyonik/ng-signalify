/**
 * TR: Ürün state yönetimi için EntityStore.
 * EN: EntityStore for product state management.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { Injectable } from '@angular/core';
import { EntityStore, PaginatedResponse, FetchParams, EntityId } from 'ng-signalify/store';
import { Product } from './product.model';

// Mock products data
const MOCK_PRODUCTS: Product[] = [
  {
    id: 1,
    name: 'Wireless Headphones',
    sku: 'WH-001',
    description: 'Premium wireless headphones with active noise cancellation',
    price: 299.99,
    discount: 10,
    categories: ['electronics'],
    tags: ['new', 'featured'],
    stockLevel: 150,
    primaryColor: '#000000',
    isActive: true,
    createdAt: new Date('2023-01-10'),
    updatedAt: new Date('2023-01-10')
  },
  {
    id: 2,
    name: 'Cotton T-Shirt',
    sku: 'TS-002',
    description: '100% organic cotton t-shirt, comfortable and breathable',
    price: 29.99,
    discount: 15,
    categories: ['clothing'],
    tags: ['sale', 'bestseller'],
    stockLevel: 500,
    primaryColor: '#FFFFFF',
    isActive: true,
    createdAt: new Date('2023-02-15'),
    updatedAt: new Date('2023-02-15')
  },
  {
    id: 3,
    name: 'Programming Book Bundle',
    sku: 'BK-003',
    description: 'Complete guide to modern web development',
    price: 79.99,
    discount: 0,
    categories: ['books'],
    tags: ['new'],
    stockLevel: 80,
    primaryColor: '#0066CC',
    isActive: true,
    createdAt: new Date('2023-03-20'),
    updatedAt: new Date('2023-03-20')
  },
  {
    id: 4,
    name: 'Garden Tool Set',
    sku: 'GT-004',
    description: 'Professional 10-piece garden tool set',
    price: 149.99,
    discount: 20,
    categories: ['home'],
    tags: ['sale'],
    stockLevel: 45,
    primaryColor: '#228B22',
    isActive: true,
    createdAt: new Date('2023-04-12'),
    updatedAt: new Date('2023-04-12')
  },
  {
    id: 5,
    name: 'Yoga Mat',
    sku: 'YM-005',
    description: 'Eco-friendly non-slip yoga mat with carrying strap',
    price: 49.99,
    discount: 0,
    categories: ['sports'],
    tags: ['trending', 'featured'],
    stockLevel: 200,
    primaryColor: '#9C27B0',
    isActive: true,
    createdAt: new Date('2023-05-08'),
    updatedAt: new Date('2023-05-08')
  },
  {
    id: 6,
    name: 'Building Blocks Set',
    sku: 'TB-006',
    description: 'Educational building blocks for kids aged 3+',
    price: 39.99,
    discount: 5,
    categories: ['toys'],
    tags: ['bestseller'],
    stockLevel: 320,
    primaryColor: '#FF5722',
    isActive: true,
    createdAt: new Date('2023-06-15'),
    updatedAt: new Date('2023-06-15')
  }
];

@Injectable({ providedIn: 'root' })
export class ProductStore extends EntityStore<Product> {
  constructor() {
    super({
      name: 'products',
      selectId: (product) => product.id,
      defaultPageSize: 10,
      cacheTTL: 5 * 60 * 1000,
      optimistic: true
    });
  }

  protected async fetchAll(params: FetchParams): Promise<PaginatedResponse<Product>> {
    await this.delay(500);
    
    let filtered = [...MOCK_PRODUCTS];
    
    // Apply search filter
    if (params.filters?.['search']) {
      const search = String(params.filters['search']).toLowerCase();
      filtered = filtered.filter((p: Product) => 
        p.name.toLowerCase().includes(search) ||
        p.sku.toLowerCase().includes(search) ||
        p.description.toLowerCase().includes(search)
      );
    }
    
    // Apply sorting with null checks
    if (params.sort) {
      filtered.sort((a, b) => {
        const aVal = a[params.sort!.field as keyof Product];
        const bVal = b[params.sort!.field as keyof Product];
        if (aVal == null || bVal == null) return 0;
        const modifier = params.sort!.direction === 'asc' ? 1 : -1;
        return aVal > bVal ? modifier : -modifier;
      });
    }
    
    // Apply pagination with defaults
    const page = params.page ?? 1;
    const pageSize = params.pageSize ?? 10;
    const start = (page - 1) * pageSize;
    const end = start + pageSize;
    const data = filtered.slice(start, end);
    
    return {
      data,
      total: filtered.length,
      page,
      pageSize
    };
  }

  protected async fetchOne(id: EntityId): Promise<Product> {
    await this.delay(300);
    const product = MOCK_PRODUCTS.find(p => p.id === id);
    if (!product) throw new Error('Product not found');
    return { ...product };
  }

  protected async createOne(data: Partial<Product>): Promise<Product> {
    await this.delay(500);
    const newProduct = {
      ...data,
      id: Math.max(...MOCK_PRODUCTS.map(p => p.id)) + 1,
      createdAt: new Date(),
      updatedAt: new Date()
    } as Product;
    MOCK_PRODUCTS.push(newProduct);
    return newProduct;
  }

  protected async updateOne(id: EntityId, data: Partial<Product>): Promise<Product> {
    await this.delay(500);
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    
    MOCK_PRODUCTS[index] = {
      ...MOCK_PRODUCTS[index],
      ...data,
      updatedAt: new Date()
    };
    return { ...MOCK_PRODUCTS[index] };
  }

  protected async deleteOne(id: EntityId): Promise<void> {
    await this.delay(500);
    const index = MOCK_PRODUCTS.findIndex(p => p.id === id);
    if (index === -1) throw new Error('Product not found');
    MOCK_PRODUCTS.splice(index, 1);
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}
