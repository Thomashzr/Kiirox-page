'use client';

import React, { useEffect, useState } from 'react';
import { useCart } from '../context/cart-context';
import { formatCurrency, generateWhatsAppUrl, generateOrderText, downloadOrderTxt } from '../lib/cart-utils';
import {
  X,
  Trash,
  Plus,
  Minus,
  WhatsappLogo,
  Copy,
  DownloadSimple,
  Check,
  ShoppingBag,
  ArrowRight,
} from '@phosphor-icons/react';

interface CartDrawerProps {
  whatsappNumber?: string;
  storeName?: string;
}

export function CartDrawer({
  whatsappNumber = '+5491100000000',
  storeName = 'KIIROX',
}: CartDrawerProps) {
  const {
    items,
    totalItems,
    formattedTotalPrice,
    isDrawerOpen,
    closeDrawer,
    updateQuantity,
    removeItem,
    clearCart,
  } = useCart();

  const [copied, setCopied] = useState(false);

  // Keyboard navigation & body scroll lock
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') closeDrawer();
    };

    if (isDrawerOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }

    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isDrawerOpen, closeDrawer]);

  const handleCopy = async () => {
    if (items.length === 0) return;
    const text = generateOrderText(items, storeName);
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.warn('Clipboard write failed:', err);
    }
  };

  const handleDownload = () => {
    downloadOrderTxt(items, storeName);
  };

  const whatsappUrl = generateWhatsAppUrl(items, whatsappNumber, storeName);

  if (!isDrawerOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex justify-end animate-in fade-in duration-200">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm transition-opacity"
        onClick={closeDrawer}
        aria-hidden="true"
      />

      {/* Slide-over panel */}
      <aside
        className="relative z-10 w-full max-w-md bg-white dark:bg-black text-black dark:text-white border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col h-full animate-in slide-in-from-right duration-300"
        aria-labelledby="cart-drawer-title"
        role="dialog"
        aria-modal="true"
      >
        {/* Drawer Header */}
        <div className="px-6 py-5 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <h2
              id="cart-drawer-title"
              className="text-base font-mono uppercase tracking-wider font-bold"
            >
              Tu Pedido
            </h2>
            <span className="text-xs font-mono px-2 py-0.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
              {totalItems} {totalItems === 1 ? 'item' : 'items'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {items.length > 0 && (
              <button
                onClick={clearCart}
                className="text-[11px] font-mono uppercase text-zinc-500 hover:text-red-500 transition-colors mr-2"
                title="Vaciar carrito"
              >
                Vaciar
              </button>
            )}
            <button
              onClick={closeDrawer}
              className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800 transition-colors"
              aria-label="Cerrar carrito"
            >
              <X size={18} weight="bold" />
            </button>
          </div>
        </div>

        {/* Drawer Body */}
        {items.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center">
            <div className="w-16 h-16 rounded-full bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center mb-4 text-zinc-400">
              <ShoppingBag size={28} weight="light" />
            </div>
            <h3 className="text-base font-sans font-bold uppercase tracking-tight mb-2">
              El carrito está vacío
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 max-w-xs mb-6 font-mono leading-relaxed">
              Explora nuestro catálogo para seleccionar suplementos de alto rendimiento.
            </p>
            <button
              onClick={() => {
                closeDrawer();
                const catalogEl = document.getElementById('catalogo');
                if (catalogEl) {
                  catalogEl.scrollIntoView({ behavior: 'smooth' });
                }
              }}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-black dark:bg-white text-white dark:text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
            >
              <span>Ver catálogo</span>
              <ArrowRight size={14} weight="bold" />
            </button>
          </div>
        ) : (
          <div className="flex-1 overflow-y-auto px-6 py-4 divide-y divide-zinc-100 dark:divide-zinc-900">
            {items.map((item) => {
              const itemTotal = item.price * item.quantity;
              const isMaxStock = item.quantity >= item.stock;

              return (
                <div key={item.product_id} className="py-4 flex gap-4 items-start">
                  {/* Thumbnail */}
                  <div className="w-16 h-16 bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shrink-0 overflow-hidden">
                    {item.image_url ? (
                      <img
                        src={item.image_url}
                        alt={item.name}
                        className="w-full h-full object-cover grayscale contrast-125"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-zinc-400 text-xs font-mono">
                        N/A
                      </div>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h4 className="text-xs font-bold uppercase tracking-tight text-black dark:text-white line-clamp-1">
                          {item.name}
                        </h4>
                        <p className="text-[10px] font-mono text-zinc-500">
                          SKU: {item.sku}
                        </p>
                      </div>

                      <button
                        onClick={() => removeItem(item.product_id)}
                        className="text-zinc-400 hover:text-red-500 transition-colors p-1"
                        aria-label={`Eliminar ${item.name}`}
                      >
                        <Trash size={14} weight="bold" />
                      </button>
                    </div>

                    <div className="mt-2 flex items-center justify-between">
                      {/* Quantity Selector */}
                      <div className="inline-flex items-center border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50">
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity - 1)}
                          className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 transition-colors"
                          aria-label="Disminuir cantidad"
                        >
                          <Minus size={12} weight="bold" />
                        </button>
                        <span className="w-8 text-center text-xs font-mono font-bold">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.product_id, item.quantity + 1)}
                          disabled={isMaxStock}
                          className="p-1 text-zinc-600 dark:text-zinc-400 hover:text-black dark:hover:text-white hover:bg-zinc-200 dark:hover:bg-zinc-800 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                          aria-label="Aumentar cantidad"
                        >
                          <Plus size={12} weight="bold" />
                        </button>
                      </div>

                      {/* Subtotal */}
                      <div className="text-right">
                        <div className="text-xs font-mono font-bold">
                          {formatCurrency(itemTotal, item.currency)}
                        </div>
                        {item.quantity > 1 && (
                          <div className="text-[10px] font-mono text-zinc-500">
                            {formatCurrency(item.price, item.currency)} c/u
                          </div>
                        )}
                      </div>
                    </div>

                    {isMaxStock && (
                      <p className="text-[10px] font-mono text-amber-600 dark:text-amber-400 mt-1">
                        Stock máximo alcanzado ({item.stock} un.)
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Drawer Footer & Checkout Actions */}
        {items.length > 0 && (
          <div className="p-6 border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/50 flex flex-col gap-4">
            {/* Total Row */}
            <div className="flex items-baseline justify-between">
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
                  Total Estimado
                </span>
                <p className="text-[10px] text-zinc-400 dark:text-zinc-600 font-mono">
                  Sujeto a confirmación final
                </p>
              </div>
              <div className="text-xl font-mono font-black tracking-tight text-black dark:text-white">
                {formattedTotalPrice}
              </div>
            </div>

            {/* Primary Action: WhatsApp Order */}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold uppercase tracking-wider hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors shadow-lg"
            >
              <WhatsappLogo size={18} weight="bold" />
              <span>Pedir por WhatsApp</span>
            </a>

            {/* Secondary Utility Actions: Copy & Download */}
            <div className="grid grid-cols-2 gap-2 pt-1">
              <button
                onClick={handleCopy}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-wider border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                title="Copiar texto del pedido para pegarlo en cualquier chat"
              >
                {copied ? (
                  <>
                    <Check size={14} weight="bold" className="text-emerald-500" />
                    <span>¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} weight="bold" />
                    <span>Copiar pedido</span>
                  </>
                )}
              </button>

              <button
                onClick={handleDownload}
                className="inline-flex items-center justify-center gap-1.5 px-3 py-2 text-[11px] font-mono uppercase tracking-wider border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white text-zinc-700 dark:text-zinc-300 hover:text-black dark:hover:text-white transition-colors"
                title="Descargar comprobante en archivo de texto plano"
              >
                <DownloadSimple size={14} weight="bold" />
                <span>Descargar .txt</span>
              </button>
            </div>
          </div>
        )}
      </aside>
    </div>
  );
}
