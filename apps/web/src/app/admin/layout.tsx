import React from 'react';
import { redirect } from 'next/navigation';
import { verifyAdminAccess } from '../../lib/admin-auth';
import { UserButton } from '@clerk/nextjs';
import { BrandLogo } from '../../components/brand-logo';
import {
  House,
  Package,
  Stack,
  ChartBar,
  ShieldCheck,
  SignOut,
  ArrowSquareOut,
  WarningOctagon,
} from '@phosphor-icons/react/dist/ssr';

export default async function AdminLayout({

  children,
}: {
  children: React.ReactNode;
}) {
  const authResult = await verifyAdminAccess();

  if (!authResult.authorized) {
    if (authResult.reason === 'unauthenticated') {
      redirect('/sign-in?redirect_url=/admin');
    }

    // Forbidden: authenticated with Clerk, but not in admin_users whitelist
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 text-center selection:bg-white selection:text-black">
        <div className="max-w-md w-full bg-zinc-950 border border-zinc-800 p-8 shadow-2xl">
          <div className="w-14 h-14 rounded-full bg-red-950/40 border border-red-800 text-red-500 flex items-center justify-center mx-auto mb-5">
            <WarningOctagon size={28} weight="bold" />
          </div>

          <h1 className="text-xl font-bold uppercase tracking-tight font-sans mb-2">
            Acceso No Autorizado
          </h1>

          <p className="text-xs font-mono text-zinc-400 mb-6 leading-relaxed">
            Tu cuenta autenticada no posee permisos de Administrador en la plataforma KIIROX.
          </p>

          <div className="bg-zinc-900 border border-zinc-800 p-3 mb-6 text-left">
            <p className="text-[11px] font-mono text-zinc-500 uppercase">Cuenta de Clerk:</p>
            <p className="text-xs font-mono font-bold text-white truncate">
              {authResult.email}
            </p>
            <p className="text-[10px] font-mono text-zinc-500 truncate mt-1">
              ID: {authResult.clerkUserId}
            </p>
          </div>

          <div className="flex flex-col gap-3">
            <a
              href="/"
              className="w-full py-2.5 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 transition-colors"
            >
              Volver a la tienda
            </a>
            <div className="flex justify-center pt-2">
              <UserButton />
            </div>
          </div>
        </div>
      </div>
    );
  }

  const { admin, clerkUser } = authResult;

  return (
    <div className="min-h-screen flex bg-zinc-950 text-white font-sans selection:bg-white selection:text-black">
      {/* Sidebar Navigation */}
      <aside className="w-64 border-r border-zinc-800 bg-black flex flex-col shrink-0">
        {/* Brand & Badge */}
        <div className="p-6 border-b border-zinc-800 flex items-center justify-between">
          <a href="/admin" className="flex items-center gap-2">
            <BrandLogo size="sm" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider bg-white text-black px-1.5 py-0.5">
              ADMIN
            </span>
          </a>
        </div>

        {/* Navigation Items */}
        <nav className="flex-1 p-4 space-y-1 font-mono text-xs uppercase tracking-wider">
          <a
            href="/admin"
            className="flex items-center gap-3 px-3 py-2.5 text-white bg-zinc-900 border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <ChartBar size={16} weight="bold" />
            <span>Dashboard</span>
          </a>

          <a
            href="/admin/products"
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Package size={16} weight="bold" />
            <span>Productos</span>
          </a>

          <a
            href="/admin/inventory"
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <Stack size={16} weight="bold" />
            <span>Inventario</span>
          </a>

          <a
            href="/admin#categorias"
            className="flex items-center gap-3 px-3 py-2.5 text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
          >
            <House size={16} weight="bold" />
            <span>Categorías</span>
          </a>
        </nav>

        {/* Quick link to public store */}
        <div className="p-4 border-t border-zinc-800">
          <a
            href="/"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between px-3 py-2 text-xs font-mono text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            <span>Ver Tienda Pública</span>
            <ArrowSquareOut size={14} weight="bold" />
          </a>
        </div>

        {/* Current Admin User Profile Footer */}
        <div className="p-4 border-t border-zinc-800 bg-zinc-950 flex items-center justify-between">
          <div className="flex-1 min-w-0 mr-3">
            <div className="flex items-center gap-1.5">
              <ShieldCheck size={14} weight="bold" className="text-emerald-500 shrink-0" />
              <span className="text-[10px] font-mono uppercase tracking-wider text-emerald-400 font-bold truncate">
                {admin.role === 'super_admin' ? 'Super Admin' : 'Admin'}
              </span>
            </div>
            <p className="text-xs font-mono text-zinc-300 truncate mt-0.5" title={admin.email}>
              {admin.email}
            </p>
          </div>

          <UserButton
            appearance={{
              elements: {
                avatarBox: 'w-7 h-7 border border-zinc-700',
              },
            }}
          />
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-y-auto">
        <header className="h-16 border-b border-zinc-800 bg-black/60 backdrop-blur-md px-8 flex items-center justify-between sticky top-0 z-30">
          <div className="flex items-center gap-4">
            <h1 className="text-sm font-mono uppercase tracking-wider text-zinc-400">
              Panel de Control &middot; KIIROX
            </h1>
          </div>

          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-emerald-950/40 border border-emerald-800 text-emerald-400 text-[11px]">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Sesión Segura</span>
            </span>
          </div>
        </header>

        <main className="flex-1 p-8">
          {children}
        </main>
      </div>
    </div>
  );
}
