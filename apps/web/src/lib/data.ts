import { neon } from '@neondatabase/serverless';
import { Category, Product, StoreConfig } from '../types';

export const fallbackCategories: Category[] = [
  {
    id: 'c1000000-0000-0000-0000-000000000001',
    name: 'Geles Energéticos',
    slug: 'geles-energeticos',
    description: 'Geles de absorción rápida para running y deportes de resistencia',
    image_url: null,
    is_active: true,
    sort_order: 1,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000002',
    name: 'Proteínas & Recuperadores',
    slug: 'proteinas-recuperadores',
    description: 'Fórmulas avanzadas para reconstrucción muscular',
    image_url: null,
    is_active: true,
    sort_order: 2,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000003',
    name: 'Hidratación & Electrolitos',
    slug: 'hidratacion-electrolitos',
    description: 'Sales minerales y mezclas isotónicas',
    image_url: null,
    is_active: true,
    sort_order: 3,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000004',
    name: 'Barras & Snacks',
    slug: 'barras-snacks',
    description: 'Carbohidratos y nutrición sólida para entrenamientos',
    image_url: null,
    is_active: true,
    sort_order: 4,
  },
  {
    id: 'c1000000-0000-0000-0000-000000000005',
    name: 'Vitaminas & Salud',
    slug: 'vitaminas-salud',
    description: 'Micronutrientes esenciales para rendimiento sostenido',
    image_url: null,
    is_active: true,
    sort_order: 5,
  },
];

export const fallbackProducts: Product[] = [
  {
    id: 'b1000000-0000-0000-0000-000000000001',
    sku: 'GEL-MAURTEN-100',
    name: 'Gel Maurten 100 Hydrogel',
    slug: 'gel-maurten-100-hydrogel',
    brand: 'Maurten',
    short_description: 'Gel energético con tecnología de hidrogel para máxima tolerancia gástrica.',
    description: 'Construido con tecnología de hidrogel patentada, contiene 25 gramos de carbohidratos por porción en una relación 0.8:1 de fructosa a glucosa.',
    price: 4800,
    currency: 'ARS',
    stock: 50,
    low_stock_threshold: 10,
    status: 'published',
    is_featured: true,
    is_new: true,
    sort_order: 1,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    category_name: 'Geles Energéticos',
    category_slug: 'geles-energeticos',
    images: [
      {
        id: 'img-1',
        public_id: 'kiirox/products/maurten-gel-100',
        public_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Gel Maurten 100 Hydrogel Pack',
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000002',
    sku: 'GEL-SIS-ISOTONIC-APPLE',
    name: 'SiS GO Isotonic Gel Manzana 60ml',
    slug: 'sis-go-isotonic-gel-manzana',
    brand: 'Science in Sport',
    short_description: 'El primer gel isotónico del mundo. Asimilación inmediata sin necesidad de agua.',
    description: 'Proporciona 22 gramos de carbohidratos de asimilación rápida en una consistencia fluida y digestiva.',
    price: 3200,
    currency: 'ARS',
    stock: 40,
    low_stock_threshold: 8,
    status: 'published',
    is_featured: true,
    is_new: false,
    sort_order: 2,
    category_id: 'c1000000-0000-0000-0000-000000000001',
    category_name: 'Geles Energéticos',
    category_slug: 'geles-energeticos',
    images: [
      {
        id: 'img-2',
        public_id: 'kiirox/products/sis-isotonic-apple',
        public_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?auto=format&fit=crop&w=800&q=80',
        alt_text: 'SiS GO Isotonic Gel Manzana',
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000003',
    sku: 'PROT-ON-GOLD-WHEY-2LB',
    name: 'Optimum Nutrition Gold Standard 100% Whey 2lb',
    slug: 'on-gold-standard-whey-2lb',
    brand: 'Optimum Nutrition',
    short_description: 'La proteína de suero aislada número 1 para recuperación muscular.',
    description: 'Aporta 24 gramos de proteína con aislado de suero primario, 5.5 gramos de BCAAs y 4 gramos de glutamina por porción.',
    price: 52000,
    currency: 'ARS',
    stock: 15,
    low_stock_threshold: 3,
    status: 'published',
    is_featured: true,
    is_new: false,
    sort_order: 1,
    category_id: 'c1000000-0000-0000-0000-000000000002',
    category_name: 'Proteínas & Recuperadores',
    category_slug: 'proteinas-recuperadores',
    images: [
      {
        id: 'img-3',
        public_id: 'kiirox/products/on-gold-whey-2lb',
        public_url: 'https://images.unsplash.com/photo-1584308666744-24d5c474f2ae?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Optimum Nutrition Gold Standard Whey 2lb',
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000004',
    sku: 'HYD-SKRATCH-LEMON-440G',
    name: 'Skratch Labs Sport Hydration Drink Mix Limón 440g',
    slug: 'skratch-labs-hydration-limon-440g',
    brand: 'Skratch Labs',
    short_description: 'Mezcla hidratante con fruta real, electrolitos esenciales y azúcar de caña.',
    description: 'Creado para reemplazar exactamente lo que pierdes al sudar. Sin saborizantes sintéticos ni colorantes.',
    price: 28500,
    currency: 'ARS',
    stock: 25,
    low_stock_threshold: 5,
    status: 'published',
    is_featured: false,
    is_new: true,
    sort_order: 1,
    category_id: 'c1000000-0000-0000-0000-000000000003',
    category_name: 'Hidratación & Electrolitos',
    category_slug: 'hidratacion-electrolitos',
    images: [
      {
        id: 'img-4',
        public_id: 'kiirox/products/skratch-lemon',
        public_url: 'https://images.unsplash.com/photo-1517838277536-f5f99be501cd?auto=format&fit=crop&w=800&q=80',
        alt_text: 'Skratch Labs Sport Hydration Limón',
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
  {
    id: 'b1000000-0000-0000-0000-000000000005',
    sku: 'HYD-SALTSTICK-CAPS-100',
    name: 'SaltStick Electrolyte Caps 100 Cápsulas',
    slug: 'saltstick-electrolyte-caps-100',
    brand: 'SaltStick',
    short_description: 'Cápsulas de sales minerales para prevenir calambres y deshidratación.',
    description: 'Fórmula de electrolitos quelados de alta biodisponibilidad que imita el perfil de pérdidas minerales por transpiración.',
    price: 21000,
    currency: 'ARS',
    stock: 18,
    low_stock_threshold: 4,
    status: 'published',
    is_featured: false,
    is_new: false,
    sort_order: 2,
    category_id: 'c1000000-0000-0000-0000-000000000003',
    category_name: 'Hidratación & Electrolitos',
    category_slug: 'hidratacion-electrolitos',
    images: [
      {
        id: 'img-5',
        public_id: 'kiirox/products/saltstick-caps',
        public_url: 'https://images.unsplash.com/photo-1579722820308-d74e571900a9?auto=format&fit=crop&w=800&q=80',
        alt_text: 'SaltStick Electrolyte Caps 100 Cápsulas',
        sort_order: 1,
        is_primary: true,
      },
    ],
  },
];

export const storeConfig: StoreConfig = {
  store_name: 'KIIROX',
  whatsapp_number: '+5491100000000',
  currency: 'ARS',
};

export async function getStoreData(): Promise<{
  categories: Category[];
  products: Product[];
  config: StoreConfig;
}> {
  const dbUrl = process.env.DATABASE_URL || process.env.DATABASE_URL_UNPOOLED;

  if (!dbUrl) {
    return {
      categories: fallbackCategories,
      products: fallbackProducts,
      config: storeConfig,
    };
  }

  try {
    const sql = neon(dbUrl);

    const [catRows, prodRows, imgRows] = await Promise.all([
      sql`
        SELECT id, name, slug, description, image_url, is_active, sort_order
        FROM categories
        WHERE is_active = true
        ORDER BY sort_order ASC;
      `,
      sql`
        SELECT 
          p.id, p.sku, p.name, p.slug, p.brand, p.short_description, p.description,
          p.price::float8 as price, p.currency, p.stock, p.low_stock_threshold,
          p.status, p.is_featured, p.is_new, p.sort_order, p.category_id,
          c.name as category_name, c.slug as category_slug
        FROM products p
        JOIN categories c ON p.category_id = c.id
        WHERE p.status = 'published'
        ORDER BY p.sort_order ASC, p.created_at DESC;
      `,
      sql`
        SELECT id, product_id, public_id, public_url, alt_text, sort_order, is_primary
        FROM product_images
        ORDER BY sort_order ASC;
      `,
    ]);

    if (prodRows.length === 0) {
      return {
        categories: fallbackCategories,
        products: fallbackProducts,
        config: storeConfig,
      };
    }

    const imagesByProductId = new Map<string, any[]>();
    for (const img of imgRows) {
      const list = imagesByProductId.get(img.product_id) || [];
      list.push(img);
      imagesByProductId.set(img.product_id, list);
    }

    const products: Product[] = prodRows.map((p: any) => {
      const images = imagesByProductId.get(p.id) || [];
      if (images.length === 0) {
        images.push({
          id: `img-${p.id}`,
          public_id: `kiirox-${p.slug}`,
          public_url: 'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80',
          alt_text: p.name,
          sort_order: 1,
          is_primary: true,
        });
      }
      return {
        id: String(p.id),
        sku: String(p.sku),
        name: String(p.name),
        slug: String(p.slug),
        brand: p.brand ? String(p.brand) : null,
        short_description: p.short_description ? String(p.short_description) : null,
        description: p.description ? String(p.description) : null,
        price: Number(p.price),
        currency: String(p.currency || 'ARS'),
        stock: Number(p.stock),
        low_stock_threshold: Number(p.low_stock_threshold),
        status: p.status as 'draft' | 'published' | 'archived',
        is_featured: Boolean(p.is_featured),
        is_new: Boolean(p.is_new),
        sort_order: Number(p.sort_order),
        category_id: String(p.category_id),
        category_name: p.category_name ? String(p.category_name) : undefined,
        category_slug: p.category_slug ? String(p.category_slug) : undefined,
        images,
      };
    });

    const categories: Category[] = catRows.map((c: any) => ({
      id: String(c.id),
      name: String(c.name),
      slug: String(c.slug),
      description: c.description ? String(c.description) : null,
      image_url: c.image_url ? String(c.image_url) : null,
      is_active: Boolean(c.is_active),
      sort_order: Number(c.sort_order),
    }));

    return {
      categories,
      products,
      config: storeConfig,
    };
  } catch (err) {
    console.warn('Neon query fallback to local state:', err);
    return {
      categories: fallbackCategories,
      products: fallbackProducts,
      config: storeConfig,
    };
  }
}
