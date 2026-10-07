'use client';

import React, { useEffect } from 'react';
import { Product } from '../types';
import { X, WhatsappLogo, CheckCircle, WarningCircle } from '@phosphor-icons/react';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  whatsappNumber?: string;
}

export function ProductModal({
  product,
  onClose,
  whatsappNumber = '+5491100000000',
}: ProductModalProps) {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (product) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [product, onClose]);

  if (!product) return null;

  const primaryImage =
    product.images.find((img) => img.is_primary)?.public_url ||
    product.images[0]?.public_url ||
    'https://images.unsplash.com/photo-1579722821273-0f6c7d44362f?auto=format&fit=crop&w=800&q=80';

  const formattedPrice = new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency: product.currency || 'ARS',
    maximumFractionDigits: 0,
  }).format(product.price);

  const isAvailable = product.stock > 0;
  const isLowStock = product.stock > 0 && product.stock <= product.low_stock_threshold;

  const whatsappMessage = encodeURIComponent(
    `Hola KIIROX! Me interesa el producto: ${product.name} (SKU: ${product.sku}) - Precio: ${formattedPrice}. ¿Tienen stock disponible para entrega?`
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/75 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-2xl bg-white dark:bg-black border border-zinc-200 dark:border-zinc-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header / Close button */}
        <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xs font-mono uppercase tracking-wider text-zinc-500">
              SKU: {product.sku}
            </span>
            {product.is_featured && (
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 bg-black text-white dark:bg-white dark:text-black font-semibold">
                DESTACADO
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-zinc-500 hover:text-black dark:hover:text-white transition-colors border border-transparent hover:border-zinc-200 dark:hover:border-zinc-800"
            aria-label="Cerrar modal"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        {/* Modal Content - Scrollable if needed */}
        <div className="overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Image */}
          <div className="aspect-square bg-zinc-100 dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 flex items-center justify-center overflow-hidden">
            <img
              src={primaryImage}
              alt={product.name}
              className="w-full h-full object-cover grayscale contrast-125 hover:grayscale-0 transition-all duration-300"
            />
          </div>

          {/* Details */}
          <div className="flex flex-col justify-between">
            <div>
              <div className="text-xs font-mono uppercase tracking-wider text-zinc-500 mb-1">
                {product.brand || 'KIIROX'} &middot; {product.category_name}
              </div>
              <h2 className="text-2xl font-black font-sans uppercase tracking-tight text-black dark:text-white mb-3">
                {product.name}
              </h2>

              <div className="text-2xl font-mono font-bold text-black dark:text-white mb-4">
                {formattedPrice}
              </div>

              {/* Stock Status Badge */}
              <div className="mb-6 flex items-center gap-2">
                {isAvailable ? (
                  isLowStock ? (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/40 px-2.5 py-1 border border-amber-200 dark:border-amber-800">
                      <WarningCircle size={14} weight="bold" />
                      <span>Últimas {product.stock} unidades</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700">
                      <CheckCircle size={14} weight="bold" />
                      <span>En Stock ({product.stock} disponibles)</span>
                    </span>
                  )
                ) : (
                  <span className="inline-flex items-center gap-1.5 text-xs font-mono text-zinc-500 bg-zinc-100 dark:bg-zinc-900 px-2.5 py-1 border border-zinc-300 dark:border-zinc-700">
                    <span>Agotado temporalmente</span>
                  </span>
                )}
              </div>

              {/* Description */}
              <div className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed mb-6">
                <p className="mb-2">{product.short_description}</p>
                {product.description && (
                  <p className="text-xs text-zinc-500 border-t border-zinc-100 dark:border-zinc-900 pt-2">
                    {product.description}
                  </p>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="pt-4 border-t border-zinc-200 dark:border-zinc-800">
              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=${whatsappMessage}`}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full inline-flex items-center justify-center gap-2 px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold tracking-wider uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <WhatsappLogo size={18} weight="bold" />
                <span>Pedir o Consultar vía WhatsApp</span>
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
