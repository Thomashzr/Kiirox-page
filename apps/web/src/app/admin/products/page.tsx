import React from 'react';
import Link from 'next/link';
import { Plus, Package, WarningOctagon, Stack, CheckCircle } from '@phosphor-icons/react/dist/ssr';
import { getAdminProducts, getAdminCategories } from './actions';
import { ProductsTable } from '../../../components/admin/products-table';

export const dynamic = 'force-dynamic';

export default async function AdminProductsPage() {
  const [products, categories] = await Promise.all([
    getAdminProducts(),
    getAdminCategories(),
  ]);

  const total = products.length;
  const published = products.filter((p) => p.status === 'published').length;
  const drafts = products.filter((p) => p.status === 'draft').length;
  const lowStock = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
  ).length;

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-zinc-900 border border-zinc-700 text-zinc-300">
              Gestión de Catálogo
            </span>
          </div>
          <h1 className="text-2xl font-bold uppercase tracking-tight font-sans text-white">
            Productos KIIROX
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Administra precios, stock, visibilidad e imágenes sincronizadas con Cloudinary y Neon.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/admin/products/new"
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 transition-colors shadow-sm"
          >
            <Plus size={16} weight="bold" />
            <span>Crear Producto</span>
          </Link>
        </div>
      </div>

      {/* Mini Stats Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <p className="text-[11px] font-mono text-zinc-500 uppercase">Total Productos</p>
          <p className="text-2xl font-mono font-bold text-white mt-1">{total}</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <p className="text-[11px] font-mono text-zinc-500 uppercase">Publicados Activos</p>
          <p className="text-2xl font-mono font-bold text-emerald-400 mt-1">{published}</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <p className="text-[11px] font-mono text-zinc-500 uppercase">En Borrador</p>
          <p className="text-2xl font-mono font-bold text-zinc-300 mt-1">{drafts}</p>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <p className="text-[11px] font-mono text-zinc-500 uppercase">Alerta Bajo Stock</p>
          <p className="text-2xl font-mono font-bold text-amber-400 mt-1">{lowStock}</p>
        </div>
      </div>

      {/* Main Table */}
      <ProductsTable initialProducts={products} categories={categories} />
    </div>
  );
}
