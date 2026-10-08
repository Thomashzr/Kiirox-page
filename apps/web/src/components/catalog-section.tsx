'use client';

import React, { useState, useMemo } from 'react';
import { Category, Product } from '../types';
import { ProductModal } from './product-modal';
import { useCart } from '../context/cart-context';
import {
  MagnifyingGlass,
  SlidersHorizontal,
  X,
  Plus,
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
  const { addItem } = useCart();
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
            <h2 className="text-3xl sm:text-4xl font-black font-sans uppercase tracking-tight">
              Catálogo de Rendimiento
            </h2>
            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-300 font-sans mt-1">
              Inventario de precisión &middot; <span className="tabular-nums font-mono font-semibold">{filteredProducts.length}</span> referencias activas
            </p>
          </div>

          {/* Quick Search */}
          <div className="relative w-full md:w-72">
            <MagnifyingGlass
              size={16}
              className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-500 dark:text-zinc-400"
            />
            <input
              type="text"
              placeholder="Buscar gel, marca o sku..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-9 py-2 text-xs font-sans bg-zinc-50 dark:bg-zinc-950 border border-zinc-300 dark:border-zinc-700 text-black dark:text-white placeholder:text-zinc-500 focus:outline-none focus:border-black dark:focus:border-white transition-colors"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-zinc-500 hover:text-black dark:hover:text-white cursor-pointer"
                aria-label="Limpiar búsqueda"
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
              className={`px-4 py-2 text-xs font-sans font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border cursor-pointer ${
                selectedCategory === 'all'
                  ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                  : 'bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white'
              }`}
            >
              Todos ({products.length})
            </button>
            {categories.map((cat) => (
              <button
                key={cat.id}
                onClick={() => setSelectedCategory(cat.slug)}
                className={`px-4 py-2 text-xs font-sans font-semibold uppercase tracking-wider whitespace-nowrap transition-colors border cursor-pointer ${
                  selectedCategory === cat.slug
                    ? 'bg-black text-white dark:bg-white dark:text-black border-black dark:border-white'
                    : 'bg-transparent text-zinc-700 dark:text-zinc-300 border-zinc-300 dark:border-zinc-800 hover:border-black dark:hover:border-white'
                }`}
              >
                {cat.name}
              </button>
            ))}
          </div>

          {/* Secondary Toggles & Sort */}
          <div className="flex flex-wrap items-center justify-between gap-4 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-xs font-sans">
            <div className="flex items-center gap-5">
              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyFeatured}
                  onChange={(e) => setOnlyFeatured(e.target.checked)}
                  className="w-4 h-4 accent-black dark:accent-white rounded-none cursor-pointer"
                />
                <span className="uppercase text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  Solo Destacados
                </span>
              </label>

              <label className="inline-flex items-center gap-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={onlyInStock}
                  onChange={(e) => setOnlyInStock(e.target.checked)}
                  className="w-4 h-4 accent-black dark:accent-white rounded-none cursor-pointer"
                />
                <span className="uppercase text-xs font-medium text-zinc-700 dark:text-zinc-300">
                  En Stock
                </span>
              </label>
            </div>

            {/* Sort Dropdown */}
            <div className="flex items-center gap-2">
              <SlidersHorizontal size={14} className="text-zinc-500 dark:text-zinc-400" />
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-transparent border border-zinc-300 dark:border-zinc-700 px-2.5 py-1 text-xs font-sans font-medium uppercase text-black dark:text-white focus:outline-none cursor-pointer"
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
            <p className="text-sm font-sans text-zinc-600 dark:text-zinc-400 uppercase tracking-wide mb-4">
              No se encontraron productos que coincidan con los filtros seleccionados.
            </p>
            <button
              onClick={() => {
                setSelectedCategory('all');
                setSearchQuery('');
                setOnlyFeatured(false);
                setOnlyInStock(false);
                setSortBy('default');
              }}
              className="px-5 py-2.5 border border-black dark:border-white text-xs font-sans uppercase font-bold tracking-wider hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
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
                <article
                  key={product.id}
                  onClick={() => setActiveProduct(product)}
                  className="group relative flex flex-col justify-between border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-5 transition-all hover:border-black dark:hover:border-white cursor-pointer"
                >
                  <div>
                    {/* Image Area with badges */}
                    <div className="relative aspect-square w-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 overflow-hidden mb-4 flex items-center justify-center">
                      <img
                        src={primaryImg}
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-300 ease-out group-hover:scale-105"
                        loading="lazy"
                      />

                      {/* Badges */}
                      <div className="absolute top-2.5 left-2.5 flex flex-col gap-1">
                        {product.is_featured && (
                          <span className="text-[10px] font-sans font-bold uppercase bg-black text-white dark:bg-white dark:text-black px-2 py-0.5 tracking-wider">
                            DESTACADO
                          </span>
                        )}
                        {product.is_new && (
                          <span className="text-[10px] font-sans font-bold uppercase border border-black dark:border-white bg-white dark:bg-black text-black dark:text-white px-2 py-0.5 tracking-wider">
                            NUEVO
                          </span>
                        )}
                      </div>

                      {/* Stock overlay badge if low */}
                      {product.stock <= 0 && (
                        <div className="absolute inset-0 bg-black/75 backdrop-blur-[1px] flex items-center justify-center text-white font-sans text-xs uppercase font-bold tracking-widest">
                          Agotado
                        </div>
                      )}
                    </div>

                    {/* Metadata: Brand & Category */}
                    <div className="flex items-center justify-between text-[11px] font-sans font-medium uppercase tracking-wider text-zinc-600 dark:text-zinc-400 mb-1.5">
                      <span>{product.brand || 'KIIROX'}</span>
                      <span>{product.category_name}</span>
                    </div>

                    {/* Title */}
                    <h3 className="font-sans font-bold text-base uppercase tracking-tight text-black dark:text-white mb-2 line-clamp-2">
                      {product.name}
                    </h3>

                    {/* Short description */}
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-2 mb-4 leading-relaxed">
                      {product.short_description}
                    </p>
                  </div>

                  {/* Price & Action */}
                  <div className="pt-3.5 border-t border-zinc-200 dark:border-zinc-800 flex items-center justify-between gap-2">
                    <div>
                      <span className="font-mono tabular-nums font-bold text-base text-black dark:text-white">
                        {formattedPrice}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {product.stock > 0 ? (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            addItem(product, 1);
                          }}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-black dark:bg-white text-white dark:text-black text-xs font-sans uppercase font-bold tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
                          title="Agregar 1 unidad al carrito"
                          aria-label={`Agregar 1 unidad de ${product.name} al carrito`}
                        >
                          <Plus size={12} weight="bold" />
                          <span>Agregar</span>
                        </button>
                      ) : (
                        <span className="text-[11px] font-sans uppercase font-medium text-zinc-500 px-2 py-1 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800">
                          Agotado
                        </span>
                      )}
                    </div>
                  </div>

                </article>
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
