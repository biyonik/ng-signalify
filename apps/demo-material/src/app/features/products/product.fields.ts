/**
 * TR: Ürün formu field tanımları.
 * EN: Product form field definitions.
 *
 * @author Ahmet ALTUN
 * @github github.com/biyonik
 * @linkedin linkedin.com/in/biyonik
 * @email ahmet.altun60@gmail.com
 */
import { 
  StringField, 
  DecimalField, 
  MultiEnumField, 
  SliderField, 
  ColorField,
  BooleanField,
  TextAreaField
} from 'ng-signalify/fields';

export const productFields = [
  new StringField('name', 'Product Name', {
    required: true,
    min: 3,
    max: 100,
    hint: 'Enter the product name'
  }),
  
  new StringField('sku', 'SKU', {
    required: true,
    min: 3,
    max: 50,
    hint: 'Stock Keeping Unit'
  }),
  
  new TextAreaField('description', 'Description', {
    required: true,
    maxLength: 1000,
    hint: 'Product description (max 1000 characters)'
  }),
  
  new DecimalField('price', 'Price', {
    required: true,
    min: 0,
    max: 999999,
    hint: 'Product price in USD'
  }),
  
  new DecimalField('discount', 'Discount %', {
    min: 0,
    max: 100,
    hint: 'Discount percentage (0-100)'
  }),
  
  new MultiEnumField('categories', 'Categories', [
    { id: 'electronics', label: 'Electronics' },
    { id: 'clothing', label: 'Clothing' },
    { id: 'books', label: 'Books' },
    { id: 'home', label: 'Home & Garden' },
    { id: 'sports', label: 'Sports' },
    { id: 'toys', label: 'Toys' }
  ], { required: true }),
  
  new MultiEnumField('tags', 'Tags', [
    { id: 'new', label: 'New Arrival' },
    { id: 'sale', label: 'On Sale' },
    { id: 'featured', label: 'Featured' },
    { id: 'trending', label: 'Trending' },
    { id: 'bestseller', label: 'Best Seller' }
  ]),
  
  new SliderField('stockLevel', 'Stock Level', {
    min: 0,
    max: 1000,
    step: 10,
    hint: 'Current stock quantity'
  }),
  
  new ColorField('primaryColor', 'Primary Color', {
    hint: 'Main product color'
  }),
  
  new BooleanField('isActive', 'Active')
];
