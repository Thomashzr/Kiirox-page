'use client';

import React from 'react';
import { useCart } from '../context/cart-context';
import { Check, WarningCircle, Info, X, ShoppingBag } from '@phosphor-icons/react';

export function CartToast() {
  const { toast, dismissToast, openDrawer } = useCart();

  if (!toast) return null;

  const getIcon = () => {
    switch (toast.type) {
      case 'warning':
        return <WarningCircle size={18} weight="bold" className="text-amber-500" />;
      case 'info':
        return <Info size={18} weight="bold" className="text-zinc-400" />;
      case 'success':
      default:
        return <Check size={18} weight="bold" className="text-emerald-500" />;
    }
  };

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 right-6 z-50 max-w-sm w-full animate-in fade-in slide-in-from-bottom-5 duration-200"
    >
      <div className="bg-black text-white dark:bg-white dark:text-black border border-zinc-800 dark:border-zinc-200 p-4 shadow-2xl flex items-start gap-3">
        <div className="pt-0.5 shrink-0">{getIcon()}</div>

        <div className="flex-1 min-w-0">
          <p className="text-xs font-mono uppercase tracking-wider font-bold">
            {toast.title}
          </p>
          {toast.productName && (
            <p className="text-xs text-zinc-400 dark:text-zinc-600 truncate mt-0.5 font-sans">
              {toast.productName}
            </p>
          )}

          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={() => {
                dismissToast();
                openDrawer();
              }}
              className="inline-flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider px-2.5 py-1 bg-white text-black dark:bg-black dark:text-white font-bold hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
            >
              <ShoppingBag size={13} weight="bold" />
              <span>Ver carrito</span>
            </button>
          </div>
        </div>

        <button
          onClick={dismissToast}
          className="text-zinc-400 hover:text-white dark:text-zinc-600 dark:hover:text-black p-1 transition-colors"
          aria-label="Cerrar notificación"
        >
          <X size={15} weight="bold" />
        </button>
      </div>
    </div>
  );
}
