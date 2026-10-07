export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  is_active: boolean;
  sort_order: number;
}

export interface ProductImage {
  id: string;
  public_id: string;
  public_url: string;
  alt_text: string | null;
  sort_order: number;
  is_primary: boolean;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  brand: string | null;
  short_description: string | null;
  description: string | null;
  price: number;
  currency: string;
  stock: number;
  low_stock_threshold: number;
  status: 'draft' | 'published' | 'archived';
  is_featured: boolean;
  is_new: boolean;
  sort_order: number;
  category_id: string;
  category_name?: string;
  category_slug?: string;
  images: ProductImage[];
}

export interface StoreConfig {
  store_name: string;
  whatsapp_number: string;
  currency: string;
}

export interface CartItem {
  product_id: string;
  name: string;
  sku: string;
  price: number;
  currency: string;
  quantity: number;
  image_url: string | null;
  stock: number;
  slug: string;
}

