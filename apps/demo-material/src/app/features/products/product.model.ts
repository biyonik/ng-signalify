/**
 * TR: Ürün veri modeli.
 * EN: Product data model.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
export interface Product {
  id: number;
  name: string;
  sku: string;
  description: string;
  price: number;
  discount: number;
  categories: string[];
  tags: string[];
  stockLevel: number;
  primaryColor: string;
  productImage?: string;
  isActive: boolean;
  createdAt?: Date;
  updatedAt?: Date;
}
