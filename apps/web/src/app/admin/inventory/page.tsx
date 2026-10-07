import React from 'react';
import { Metadata } from 'next';
import { getInventoryOverview, getInventoryMovements } from './actions';
import { getAdminCategories } from '../products/actions';
import { InventoryManager } from '../../../components/admin/inventory-manager';
import { Stack } from '@phosphor-icons/react/dist/ssr';

export const metadata: Metadata = {
  title: 'Inventario & Kardex | KIIROX Admin',
  description: 'Control de existencias, ajustes de stock y auditoría de movimientos de inventario.',
};

export const dynamic = 'force-dynamic';

export default async function InventoryPage() {
  const [overview, movementsRes, categories] = await Promise.all([
    getInventoryOverview(),
    getInventoryMovements({ page: 1, page_size: 25 }),
    getAdminCategories(),
  ]);

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-zinc-800 pb-5">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 bg-zinc-900 px-2 py-0.5 border border-zinc-800 flex items-center gap-1.5">
              <Stack size={12} weight="bold" /> Logística & Almacén
            </span>
          </div>
          <h1 className="text-2xl font-bold font-sans tracking-tight text-white uppercase">
            Inventario & Kardex
          </h1>
          <p className="text-xs font-mono text-zinc-400 mt-1">
            Supervisa el estado del stock, ejecuta ingresos, mermas o recuentos físicos y audita la trazabilidad completa.
          </p>
        </div>
      </div>

      {/* Main Inventory Manager Component */}
      <InventoryManager
        initialProducts={overview.products}
        initialStats={overview.stats}
        initialMovements={movementsRes.data}
        totalMovements={movementsRes.pagination.total}
        categories={categories}
      />
    </div>
  );
}
