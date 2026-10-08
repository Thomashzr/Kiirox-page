'use client';

import React, { Suspense } from 'react';
import { SignInButton, Show, UserButton } from '@clerk/nextjs';
import { BrandLogo } from './brand-logo';
import { WhatsappLogo, ShoppingBag } from '@phosphor-icons/react';
import { useCart } from '../context/cart-context';

interface NavbarProps {
  whatsappNumber?: string;
}

export function Navbar({ whatsappNumber = '+5491100000000' }: NavbarProps) {
  const { totalItems, openDrawer } = useCart();

  return (
    <header className="sticky top-0 z-40 w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/90 dark:bg-black/90 backdrop-blur-md transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand / Logo Slot */}
        <a href="/" className="flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-black dark:focus-visible:ring-white">
          <BrandLogo size="md" />
        </a>

        {/* Desktop Navigation Links */}
        <nav className="hidden md:flex items-center gap-8 text-xs font-sans font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <a
            href="#catalogo"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Catálogo
          </a>
          <a
            href="#destacados"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Destacados
          </a>
          <a
            href="#garantia"
            className="hover:text-black dark:hover:text-white transition-colors"
          >
            Atletas & Calidad
          </a>
        </nav>

        {/* Right Actions: Clerk Auth & WhatsApp */}
        <div className="flex items-center gap-3">
          {/* WhatsApp Direct Ordering */}
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20KIIROX,%20quisiera%20consultar%20por%20un%20pedido`}
            target="_blank"
            rel="noopener noreferrer"
            className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold uppercase tracking-wider border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white text-black dark:text-white transition-colors cursor-pointer"
            title="Atención directa por WhatsApp"
          >
            <WhatsappLogo size={16} weight="bold" />
            <span>WhatsApp</span>
          </a>

          {/* Cart Drawer Trigger */}
          <button
            onClick={openDrawer}
            className="relative inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-sans font-semibold uppercase tracking-wider border border-zinc-300 dark:border-zinc-700 hover:border-black dark:hover:border-white text-black dark:text-white transition-colors cursor-pointer"
            title="Ver carrito de compras"
            aria-label={`Ver carrito de compras, ${totalItems} items`}
          >
            <ShoppingBag size={16} weight="bold" />
            <span className="hidden sm:inline">Carrito</span>
            {totalItems > 0 && (
              <span className="inline-flex items-center justify-center min-w-[18px] h-[18px] px-1 text-[10px] font-mono tabular-nums font-bold bg-black text-white dark:bg-white dark:text-black">
                {totalItems}
              </span>
            )}
          </button>


          {/* Clerk Auth Integration */}
          <div className="flex items-center pl-2 border-l border-zinc-200 dark:border-zinc-800">
            <Suspense
              fallback={
                <div className="h-8 w-24 bg-zinc-100 dark:bg-zinc-800 animate-pulse rounded" />
              }
            >
              <Show when="signed-out">
                <SignInButton mode="modal">
                  <button className="px-3 py-1.5 text-xs font-sans uppercase tracking-wider bg-black dark:bg-white text-white dark:text-black font-bold hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer">
                    Ingresar
                  </button>
                </SignInButton>
              </Show>
              <Show when="signed-in">
                <div className="flex items-center gap-2">
                  <span className="hidden xl:inline text-xs font-mono text-zinc-500">
                    Mi Cuenta
                  </span>
                  <UserButton
                    appearance={{
                      elements: {
                        avatarBox: 'w-7 h-7 border border-zinc-300 dark:border-zinc-700',
                      },
                    }}
                  />
                </div>
              </Show>
            </Suspense>
          </div>
        </div>
      </div>
    </header>
  );
}
