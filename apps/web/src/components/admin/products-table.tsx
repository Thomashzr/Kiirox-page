'use client';

import React, { useState, useTransition } from 'react';
import Link from 'next/link';
import {
  MagnifyingGlass,
  Plus,
  PencilSimple,
  Archive,
  Trash,
  Eye,
  EyeSlash,
  Star,
  Sparkle,
} from '@phosphor-icons/react';
import {
  AdminProductListItem,
  toggleProductStatusAction,
  archiveProductAction,
  deleteProductPermanentAction,
} from '../../app/admin/products/actions';
import { Category } from '../../types';
import { formatCurrency } from '../../lib/cart-utils';

interface ProductsTableProps {
  initialProducts: AdminProductListItem[];
  categories: Category[];
}

export function ProductsTable({ initialProducts, categories }: ProductsTableProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'published' | 'draft' | 'archived'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [isPending, startTransition] = useTransition();
  const [actionError, setActionError] = useState<string | null>(null);

  // Filter products
  const filteredProducts = products.filter((product) => {
    // Status filter
    if (statusFilter !== 'all' && product.status !== statusFilter) return false;

    // Category filter
    if (categoryFilter !== 'all' && product.category_id !== categoryFilter) return false;

    // Search filter
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      const matchName = product.name.toLowerCase().includes(q);
      const matchSku = product.sku.toLowerCase().includes(q);
      const matchBrand = product.brand?.toLowerCase().includes(q) || false;
      if (!matchName && !matchSku && !matchBrand) return false;
    }

    return true;
  });

  const handleToggleStatus = (id: string, currentStatus: 'published' | 'draft' | 'archived') => {
    setActionError(null);
    startTransition(async () => {
      // Optimistic update
      const nextStatus = currentStatus === 'published' ? 'draft' : 'published';
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: nextStatus } : p))
      );

      const res = await toggleProductStatusAction(id, currentStatus);
      if (!res.success) {
        setActionError(res.error || 'Error al cambiar estado');
        // Revert
        setProducts(initialProducts);
      }
    });
  };

  const handleArchive = (id: string, name: string) => {
    if (!window.confirm(`¿Estás seguro de que deseas archivar el producto "${name}"? Dejará de ser visible en la tienda pública.`)) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      setProducts((prev) =>
        prev.map((p) => (p.id === id ? { ...p, status: 'archived' } : p))
      );

      const res = await archiveProductAction(id);
      if (!res.success) {
        setActionError(res.error || 'Error al archivar');
        setProducts(initialProducts);
      }
    });
  };

  const handleDeletePermanent = (id: string, name: string) => {
    if (
      !window.confirm(
        `⚠️ ATENCIÓN: ¿Eliminar PERMANENTEMENTE "${name}"?\nEsta acción es irreversible y removerá el producto y sus fotos asociadas.`
      )
    ) {
      return;
    }

    setActionError(null);
    startTransition(async () => {
      setProducts((prev) => prev.filter((p) => p.id !== id));

      const res = await deleteProductPermanentAction(id);
      if (!res.success) {
        setActionError(res.error || 'Error al eliminar el producto');
        setProducts(initialProducts);
      }
    });
  };

  return (
    <div className="space-y-6">
      {/* Action Error Notification */}
      {actionError && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-400 text-xs font-mono flex items-center justify-between">
          <span>{actionError}</span>
          <button onClick={() => setActionError(null)} className="text-white hover:underline text-[11px]">
            Cerrar
          </button>
        </div>
      )}

      {/* Control Bar: Filters & Search */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-4">
        {/* Status Filter Tabs */}
        <div className="flex items-center gap-1 overflow-x-auto pb-1 md:pb-0">
          <button
            onClick={() => setStatusFilter('all')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
              statusFilter === 'all'
                ? 'bg-white text-black font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Todos ({products.length})
          </button>
          <button
            onClick={() => setStatusFilter('published')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
              statusFilter === 'published'
                ? 'bg-white text-black font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Publicados ({products.filter((p) => p.status === 'published').length})
          </button>
          <button
            onClick={() => setStatusFilter('draft')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
              statusFilter === 'draft'
                ? 'bg-white text-black font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Borradores ({products.filter((p) => p.status === 'draft').length})
          </button>
          <button
            onClick={() => setStatusFilter('archived')}
            className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider transition-colors whitespace-nowrap ${
              statusFilter === 'archived'
                ? 'bg-white text-black font-bold'
                : 'text-zinc-400 hover:text-white hover:bg-zinc-900'
            }`}
          >
            Archivados ({products.filter((p) => p.status === 'archived').length})
          </button>
        </div>

        {/* Search & Category Filter */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Category Dropdown */}
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
            className="bg-black border border-zinc-800 px-3 py-1.5 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white"
          >
            <option value="all">Todas las categorías</option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>

          {/* Search Input */}
          <div className="relative min-w-[220px]">
            <MagnifyingGlass size={14} className="absolute left-3 top-2.5 text-zinc-500" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nombre, SKU..."
              className="w-full bg-black border border-zinc-800 pl-8 pr-3 py-1.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white"
            />
          </div>

          {/* Create Button */}
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 transition-colors shrink-0"
          >
            <Plus size={14} weight="bold" />
            <span>Nuevo Producto</span>
          </Link>
        </div>
      </div>

      {/* Table Container */}
      <div className="border border-zinc-800 bg-black overflow-x-auto">
        <table className="w-full text-left text-xs font-mono border-collapse">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-950 text-zinc-400 uppercase tracking-wider text-[11px]">
              <th className="py-3 px-4 w-12 text-center">Foto</th>
              <th className="py-3 px-4">Producto & SKU</th>
              <th className="py-3 px-4">Categoría</th>
              <th className="py-3 px-4 text-right">Precio</th>
              <th className="py-3 px-4 text-center">Stock</th>
              <th className="py-3 px-4 text-center">Estado</th>
              <th className="py-3 px-4 text-center">Flags</th>
              <th className="py-3 px-4 text-right">Acciones</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900">
            {filteredProducts.length === 0 ? (
              <tr>
                <td colSpan={8} className="py-12 text-center text-zinc-500 font-mono text-xs">
                  No se encontraron productos que coincidan con los filtros aplicados.
                </td>
              </tr>
            ) : (
              filteredProducts.map((p) => {
                const primaryImg = p.images?.find((img) => img.is_primary) || p.images?.[0];
                const isLowStock = p.stock > 0 && p.stock <= p.low_stock_threshold;
                const isOutOfStock = p.stock === 0;

                return (
                  <tr key={p.id} className="hover:bg-zinc-950/70 transition-colors group">
                    {/* Thumbnail */}
                    <td className="py-3 px-4 text-center">
                      <div className="w-10 h-10 border border-zinc-800 bg-zinc-900 overflow-hidden flex items-center justify-center mx-auto">
                        {primaryImg ? (
                          <img
                            src={primaryImg.public_url}
                            alt={primaryImg.alt_text || p.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <span className="text-[10px] font-mono text-zinc-600 font-bold">
                            {p.name.slice(0, 2).toUpperCase()}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Name, SKU, Brand */}
                    <td className="py-3 px-4">
                      <div className="font-sans font-bold text-white text-sm group-hover:text-zinc-200 transition-colors">
                        <Link href={`/admin/products/${p.id}`} className="hover:underline">
                          {p.name}
                        </Link>
                      </div>
                      <div className="flex items-center gap-2 text-[11px] text-zinc-400 mt-0.5 font-mono">
                        <span className="text-zinc-500">SKU:</span>
                        <span className="text-zinc-300 font-bold">{p.sku}</span>
                        {p.brand && (
                          <>
                            <span className="text-zinc-600">&middot;</span>
                            <span className="text-zinc-400">{p.brand}</span>
                          </>
                        )}
                      </div>
                    </td>

                    {/* Category */}
                    <td className="py-3 px-4 text-zinc-400">
                      <span className="px-2 py-0.5 bg-zinc-900 border border-zinc-800 text-[11px]">
                        {p.category_name || 'Sin categoría'}
                      </span>
                    </td>

                    {/* Price */}
                    <td className="py-3 px-4 text-right font-bold text-white">
                      {formatCurrency(p.price)}
                    </td>

                    {/* Stock */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[11px] font-bold ${
                          isOutOfStock
                            ? 'bg-red-950/80 text-red-400 border border-red-800'
                            : isLowStock
                            ? 'bg-amber-950/80 text-amber-400 border border-amber-800'
                            : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                        }`}
                      >
                        {p.stock} un.
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="py-3 px-4 text-center">
                      <span
                        className={`inline-block px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${
                          p.status === 'published'
                            ? 'bg-emerald-950/60 text-emerald-400 border border-emerald-800'
                            : p.status === 'draft'
                            ? 'bg-zinc-800 text-zinc-300 border border-zinc-700'
                            : 'bg-zinc-950 text-zinc-600 border border-zinc-800'
                        }`}
                      >
                        {p.status === 'published'
                          ? 'Publicado'
                          : p.status === 'draft'
                          ? 'Borrador'
                          : 'Archivado'}
                      </span>
                    </td>

                    {/* Flags */}
                    <td className="py-3 px-4 text-center">
                      <div className="flex items-center justify-center gap-1.5">
                        {p.is_featured && (
                          <span title="Producto Destacado" className="text-amber-400">
                            <Star size={14} weight="fill" />
                          </span>
                        )}
                        {p.is_new && (
                          <span title="Producto Nuevo" className="text-white">
                            <Sparkle size={14} weight="fill" />
                          </span>
                        )}
                        {!p.is_featured && !p.is_new && (
                          <span className="text-zinc-700 text-[10px]">-</span>
                        )}
                      </div>
                    </td>

                    {/* Actions */}
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        {/* Status Toggle */}
                        {p.status !== 'archived' && (
                          <button
                            type="button"
                            onClick={() => handleToggleStatus(p.id, p.status)}
                            disabled={isPending}
                            title={p.status === 'published' ? 'Pausar a Borrador' : 'Publicar'}
                            className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-colors"
                          >
                            {p.status === 'published' ? (
                              <EyeSlash size={14} />
                            ) : (
                              <Eye size={14} />
                            )}
                          </button>
                        )}

                        {/* Edit */}
                        <Link
                          href={`/admin/products/${p.id}`}
                          title="Editar Producto"
                          className="p-1.5 text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-600 transition-colors"
                        >
                          <PencilSimple size={14} />
                        </Link>

                        {/* Archive or Delete */}
                        {p.status !== 'archived' ? (
                          <button
                            type="button"
                            onClick={() => handleArchive(p.id, p.name)}
                            disabled={isPending}
                            title="Archivar"
                            className="p-1.5 text-zinc-400 hover:text-amber-400 border border-zinc-800 hover:border-amber-900 transition-colors"
                          >
                            <Archive size={14} />
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => handleDeletePermanent(p.id, p.name)}
                            disabled={isPending}
                            title="Eliminar Permanentemente"
                            className="p-1.5 text-zinc-400 hover:text-red-400 border border-zinc-800 hover:border-red-900 transition-colors"
                          >
                            <Trash size={14} />
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Summary Footer */}
      <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-1">
        <span>Mostrando {filteredProducts.length} de {products.length} productos</span>
        <span>KIIROX Admin &middot; Fase 6</span>
      </div>
    </div>
  );
}
