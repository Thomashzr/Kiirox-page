'use server';

import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { verifyAdminAccess } from '../../../lib/admin-auth';
import { Product, ProductImage, Category } from '../../../types';
import { v2 as cloudinary } from 'cloudinary';

function getDb() {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;
  if (!dbUrl) {
    throw new Error('DATABASE_URL no configurada en las variables de entorno');
  }
  return neon(dbUrl);
}

export interface AdminProductListItem extends Product {
  category_name: string;
}

export interface ProductFormData {
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
  initial_image?: {
    public_id: string;
    public_url: string;
    alt_text?: string;
  } | null;
}

export async function getAdminCategories(): Promise<Category[]> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  const sql = getDb();
  const rows = await sql`
    SELECT id, name, slug, description, image_url, is_active, sort_order
    FROM categories
    ORDER BY sort_order ASC, name ASC;
  `;

  return rows as Category[];
}

export async function getAdminProducts(filters?: {
  status?: string;
  search?: string;
  category_id?: string;
}): Promise<AdminProductListItem[]> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  const sql = getDb();
  const rows = await sql`
    SELECT 
      p.id, p.sku, p.name, p.slug, p.brand, p.short_description, p.description,
      p.price::float8 as price, p.currency, p.stock, p.low_stock_threshold,
      p.status, p.is_featured, p.is_new, p.sort_order, p.category_id,
      p.created_at::text, p.updated_at::text,
      c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    ORDER BY p.sort_order ASC, p.created_at DESC;
  `;

  // Fetch all primary images
  const images = await sql`
    SELECT id, product_id, public_id, public_url, alt_text, sort_order, is_primary
    FROM product_images
    ORDER BY sort_order ASC;
  `;

  const imagesByProduct = new Map<string, ProductImage[]>();
  for (const img of images) {
    const list = imagesByProduct.get(img.product_id) || [];
    list.push(img as ProductImage);
    imagesByProduct.set(img.product_id, list);
  }

  const products: AdminProductListItem[] = rows.map((r: any) => ({
    ...r,
    images: imagesByProduct.get(r.id) || [],
  }));

  // Apply filters if provided in memory
  let filtered = products;
  if (filters?.status && filters.status !== 'all') {
    filtered = filtered.filter((p) => p.status === filters.status);
  }
  if (filters?.category_id && filters.category_id !== 'all') {
    filtered = filtered.filter((p) => p.category_id === filters.category_id);
  }
  if (filters?.search) {
    const q = filters.search.toLowerCase().trim();
    filtered = filtered.filter(
      (p) =>
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
    );
  }

  return filtered;
}

export async function getAdminProductById(id: string): Promise<Product | null> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) throw new Error('No autorizado');

  const sql = getDb();
  const rows = await sql`
    SELECT 
      p.id, p.sku, p.name, p.slug, p.brand, p.short_description, p.description,
      p.price::float8 as price, p.currency, p.stock, p.low_stock_threshold,
      p.status, p.is_featured, p.is_new, p.sort_order, p.category_id,
      p.created_at::text, p.updated_at::text,
      c.name as category_name, c.slug as category_slug
    FROM products p
    LEFT JOIN categories c ON p.category_id = c.id
    WHERE p.id = ${id}::uuid
    LIMIT 1;
  `;

  if (rows.length === 0) return null;

  const images = await sql`
    SELECT id, product_id, public_id, public_url, alt_text, sort_order, is_primary
    FROM product_images
    WHERE product_id = ${id}::uuid
    ORDER BY sort_order ASC, created_at ASC;
  `;

  return {
    ...(rows[0] as Product),
    images: images as ProductImage[],
  };
}

export async function createProductAction(data: ProductFormData): Promise<{ success: boolean; productId?: string; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();

    // Check SKU and Slug uniqueness
    const existing = await sql`
      SELECT id FROM products WHERE sku = ${data.sku} OR slug = ${data.slug} LIMIT 1;
    `;
    if (existing.length > 0) {
      return { success: false, error: 'Ya existe un producto con ese SKU o Slug URL' };
    }

    const inserted = await sql`
      INSERT INTO products (
        sku, name, slug, brand, short_description, description,
        price, currency, stock, low_stock_threshold,
        status, is_featured, is_new, sort_order, category_id
      ) VALUES (
        ${data.sku}, ${data.name}, ${data.slug}, ${data.brand || null},
        ${data.short_description || null}, ${data.description || null},
        ${data.price}, ${data.currency || 'ARS'}, ${data.stock}, ${data.low_stock_threshold || 5},
        ${data.status}, ${data.is_featured}, ${data.is_new}, ${data.sort_order || 0}, ${data.category_id}::uuid
      )
      RETURNING id;
    `;

    const productId = inserted[0].id;

    // Attach initial image if uploaded
    if (data.initial_image) {
      await sql`
        INSERT INTO product_images (
          product_id, public_id, public_url, alt_text, sort_order, is_primary
        ) VALUES (
          ${productId}::uuid, ${data.initial_image.public_id}, ${data.initial_image.public_url},
          ${data.initial_image.alt_text || data.name}, 1, true
        );
      `;
    }

    revalidatePath('/admin/products');
    revalidatePath('/');
    return { success: true, productId };
  } catch (err: any) {
    console.error('Error in createProductAction:', err);
    return { success: false, error: err.message || 'Error al crear el producto' };
  }
}

export async function updateProductAction(
  id: string,
  data: ProductFormData
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();

    // Check SKU or Slug uniqueness excluding this product
    const existing = await sql`
      SELECT id FROM products
      WHERE (sku = ${data.sku} OR slug = ${data.slug}) AND id != ${id}::uuid
      LIMIT 1;
    `;
    if (existing.length > 0) {
      return { success: false, error: 'Otro producto ya posee ese SKU o Slug URL' };
    }

    await sql`
      UPDATE products SET
        sku = ${data.sku},
        name = ${data.name},
        slug = ${data.slug},
        brand = ${data.brand || null},
        short_description = ${data.short_description || null},
        description = ${data.description || null},
        price = ${data.price},
        currency = ${data.currency || 'ARS'},
        stock = ${data.stock},
        low_stock_threshold = ${data.low_stock_threshold},
        status = ${data.status},
        is_featured = ${data.is_featured},
        is_new = ${data.is_new},
        sort_order = ${data.sort_order},
        category_id = ${data.category_id}::uuid,
        updated_at = NOW()
      WHERE id = ${id}::uuid;
    `;

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${id}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    console.error('Error in updateProductAction:', err);
    return { success: false, error: err.message || 'Error al actualizar el producto' };
  }
}

export async function toggleProductStatusAction(
  id: string,
  currentStatus: 'published' | 'draft' | 'archived'
): Promise<{ success: boolean; newStatus?: string; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  const newStatus = currentStatus === 'published' ? 'draft' : 'published';

  try {
    const sql = getDb();
    await sql`
      UPDATE products
      SET status = ${newStatus}, updated_at = NOW()
      WHERE id = ${id}::uuid;
    `;

    revalidatePath('/admin/products');
    revalidatePath('/');
    return { success: true, newStatus };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al cambiar estado' };
  }
}

export async function archiveProductAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();
    await sql`
      UPDATE products
      SET status = 'archived', updated_at = NOW()
      WHERE id = ${id}::uuid;
    `;

    revalidatePath('/admin/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al archivar el producto' };
  }
}

export async function deleteProductPermanentAction(id: string): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();

    // Check for images to clean up
    const images = await sql`
      SELECT public_id FROM product_images WHERE product_id = ${id}::uuid;
    `;

    // Attempt deleting from DB first
    await sql`
      DELETE FROM products WHERE id = ${id}::uuid;
    `;

    // Clean up images in Cloudinary if configured
    const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
    const apiKey = process.env.CLOUDINARY_API_KEY;
    const apiSecret = process.env.CLOUDINARY_API_SECRET;

    if (cloudName && apiKey && apiSecret && images.length > 0) {
      cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
      for (const img of images) {
        if (img.public_id && !img.public_id.startsWith('http')) {
          try {
            await cloudinary.uploader.destroy(img.public_id, { invalidate: true });
          } catch (e) {
            console.error('Failed to destroy Cloudinary image:', img.public_id, e);
          }
        }
      }
    }

    revalidatePath('/admin/products');
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar el producto' };
  }
}

export async function addProductImageAction(
  productId: string,
  image: {
    public_id: string;
    public_url: string;
    alt_text?: string;
    sort_order?: number;
    is_primary?: boolean;
  }
): Promise<{ success: boolean; image?: ProductImage; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();

    if (image.is_primary) {
      await sql`
        UPDATE product_images
        SET is_primary = false
        WHERE product_id = ${productId}::uuid;
      `;
    }

    const inserted = await sql`
      INSERT INTO product_images (
        product_id, public_id, public_url, alt_text, sort_order, is_primary
      ) VALUES (
        ${productId}::uuid, ${image.public_id}, ${image.public_url},
        ${image.alt_text || null}, ${image.sort_order || 1}, ${image.is_primary || false}
      )
      RETURNING id, product_id, public_id, public_url, alt_text, sort_order, is_primary, created_at::text;
    `;

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/');
    return { success: true, image: inserted[0] as ProductImage };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al agregar la imagen' };
  }
}

export async function deleteProductImageAction(
  productId: string,
  imageId: string,
  publicId?: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();

    await sql`
      DELETE FROM product_images
      WHERE id = ${imageId}::uuid AND product_id = ${productId}::uuid;
    `;

    // If remaining images have no primary, promote the first
    await sql`
      UPDATE product_images
      SET is_primary = true
      WHERE id = (
        SELECT id FROM product_images
        WHERE product_id = ${productId}::uuid
        ORDER BY sort_order ASC
        LIMIT 1
      )
      AND NOT EXISTS (
        SELECT 1 FROM product_images
        WHERE product_id = ${productId}::uuid AND is_primary = true
      );
    `;

    // Attempt destroy in Cloudinary
    if (publicId && !publicId.startsWith('http')) {
      const cloudName = process.env.CLOUDINARY_CLOUD_NAME || process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
      const apiKey = process.env.CLOUDINARY_API_KEY;
      const apiSecret = process.env.CLOUDINARY_API_SECRET;
      if (cloudName && apiKey && apiSecret) {
        cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true });
        try {
          await cloudinary.uploader.destroy(publicId, { invalidate: true });
        } catch (e) {
          console.error('Failed to destroy Cloudinary image:', publicId, e);
        }
      }
    }

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al eliminar la imagen' };
  }
}

export async function setPrimaryProductImageAction(
  productId: string,
  imageId: string
): Promise<{ success: boolean; error?: string }> {
  const auth = await verifyAdminAccess();
  if (!auth.authorized) return { success: false, error: 'No autorizado' };

  try {
    const sql = getDb();
    await sql`
      UPDATE product_images
      SET is_primary = false
      WHERE product_id = ${productId}::uuid;
    `;

    await sql`
      UPDATE product_images
      SET is_primary = true
      WHERE id = ${imageId}::uuid AND product_id = ${productId}::uuid;
    `;

    revalidatePath('/admin/products');
    revalidatePath(`/admin/products/${productId}`);
    revalidatePath('/');
    return { success: true };
  } catch (err: any) {
    return { success: false, error: err.message || 'Error al actualizar imagen principal' };
  }
}
