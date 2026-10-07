import React from 'react';
import { verifyAdminAccess } from '../../lib/admin-auth';
import { getStoreData } from '../../lib/data';
import { formatCurrency } from '../../lib/cart-utils';
import {
  Package,
  WarningCircle,
  CheckCircle,
  Stack,
  Pulse,
  Database,
  ShieldCheck,
  ArrowSquareOut,
} from '@phosphor-icons/react/dist/ssr';

export default async function AdminDashboardPage() {

  const authResult = await verifyAdminAccess();
  const { categories, products } = await getStoreData();

  const totalProducts = products.length;
  const inStockCount = products.filter((p) => p.stock > 0).length;
  const lowStockCount = products.filter(
    (p) => p.stock > 0 && p.stock <= p.low_stock_threshold
  ).length;
  const outOfStockCount = products.filter((p) => p.stock === 0).length;

  const adminEmail = authResult.authorized ? authResult.admin.email : 'admin';
  const adminRole = authResult.authorized ? authResult.admin.role : 'admin';

  return (
    <div className="space-y-8 max-w-7xl">
      {/* Header Banner */}
      <div className="border border-zinc-800 bg-black p-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-wider px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 font-bold">
              {adminRole === 'super_admin' ? 'SUPER ADMINISTRADOR' : 'ADMINISTRADOR'}
            </span>
            <span className="text-xs font-mono text-zinc-500">
              ID: {authResult.authorized ? authResult.admin.id.slice(0, 8) : ''}...
            </span>
          </div>
          <h2 className="text-2xl font-bold uppercase tracking-tight font-sans text-white">
            Resumen General &middot; KIIROX
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Sesión activa para <span className="text-white font-bold">{adminEmail}</span>
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 transition-colors"
          >
            <span>Ver Tienda</span>
            <ArrowSquareOut size={14} weight="bold" />
          </a>
        </div>
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Products */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Productos</span>
            <Package size={20} weight="bold" />
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-1">
            {totalProducts}
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            {inStockCount} con disponibilidad inmediata
          </div>
        </div>

        {/* Low Stock Warning */}
        <a
          href="/admin/inventory"
          className="border border-zinc-800 bg-zinc-950 p-5 hover:border-amber-600/70 transition-colors block group"
        >
          <div className="flex items-center justify-between text-amber-500 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider group-hover:text-amber-400">
              Bajo Stock
            </span>
            <WarningCircle size={20} weight="bold" />
          </div>
          <div className="text-3xl font-mono font-bold text-amber-400 mb-1">
            {lowStockCount}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
            Requieren reposición &rarr;
          </div>
        </a>

        {/* Out of Stock */}
        <a
          href="/admin/inventory"
          className="border border-zinc-800 bg-zinc-950 p-5 hover:border-red-600/70 transition-colors block group"
        >
          <div className="flex items-center justify-between text-red-500 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider group-hover:text-red-400">
              Agotados
            </span>
            <Stack size={20} weight="bold" />
          </div>
          <div className="text-3xl font-mono font-bold text-red-400 mb-1">
            {outOfStockCount}
          </div>
          <div className="text-[11px] font-mono text-zinc-500 group-hover:text-zinc-400">
            Ajustar en inventario &rarr;
          </div>
        </a>

        {/* Categories */}
        <div className="border border-zinc-800 bg-zinc-950 p-5">
          <div className="flex items-center justify-between text-zinc-400 mb-3">
            <span className="text-xs font-mono uppercase tracking-wider">Categorías</span>
            <Database size={20} weight="bold" />
          </div>
          <div className="text-3xl font-mono font-bold text-white mb-1">
            {categories.length}
          </div>
          <div className="text-[11px] font-mono text-zinc-500">
            Categorías activas en catálogo
          </div>
        </div>
      </div>

      {/* Cloud Infrastructure Status */}
      <div className="border border-zinc-800 bg-black p-6">
        <h3 className="text-xs font-mono uppercase tracking-wider font-bold text-zinc-400 mb-4 flex items-center gap-2">
          <Pulse size={16} weight="bold" className="text-emerald-500" />
          <span>Estado de Infraestructura Cloud</span>
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs font-mono">
          <div className="p-3 border border-zinc-900 bg-zinc-950">
            <div className="text-zinc-500 uppercase text-[10px] mb-1">Base de Datos</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <CheckCircle size={14} weight="bold" className="text-emerald-500" />
              <span>Neon PostgreSQL</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">São Paulo (sa-east-1)</div>
          </div>

          <div className="p-3 border border-zinc-900 bg-zinc-950">
            <div className="text-zinc-500 uppercase text-[10px] mb-1">Backend BEAM API</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <CheckCircle size={14} weight="bold" className="text-emerald-500" />
              <span>Fly.io (Gleam OTP)</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">https://kiirox-api.fly.dev</div>
          </div>

          <div className="p-3 border border-zinc-900 bg-zinc-950">
            <div className="text-zinc-500 uppercase text-[10px] mb-1">Motor de Autenticación</div>
            <div className="text-white font-bold flex items-center gap-1.5">
              <CheckCircle size={14} weight="bold" className="text-emerald-500" />
              <span>Clerk Auth Engine</span>
            </div>
            <div className="text-[10px] text-zinc-500 mt-1">Protección /admin por JWT y Roles</div>
          </div>
        </div>
      </div>

      {/* Products Table Overview */}
      <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
        <div className="px-6 py-4 border-b border-zinc-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-mono uppercase tracking-wider font-bold text-white">
              Catálogo de Productos
            </h3>
            <p className="text-xs text-zinc-500 font-mono">
              Inventario en tiempo real sincronizado con base de datos
            </p>
          </div>

          <div className="flex items-center gap-2">
            <a
              href="/admin/products/new"
              className="px-3 py-1.5 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 transition-colors"
            >
              + Nuevo Producto
            </a>
            <a
              href="/admin/inventory"
              className="px-3 py-1.5 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono uppercase tracking-wider hover:border-zinc-500 transition-colors"
            >
              Kardex & Stock &rarr;
            </a>
            <a
              href="/admin/products"
              className="px-3 py-1.5 border border-zinc-700 text-zinc-300 hover:text-white text-xs font-mono uppercase tracking-wider hover:border-zinc-500 transition-colors"
            >
              Gestionar Catálogo &rarr;
            </a>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black border-b border-zinc-800 text-zinc-500 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="py-3 px-6">SKU / Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Stock</th>
                <th className="py-3 px-4">Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-900">
              {products.map((p) => (
                <tr key={p.id} className="hover:bg-zinc-900/50 transition-colors">
                  <td className="py-3 px-6">
                    <div className="font-bold text-white uppercase">{p.name}</div>
                    <div className="text-[10px] text-zinc-500 font-mono">SKU: {p.sku}</div>
                  </td>
                  <td className="py-3 px-4 text-zinc-400">{p.category_name}</td>
                  <td className="py-3 px-4 font-bold text-white">
                    {formatCurrency(p.price, p.currency)}
                  </td>
                  <td className="py-3 px-4">
                    <span
                      className={`inline-flex px-2 py-0.5 text-[10px] font-bold ${
                        p.stock === 0
                          ? 'bg-red-950/60 text-red-400 border border-red-800'
                          : p.stock <= p.low_stock_threshold
                          ? 'bg-amber-950/60 text-amber-400 border border-amber-800'
                          : 'bg-zinc-900 text-zinc-300 border border-zinc-800'
                      }`}
                    >
                      {p.stock} un.
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <span className="inline-flex px-2 py-0.5 text-[10px] uppercase font-bold bg-emerald-950/40 text-emerald-400 border border-emerald-800">
                      {p.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
