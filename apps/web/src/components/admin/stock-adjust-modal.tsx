'use client';

import React, { useState, useEffect, useTransition } from 'react';
import {
  X,
  ArrowUpRight,
  ArrowDownRight,
  Scales,
  WarningCircle,
  CheckCircle,
  Package,
} from '@phosphor-icons/react';
import { MovementType } from '../../types';
import { recordStockAdjustmentAction } from '../../app/admin/inventory/actions';

interface StockAdjustProduct {
  id: string;
  name: string;
  sku: string;
  stock: number;
  low_stock_threshold: number;
  image_url?: string | null;
}

interface StockAdjustModalProps {
  product: StockAdjustProduct | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (newStock: number) => void;
}

type Mode = 'inbound' | 'outbound' | 'physical_count';

export function StockAdjustModal({
  product,
  isOpen,
  onClose,
  onSuccess,
}: StockAdjustModalProps) {
  const [mode, setMode] = useState<Mode>('inbound');
  const [quantity, setQuantity] = useState<number>(1);
  const [countedStock, setCountedStock] = useState<number>(0);
  const [reason, setReason] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  useEffect(() => {
    if (product) {
      setQuantity(1);
      setCountedStock(product.stock);
      setReason('');
      setError(null);
      setMode('inbound');
    }
  }, [product, isOpen]);

  if (!isOpen || !product) return null;

  // Calculate delta based on mode
  let calculatedDelta = 0;
  let movementType: MovementType = 'manual_adjustment';

  if (mode === 'inbound') {
    calculatedDelta = Math.max(0, quantity);
    movementType = 'purchase';
  } else if (mode === 'outbound') {
    calculatedDelta = -Math.max(0, quantity);
    movementType = 'shrinkage';
  } else if (mode === 'physical_count') {
    calculatedDelta = countedStock - product.stock;
    movementType = 'correction';
  }

  const projectedStock = product.stock + calculatedDelta;
  const isNegative = projectedStock < 0;

  const quickReasons = {
    inbound: [
      'Recepción de mercadería / Lote nuevo',
      'Devolución de cliente',
      'Ingreso por ajuste de inventario',
    ],
    outbound: [
      'Merma / Deterioro / Rotura',
      'Vencimiento de lote',
      'Venta en mostrador / offline',
      'Muestra comercial / degustación',
    ],
    physical_count: [
      'Auditoría y conteo físico periódico',
      'Ajuste por balance de fin de mes',
      'Corrección tras recuento de estantería',
    ],
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (calculatedDelta === 0) {
      setError('La variación de stock calculada es 0. Modifica las unidades o el conteo.');
      return;
    }

    if (isNegative) {
      setError(
        `Operación rechazada: El stock resultante (${projectedStock}) no puede ser negativo.`
      );
      return;
    }

    if (!reason.trim()) {
      setError('Debes especificar un motivo o justificación para este movimiento.');
      return;
    }

    startTransition(async () => {
      try {
        const result = await recordStockAdjustmentAction({
          product_id: product.id,
          delta: calculatedDelta,
          movement_type: movementType,
          reason: reason.trim(),
        });

        if (result.success) {
          onSuccess(result.new_stock);
          onClose();
        }
      } catch (err: any) {
        setError(err.message || 'Error al registrar el movimiento de stock');
      }
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-lg bg-zinc-950 border border-zinc-800 shadow-2xl text-white flex flex-col max-h-[92vh] overflow-hidden"
        role="dialog"
        aria-modal="true"
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/60">
          <div>
            <span className="text-[10px] font-mono uppercase tracking-widest text-zinc-400">
              Control de Inventario
            </span>
            <h2 className="text-base font-bold font-sans tracking-tight text-white uppercase">
              Ajuste de Stock
            </h2>
          </div>
          <button
            onClick={onClose}
            type="button"
            className="p-1.5 text-zinc-400 hover:text-white hover:bg-zinc-800 rounded transition-colors"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Product summary card */}
        <div className="px-6 py-4 bg-zinc-900/30 border-b border-zinc-800/80 flex items-center gap-4">
          <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 shrink-0 flex items-center justify-center overflow-hidden">
            {product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <Package size={22} className="text-zinc-600" />
            )}
          </div>
          <div className="flex-1 min-w-0">
            <span className="font-mono text-[11px] text-zinc-400 block tracking-wider">
              SKU: {product.sku}
            </span>
            <h3 className="text-sm font-bold truncate text-white uppercase tracking-tight">
              {product.name}
            </h3>
          </div>
          <div className="text-right shrink-0">
            <span className="text-[10px] font-mono text-zinc-400 uppercase block">
              Stock Actual
            </span>
            <span className="text-lg font-mono font-bold text-white">
              {product.stock} <span className="text-xs text-zinc-400 font-normal">u.</span>
            </span>
          </div>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-5 overflow-y-auto flex-1">
          {error && (
            <div className="p-3 bg-red-950/40 border border-red-800 text-red-300 text-xs font-mono flex items-start gap-2.5">
              <WarningCircle size={16} weight="bold" className="shrink-0 mt-0.5 text-red-400" />
              <span>{error}</span>
            </div>
          )}

          {/* Mode Selector Tabs */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-2">
              Tipo de Operación
            </label>
            <div className="grid grid-cols-3 gap-1 bg-zinc-900 p-1 border border-zinc-800">
              <button
                type="button"
                onClick={() => setMode('inbound')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                  mode === 'inbound'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowUpRight size={14} weight="bold" />
                <span>Entrada (+)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('outbound')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                  mode === 'outbound'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <ArrowDownRight size={14} weight="bold" />
                <span>Salida (-)</span>
              </button>

              <button
                type="button"
                onClick={() => setMode('physical_count')}
                className={`flex items-center justify-center gap-1.5 py-2 text-xs font-mono font-bold uppercase tracking-wider transition-colors ${
                  mode === 'physical_count'
                    ? 'bg-white text-black shadow-sm'
                    : 'text-zinc-400 hover:text-white'
                }`}
              >
                <Scales size={14} weight="bold" />
                <span>Conteo Físico</span>
              </button>
            </div>
          </div>

          {/* Quantity or Counted Stock input */}
          {mode === 'physical_count' ? (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                Stock Real Contado en Estantería
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="0"
                  step="1"
                  required
                  value={countedStock}
                  onChange={(e) => setCountedStock(parseInt(e.target.value) || 0)}
                  className="w-full bg-black border border-zinc-700 px-3 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-white transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-zinc-400">
                  unidades
                </span>
              </div>
              <p className="text-[11px] font-mono text-zinc-500 mt-1">
                El sistema calculará automáticamente la diferencia con el stock actual ({product.stock}).
              </p>
            </div>
          ) : (
            <div>
              <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
                {mode === 'inbound' ? 'Cantidad a Ingresar' : 'Cantidad a Descontar'}
              </label>
              <div className="relative">
                <input
                  type="number"
                  min="1"
                  max={mode === 'outbound' ? product.stock : 999999}
                  step="1"
                  required
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                  className="w-full bg-black border border-zinc-700 px-3 py-2.5 text-base font-mono font-bold text-white focus:outline-none focus:border-white transition-colors"
                />
                <span className="absolute right-3 top-2.5 text-xs font-mono text-zinc-400">
                  unidades
                </span>
              </div>
            </div>
          )}

          {/* Live Preview Box */}
          <div className="bg-zinc-900 border border-zinc-800 p-3.5 space-y-2">
            <div className="text-[10px] font-mono uppercase tracking-widest text-zinc-400 flex items-center justify-between">
              <span>Previsualización del Balance</span>
              <span className="text-zinc-500">Kardex Check</span>
            </div>
            <div className="grid grid-cols-3 gap-2 text-center pt-1 font-mono">
              <div className="bg-zinc-950 p-2 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">Stock Actual</span>
                <span className="text-sm font-bold text-white">{product.stock}</span>
              </div>
              <div className="bg-zinc-950 p-2 border border-zinc-800">
                <span className="text-[10px] text-zinc-400 block uppercase">Variación</span>
                <span
                  className={`text-sm font-bold ${
                    calculatedDelta > 0
                      ? 'text-emerald-400'
                      : calculatedDelta < 0
                      ? 'text-amber-400'
                      : 'text-zinc-400'
                  }`}
                >
                  {calculatedDelta > 0 ? `+${calculatedDelta}` : calculatedDelta}
                </span>
              </div>
              <div
                className={`p-2 border ${
                  isNegative
                    ? 'bg-red-950/40 border-red-800 text-red-400'
                    : 'bg-zinc-950 border-zinc-800 text-white'
                }`}
              >
                <span className="text-[10px] text-zinc-400 block uppercase">Stock Final</span>
                <span className="text-sm font-bold">{projectedStock}</span>
              </div>
            </div>
          </div>

          {/* Quick Reasons Chips */}
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-zinc-400 mb-1.5">
              Motivo / Justificación *
            </label>
            <div className="flex flex-wrap gap-1.5 mb-2">
              {quickReasons[mode].map((qr) => (
                <button
                  key={qr}
                  type="button"
                  onClick={() => setReason(qr)}
                  className={`text-[10px] font-mono px-2 py-1 border transition-colors text-left ${
                    reason === qr
                      ? 'bg-zinc-200 text-black border-white'
                      : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-white hover:border-zinc-700'
                  }`}
                >
                  {qr}
                </button>
              ))}
            </div>
            <textarea
              rows={2}
              required
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="Escribe el motivo detallado o selecciona uno rápido arriba..."
              className="w-full bg-black border border-zinc-700 p-2.5 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white transition-colors"
            />
          </div>

          {/* Actions Footer */}
          <div className="pt-2 flex items-center justify-end gap-3 border-t border-zinc-800">
            <button
              type="button"
              disabled={isPending}
              onClick={onClose}
              className="px-4 py-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isPending || isNegative || calculatedDelta === 0}
              className="px-5 py-2 text-xs font-mono uppercase tracking-wider font-bold bg-white text-black hover:bg-zinc-200 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {isPending ? (
                <>
                  <div className="w-3.5 h-3.5 border-2 border-black border-t-transparent rounded-full animate-spin" />
                  <span>Guardando...</span>
                </>
              ) : (
                <>
                  <CheckCircle size={14} weight="bold" />
                  <span>Confirmar Ajuste</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
