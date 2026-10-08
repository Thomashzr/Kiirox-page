'use client';

import React, { useState, useTransition } from 'react';
import {
  Package,
  WarningOctagon,
  Warning,
  CheckCircle,
  MagnifyingGlass,
  ClockCounterClockwise,
  ArrowUpRight,
  ArrowDownRight,
  Scales,
  ArrowsClockwise,
  Stack,
} from '@phosphor-icons/react';
import { Category, InventoryMovementWithProduct, MovementType } from '../../types';
import {
  InventoryProductItem,
  InventoryStats,
  getInventoryOverview,
  getInventoryMovements,
} from '../../app/admin/inventory/actions';
import { StockAdjustModal } from './stock-adjust-modal';

interface InventoryManagerProps {
  initialProducts: InventoryProductItem[];
  initialStats: InventoryStats;
  initialMovements: InventoryMovementWithProduct[];
  totalMovements: number;
  categories: Category[];
}

export function InventoryManager({
  initialProducts,
  initialStats,
  initialMovements,
  totalMovements,
  categories,
}: InventoryManagerProps) {
  const [activeTab, setActiveTab] = useState<'control' | 'kardex'>('control');
  const [products, setProducts] = useState<InventoryProductItem[]>(initialProducts);
  const [stats, setStats] = useState<InventoryStats>(initialStats);
  const [movements, setMovements] = useState<InventoryMovementWithProduct[]>(initialMovements);
  const [movementsTotal, setMovementsTotal] = useState<number>(totalMovements);

  // Filters for Stock Control tab
  const [search, setSearch] = useState('');
  const [stockStatusFilter, setStockStatusFilter] = useState<
    'all' | 'low_stock' | 'out_of_stock' | 'optimal'
  >('all');
  const [categoryFilter, setCategoryFilter] = useState('all');

  // Filters for Kardex tab
  const [kardexProductFilter, setKardexProductFilter] = useState('all');
  const [kardexTypeFilter, setKardexTypeFilter] = useState('all');
  const [kardexPage, setKardexPage] = useState(1);

  // Modal State
  const [selectedProduct, setSelectedProduct] = useState<InventoryProductItem | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isPending, startTransition] = useTransition();

  // Refresh inventory products
  const refreshProducts = () => {
    startTransition(async () => {
      try {
        const res = await getInventoryOverview({
          search: search || undefined,
          stock_filter: stockStatusFilter,
          category_id: categoryFilter,
        });
        setProducts(res.products);
        setStats(res.stats);
      } catch (err) {
        console.error('Error refreshing products:', err);
      }
    });
  };

  // Refresh movements
  const refreshMovements = (page = kardexPage, prodId = kardexProductFilter, type = kardexTypeFilter) => {
    startTransition(async () => {
      try {
        const res = await getInventoryMovements({
          product_id: prodId,
          movement_type: type,
          page,
          page_size: 25,
        });
        setMovements(res.data);
        setMovementsTotal(res.pagination.total);
        setKardexPage(page);
      } catch (err) {
        console.error('Error refreshing movements:', err);
      }
    });
  };

  const handleAdjustSuccess = (newStock: number) => {
    if (selectedProduct) {
      setProducts((prev) =>
        prev.map((p) => {
          if (p.id === selectedProduct.id) {
            let stock_status: 'out_of_stock' | 'low_stock' | 'optimal' = 'optimal';
            if (newStock === 0) stock_status = 'out_of_stock';
            else if (newStock <= p.low_stock_threshold) stock_status = 'low_stock';
            return { ...p, stock: newStock, stock_status };
          }
          return p;
        })
      );
      // Refresh full overview and kardex
      refreshProducts();
      if (activeTab === 'kardex') {
        refreshMovements(1);
      }
    }
  };

  const openAdjustModal = (product: InventoryProductItem) => {
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const viewProductKardex = (productId: string) => {
    setKardexProductFilter(productId);
    setActiveTab('kardex');
    refreshMovements(1, productId, kardexTypeFilter);
  };

  // Format Movement Type Label
  const getMovementTypeBadge = (type: MovementType) => {
    switch (type) {
      case 'purchase':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-emerald-950/40 text-emerald-400 border border-emerald-800">
            <ArrowUpRight size={12} weight="bold" /> Compra / Entrada
          </span>
        );
      case 'initial_stock':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-zinc-900 text-zinc-300 border border-zinc-700">
            Stock Inicial
          </span>
        );
      case 'shrinkage':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-red-950/40 text-red-400 border border-red-800">
            <ArrowDownRight size={12} weight="bold" /> Merma / Baja
          </span>
        );
      case 'correction':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-blue-950/40 text-blue-400 border border-blue-800">
            <Scales size={12} weight="bold" /> Conteo Físico
          </span>
        );
      case 'manual_adjustment':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-zinc-800 text-zinc-200 border border-zinc-700">
            Ajuste Manual
          </span>
        );
      case 'sale':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-amber-950/40 text-amber-400 border border-amber-800">
            Venta
          </span>
        );
      case 'return':
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-purple-950/40 text-purple-400 border border-purple-800">
            Devolución
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-mono uppercase bg-zinc-900 text-zinc-400 border border-zinc-800">
            {type}
          </span>
        );
    }
  };

  const formatDate = (isoStr: string) => {
    try {
      const d = new Date(isoStr);
      return d.toLocaleString('es-AR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch {
      return isoStr;
    }
  };

  // Filtered products on client side for fast typing response
  const displayedProducts = products.filter((p) => {
    if (stockStatusFilter !== 'all' && p.stock_status !== stockStatusFilter) return false;
    if (categoryFilter !== 'all' && p.category_id !== categoryFilter) return false;
    if (search.trim()) {
      const q = search.toLowerCase();
      return (
        p.name.toLowerCase().includes(q) ||
        p.sku.toLowerCase().includes(q) ||
        (p.brand && p.brand.toLowerCase().includes(q))
      );
    }
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Top Inventory Stats Bar */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1">
            Total Catálogo
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{stats.totalSkus}</span>
            <span className="text-xs font-mono text-zinc-400">SKUs</span>
          </div>
        </div>

        <div className="bg-zinc-950 border border-zinc-800 p-4">
          <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 block mb-1">
            Unidades en Stock
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-white">{stats.totalUnits}</span>
            <span className="text-xs font-mono text-zinc-400">unidades</span>
          </div>
        </div>

        <div
          onClick={() => {
            setStockStatusFilter('low_stock');
            setActiveTab('control');
          }}
          className={`bg-zinc-950 border p-4 cursor-pointer transition-colors ${
            stockStatusFilter === 'low_stock'
              ? 'border-amber-500 bg-amber-950/10'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-amber-400 block mb-1 flex items-center gap-1.5">
            <Warning size={12} weight="bold" /> Stock Crítico
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-amber-300">
              {stats.lowStockCount}
            </span>
            <span className="text-xs font-mono text-zinc-400">bajo umbral</span>
          </div>
        </div>

        <div
          onClick={() => {
            setStockStatusFilter('out_of_stock');
            setActiveTab('control');
          }}
          className={`bg-zinc-950 border p-4 cursor-pointer transition-colors ${
            stockStatusFilter === 'out_of_stock'
              ? 'border-red-500 bg-red-950/10'
              : 'border-zinc-800 hover:border-zinc-700'
          }`}
        >
          <span className="text-[10px] font-mono uppercase tracking-widest text-red-400 block mb-1 flex items-center gap-1.5">
            <WarningOctagon size={12} weight="bold" /> Sin Stock
          </span>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-mono font-bold text-red-400">
              {stats.outOfStockCount}
            </span>
            <span className="text-xs font-mono text-zinc-400">quiebres</span>
          </div>
        </div>
      </div>

      {/* Main Tabs Navigation */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
        <div className="flex gap-2">
          <button
            onClick={() => setActiveTab('control')}
            className={`px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors flex items-center gap-2 ${
              activeTab === 'control'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            <Stack size={14} weight="bold" />
            <span>Control de Stock y Alertas</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 font-normal">
              {displayedProducts.length}
            </span>
          </button>

          <button
            onClick={() => {
              setActiveTab('kardex');
              if (movements.length === 0) refreshMovements(1);
            }}
            className={`px-4 py-2 text-xs font-mono uppercase font-bold tracking-wider transition-colors flex items-center gap-2 ${
              activeTab === 'kardex'
                ? 'bg-white text-black'
                : 'text-zinc-400 hover:text-white bg-zinc-900 border border-zinc-800'
            }`}
          >
            <ClockCounterClockwise size={14} weight="bold" />
            <span>Kardex / Auditoría de Movimientos</span>
            <span className="ml-1 text-[10px] px-1.5 py-0.2 bg-zinc-800 text-zinc-300 font-normal">
              {movementsTotal}
            </span>
          </button>
        </div>

        <button
          onClick={() => {
            if (activeTab === 'control') refreshProducts();
            else refreshMovements();
          }}
          disabled={isPending}
          className="px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900 flex items-center gap-1.5 transition-colors"
          title="Actualizar datos"
        >
          <ArrowsClockwise
            size={14}
            weight="bold"
            className={isPending ? 'animate-spin text-white' : ''}
          />
          <span className="hidden sm:inline">Refrescar</span>
        </button>
      </div>

      {/* TAB 1: CONTROL DE STOCK */}
      {activeTab === 'control' && (
        <div className="space-y-4">
          {/* Filters Bar */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            {/* Search */}
            <div className="relative flex-1">
              <MagnifyingGlass
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500"
              />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Buscar por SKU, Nombre o Marca..."
                className="w-full bg-black border border-zinc-800 pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-zinc-500 focus:outline-none focus:border-white transition-colors"
              />
            </div>

            {/* Quick stock status pill filter */}
            <div className="flex items-center gap-2 flex-wrap">
              <button
                type="button"
                onClick={() => setStockStatusFilter('all')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                  stockStatusFilter === 'all'
                    ? 'bg-zinc-200 text-black border-white font-bold'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Todos
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('low_stock')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                  stockStatusFilter === 'low_stock'
                    ? 'bg-amber-400 text-black border-amber-300 font-bold'
                    : 'bg-black text-amber-400/80 border-zinc-800 hover:border-amber-700/60'
                }`}
              >
                Bajo Stock ({stats.lowStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('out_of_stock')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                  stockStatusFilter === 'out_of_stock'
                    ? 'bg-red-500 text-white border-red-400 font-bold'
                    : 'bg-black text-red-400/80 border-zinc-800 hover:border-red-700/60'
                }`}
              >
                Sin Stock ({stats.outOfStockCount})
              </button>
              <button
                type="button"
                onClick={() => setStockStatusFilter('optimal')}
                className={`px-3 py-1.5 text-xs font-mono uppercase tracking-wider border transition-colors ${
                  stockStatusFilter === 'optimal'
                    ? 'bg-zinc-200 text-black border-white font-bold'
                    : 'bg-black text-zinc-400 border-zinc-800 hover:text-white'
                }`}
              >
                Óptimo
              </button>
            </div>

            {/* Category Filter */}
            <div className="w-full md:w-48">
              <select
                value={categoryFilter}
                onChange={(e) => setCategoryFilter(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white transition-colors"
              >
                <option value="all">Todas las categorías</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {/* Stock Table */}
          <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4 w-12 text-center">Img</th>
                    <th className="py-3 px-4">SKU / Producto</th>
                    <th className="py-3 px-4 hidden md:table-cell">Categoría</th>
                    <th className="py-3 px-4 text-center">Estado</th>
                    <th className="py-3 px-4 text-right">Umbral Mín.</th>
                    <th className="py-3 px-4 text-right">Stock Actual</th>
                    <th className="py-3 px-4 text-right w-44">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono text-xs">
                  {displayedProducts.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-12 text-center text-zinc-500 font-mono">
                        No se encontraron productos que coincidan con los filtros de inventario.
                      </td>
                    </tr>
                  ) : (
                    displayedProducts.map((p) => {
                      return (
                        <tr
                          key={p.id}
                          className="hover:bg-zinc-900/40 transition-colors group"
                        >
                          {/* Image */}
                          <td className="py-3 px-4 text-center">
                            <div className="w-9 h-9 bg-zinc-900 border border-zinc-800 flex items-center justify-center overflow-hidden mx-auto">
                              {p.image_url ? (
                                <img
                                  src={p.image_url}
                                  alt={p.name}
                                  className="w-full h-full object-cover"
                                />
                              ) : (
                                <Package size={16} className="text-zinc-600" />
                              )}
                            </div>
                          </td>

                          {/* SKU & Name */}
                          <td className="py-3 px-4">
                            <span className="text-[11px] text-zinc-400 tracking-wider block">
                              {p.sku} {p.brand ? `• ${p.brand}` : ''}
                            </span>
                            <span className="font-bold text-white uppercase tracking-tight block">
                              {p.name}
                            </span>
                          </td>

                          {/* Category */}
                          <td className="py-3 px-4 text-zinc-400 hidden md:table-cell">
                            {p.category_name || '-'}
                          </td>

                          {/* Stock Status Badge */}
                          <td className="py-3 px-4 text-center">
                            {p.stock_status === 'out_of_stock' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-red-950/60 text-red-400 border border-red-800">
                                <WarningOctagon size={12} weight="bold" /> Sin Stock
                              </span>
                            )}
                            {p.stock_status === 'low_stock' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider bg-amber-950/50 text-amber-300 border border-amber-800">
                                <Warning size={12} weight="bold" /> Bajo Stock
                              </span>
                            )}
                            {p.stock_status === 'optimal' && (
                              <span className="inline-flex items-center gap-1 px-2 py-0.5 text-[10px] uppercase tracking-wider bg-zinc-900 text-zinc-400 border border-zinc-800">
                                <CheckCircle size={12} weight="bold" className="text-emerald-500" /> Óptimo
                              </span>
                            )}
                          </td>

                          {/* Threshold */}
                          <td className="py-3 px-4 text-right text-zinc-400">
                            {p.low_stock_threshold} u.
                          </td>

                          {/* Current Stock */}
                          <td className="py-3 px-4 text-right">
                            <span
                              className={`text-base font-bold ${
                                p.stock === 0
                                  ? 'text-red-400 font-extrabold'
                                  : p.stock <= p.low_stock_threshold
                                  ? 'text-amber-300 font-bold'
                                  : 'text-white'
                              }`}
                            >
                              {p.stock}
                            </span>
                            <span className="text-[11px] text-zinc-500 ml-1">u.</span>
                          </td>

                          {/* Actions */}
                          <td className="py-3 px-4 text-right space-x-2">
                            <button
                              type="button"
                              onClick={() => openAdjustModal(p)}
                              className="px-2.5 py-1 text-xs font-mono uppercase font-bold tracking-wider bg-white text-black hover:bg-zinc-200 transition-colors inline-flex items-center gap-1"
                              title="Ajustar stock"
                            >
                              <span>Ajustar</span>
                            </button>

                            <button
                              type="button"
                              onClick={() => viewProductKardex(p.id)}
                              className="px-2 py-1 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 bg-zinc-900 transition-colors inline-flex items-center gap-1"
                              title="Ver historial de movimientos"
                            >
                              <ClockCounterClockwise size={13} weight="bold" />
                            </button>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: KARDEX / AUDITORÍA */}
      {activeTab === 'kardex' && (
        <div className="space-y-4">
          {/* Kardex Filters Bar */}
          <div className="bg-zinc-950 border border-zinc-800 p-4 flex flex-col md:flex-row gap-3 items-stretch md:items-center justify-between">
            <div className="flex flex-col md:flex-row gap-3 flex-1">
              {/* Product selector filter */}
              <div className="w-full md:w-72">
                <select
                  value={kardexProductFilter}
                  onChange={(e) => {
                    setKardexProductFilter(e.target.value);
                    refreshMovements(1, e.target.value, kardexTypeFilter);
                  }}
                  className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white transition-colors"
                >
                  <option value="all">Todos los productos</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      [{p.sku}] {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Movement Type filter */}
              <div className="w-full md:w-56">
                <select
                  value={kardexTypeFilter}
                  onChange={(e) => {
                    setKardexTypeFilter(e.target.value);
                    refreshMovements(1, kardexProductFilter, e.target.value);
                  }}
                  className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white transition-colors"
                >
                  <option value="all">Todos los tipos de movimiento</option>
                  <option value="purchase">Compras / Entradas</option>
                  <option value="shrinkage">Mermas / Bajas</option>
                  <option value="correction">Conteos Físicos</option>
                  <option value="manual_adjustment">Ajustes Manuales</option>
                  <option value="sale">Ventas</option>
                  <option value="return">Devoluciones</option>
                  <option value="initial_stock">Stock Inicial</option>
                </select>
              </div>
            </div>

            {kardexProductFilter !== 'all' && (
              <button
                type="button"
                onClick={() => {
                  setKardexProductFilter('all');
                  refreshMovements(1, 'all', kardexTypeFilter);
                }}
                className="px-3 py-1.5 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900 transition-colors"
              >
                Limpiar filtro de producto
              </button>
            )}
          </div>

          {/* Movements Audit Table */}
          <div className="border border-zinc-800 bg-zinc-950 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-zinc-800 bg-zinc-900/50 text-[11px] font-mono uppercase tracking-wider text-zinc-400">
                    <th className="py-3 px-4">Fecha y Hora</th>
                    <th className="py-3 px-4">Producto</th>
                    <th className="py-3 px-4">Tipo Movimiento</th>
                    <th className="py-3 px-4 text-right">Variación</th>
                    <th className="py-3 px-4">Motivo / Justificación</th>
                    <th className="py-3 px-4 text-right">Operador</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-900 font-mono text-xs">
                  {movements.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono">
                        No se registran movimientos para los filtros seleccionados.
                      </td>
                    </tr>
                  ) : (
                    movements.map((m) => (
                      <tr key={m.id} className="hover:bg-zinc-900/40 transition-colors">
                        {/* Timestamp */}
                        <td className="py-3 px-4 text-zinc-400 whitespace-nowrap">
                          {formatDate(m.created_at)}
                        </td>

                        {/* Product */}
                        <td className="py-3 px-4">
                          <span className="text-[11px] text-zinc-400 tracking-wider block">
                            SKU: {m.product_sku}
                          </span>
                          <span className="font-bold text-white uppercase tracking-tight block">
                            {m.product_name}
                          </span>
                        </td>

                        {/* Movement Type */}
                        <td className="py-3 px-4 whitespace-nowrap">
                          {getMovementTypeBadge(m.movement_type)}
                        </td>

                        {/* Delta */}
                        <td className="py-3 px-4 text-right whitespace-nowrap">
                          <span
                            className={`text-sm font-bold ${
                              m.delta > 0
                                ? 'text-emerald-400'
                                : m.delta < 0
                                ? 'text-amber-400'
                                : 'text-zinc-400'
                            }`}
                          >
                            {m.delta > 0 ? `+${m.delta}` : m.delta} u.
                          </span>
                        </td>

                        {/* Reason */}
                        <td className="py-3 px-4 text-zinc-300 max-w-xs break-words">
                          {m.reason || <span className="text-zinc-600 italic">Sin motivo especificado</span>}
                        </td>

                        {/* Operator */}
                        <td className="py-3 px-4 text-right text-zinc-400 text-[11px] whitespace-nowrap">
                          {m.admin_email || 'Admin'}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {/* Pagination footer */}
            <div className="p-4 border-t border-zinc-800 flex items-center justify-between text-xs font-mono">
              <span className="text-zinc-500">
                Total movimientos registrados: <strong className="text-white">{movementsTotal}</strong>
              </span>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  disabled={kardexPage <= 1 || isPending}
                  onClick={() => refreshMovements(kardexPage - 1)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Anterior
                </button>
                <span className="px-2 text-zinc-400">Página {kardexPage}</span>
                <button
                  type="button"
                  disabled={movements.length < 25 || isPending}
                  onClick={() => refreshMovements(kardexPage + 1)}
                  className="px-3 py-1.5 text-zinc-400 hover:text-white border border-zinc-800 bg-zinc-900 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                >
                  Siguiente
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Stock Adjustment Modal */}
      <StockAdjustModal
        product={selectedProduct}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleAdjustSuccess}
      />
    </div>
  );
}
