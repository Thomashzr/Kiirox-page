'use client';

import React, { useState, useMemo } from 'react';
import { Category, Product } from '../types';
import { ProductModal } from './product-modal';
import {
  MagnifyingGlass,
  SlidersHorizontal,
  X,
  ArrowRight,
  Eye,
} from '@phosphor-icons/react';

interface CatalogSectionProps {
  categories: Category[];
  products: Product[];
  whatsappNumber?: string;
}

export function CatalogSection({
  categories,
  products,
  whatsappNumber = '+5491100000000',
}: CatalogSectionProps) {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [onlyFeatured, setOnlyFeatured] = useState<boolean>(false);
  const [onlyInStock, setOnlyInStock] = useState<boolean>(false);
  const [sortBy, setSortBy] = useState<'default' | 'price-asc' | 'price-desc' | 'name'>('default');
  const [activeProduct, setActiveProduct] = useState<Product | null>(null);

  // Filter & sort logic
  const filteredProducts = useMemo(() => {
    return products
      .filter((p) => {
        // Category filter
        if (selectedCategory !== 'all') {
          if (p.category_slug !== selectedCategory && p.category_id !== selectedCategory) {
            return false;
          }
        }

        // Featured filter
        if (onlyFeatured && !p.is_featured) {
          return false;
        }

        // In-stock filter
        if (onlyInStock && p.stock <= 0) {
          return false;
        }

        // Search filter
        if (searchQuery.trim() !== '') {
          const query = searchQuery.toLowerCase().trim();
          const nameMatch = p.name.toLowerCase().includes(query);
          const brandMatch = p.brand?.toLowerCase().includes(query) ?? false;
          const descMatch = p.short_description?.toLowerCase().includes(query) ?? false;
          const skuMatch = p.sku.toLowerCase().includes(query);
          if (!nameMatch && !brandMatch && !descMatch && !skuMatch) {
            return false;
          }
        }

        return true;
      })
      .sort((a, b) => {
        if (sortBy === 'price-asc') return a.price - b.price;
        if (sortBy === 'price-desc') return b.price - a.price;
        if (sortBy === 'name') return a.name.localeCompare(b.name);
        return a.sort_order - b.sort_order;
      });
  }, [products, selectedCategory, onlyFeatured, onlyInStock, searchQuery, sortBy]);

  return (
    <section id="catalogo" className="w-full bg-white dark:bg-black text-black dark:text-white py-16 sm:py-24 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 dark:border-zinc-800 pb-8 mb-10">
          <div>
            <div className="text-xs font-mono tracking-widest text-zinc-500 uppercase mb-2">
              INVENTARIO DISPONIBLE &middot; {products.length} REFERENCIAS
            </div>
            <h2 className="text-3xl sm:text-4xl font-black font-sans uppercase tracking-tight">
              Catálogo de Productos
            </h2>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            />
            <input
              type="text"
              placeholder="Buscar por marca o gel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs font-mono bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white placeholder:text-zinc-400 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-400 hover:text-black dark:hover:text-white"
              >
                <X size={14} />
              </button>
            )}
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-col gap-4 mb-8">
          {/* Category Tabs */}
          <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
            <button
              onClick={() => setSelectedCategory('all')}
              className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors border ${
                selectedCategory === 'all'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                  : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white'
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-3.5 py-1.5 text-xs font-mono uppercase tracking-wider whitespace-nowrap transition-colors border ${
                  selectedCategory === cat.slug
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white font-bold'
                    : 'bg-transparent text-zinc-600 dark:text-zinc-400 border-zinc-200 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Secondary Toggles & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-100 dark:border-zinc-900 text-xs font-mono">
            <div className="flex items-center gap-4">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(e) => setOnlyFeatured(e.target.checked)}
                  className="w-3.5 h-3.5 accent-black dark:accent-white rounded-none cursor-pointer"
                />
                <span className="uppercase text-zinc-600 dark:text-zinc-400">
                  Solo Destacados
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-3.5 h-3.5 accent-black dark:accent-white rounded-none cursor-pointer"
                />
                <span className="uppercase text-zinc-600 dark:text-zinc-400">
                  En Stock
                </span>
              </label>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border border-zinc-200 dark:border-zinc-800 px-2 py-1 text-xs font-mono uppercase text-zinc-700 dark:text-zinc-300 focus:outline-none cursor-pointer"
              >
                <option value="default" className="bg-white dark:bg-black">Orden de catálogo</option>
                <option value="price-asc" className="bg-white dark:bg-black">Precio: menor a mayor</option>
                <option value="price-desc" className="bg-white dark:bg-black">Precio: mayor a menor</option>
                <option value="name" className="bg-white dark:bg-black">Nombre A-Z</option>
              </select>
            </div>
          </div>
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length === 0 ? (
          <div className="border border-dashed border-zinc-300 dark:border-zinc-800 p-12 text-center my-8">
            <p className="text-sm font-mono text-zinc-500 uppercase mb-4">
              No se encontraron productos que coincidan con los filtros.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyFeatured(false);
                setOnlyInStock(false);
                setSortBy('default');
              }}
              className="px-4 py-2 border border-black dark:border-white text-xs font-mono uppercase font-bold hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
            >
              Restablecer Filtros
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => {
              const primaryImg =
                product.images.find((img) => img.is_primary)?.public_url ||
                product.images[0]?.public_url ||
                'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';

              const formattedPrice = new Intl.NumberFormat('es-AR', {
                style: 'currency',
                currency: product.currency || 'ARS',
                maximumFractionDigits: 0,
              }).format(product.price);

              return (
                <div
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className="group relative flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-4 transition-all hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <div>
                    {/* Image Area with badges */}
                    <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-900 overflow-hidden mb-4 flex items-center justify-center">
                      <img
                        src={primaryImg}
                        alt={product.name}
                        className="w-full h-full object-cover grayscale contrast-125 group-hover:grayscale-0 group-hover:scale-105 transition-all duration-300"
                        loading="lazy"
                      />

                      {/* Badges */}
                      <div className="absolute top-2 left-2 flex flex-col gap-1">
                        {product.is_featured && (
                          <span className="text-[9px] font-mono font-bold uppercase bg-black text-white dark:bg-white dark:text-black px-1.5 py-0.5 tracking-wider">
                            DESTACADO
                          </span>
                        )}
                        {product.is_new && (
                          <span className="text-[9px] font-mono font-bold uppercase border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-1.5 py-0.5 tracking-wider">
                            NUEVO
                          </span>
                        )}
                      </div>

                      {/* Stock overlay badge if low */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/60 backdrop-blur-[1px] flex items-center justify-center text-white font-mono text-xs uppercase font-bold tracking-widest">
                          Agotado
                        </div>
                      )}
                    </div>

                    {/* Metadata */}
                    <div className="flex items-center justify-between text-[11px] font-mono text-zinc-500 uppercase mb-1">
                      <span>{product.brand || 'KIIROX'}</span>
                      <span>{product.category_name}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-sans font-bold text-base uppercase tracking-tight text-black dark:text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Short description */}
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 line-clamp-2 mb-4">
                      {product.short_description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between">
                    <span className="font-mono font-bold text-base text-black dark:text-white">
                      {formattedPrice}
                    </span>
                    <button
                      type="button"
                      className="inline-flex items-center gap-1 text-xs font-mono uppercase font-bold text-zinc-600 dark:text-zinc-400 group-hover:text-black dark:group-hover:text-white transition-colors"
                    >
                      <span>Detalle</span>
                      <ArrowRight size={13} weight="bold" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Product Detail Modal */}
      <ProductModal
        product={activeProduct}
        onClose={() => setActiveProduct(null)}
        whatsappNumber={whatsappNumber}
      />
    </section>
  );
}
