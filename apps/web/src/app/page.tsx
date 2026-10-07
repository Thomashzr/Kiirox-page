import { Suspense } from "react";
import {
  SignInButton,
  SignUpButton,
  Show,
  UserButton,
} from "@clerk/nextjs";

function AuthControls() {
  return (
    <div className="flex items-center gap-4">
      <Show when="signed-out">
        <SignInButton mode="modal">
          <button className="text-sm font-medium px-4 py-2 rounded-lg bg-zinc-800 hover:bg-zinc-700 transition-colors">
            Iniciar Sesión
          </button>
        </SignInButton>
        <SignUpButton mode="modal">
          <button className="text-sm font-semibold px-4 py-2 rounded-lg bg-lime-400 text-black hover:bg-lime-300 transition-colors">
            Registrarse
          </button>
        </SignUpButton>
      </Show>
      <Show when="signed-in">
        <div className="flex items-center gap-3">
          <span className="text-sm text-zinc-400">Cuenta activa:</span>
          <UserButton />
        </div>
      </Show>
    </div>
  );
}

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-950 text-zinc-100 font-sans">
      {/* Navigation Header */}
      <header className="w-full border-b border-zinc-800 bg-zinc-900/50 backdrop-blur px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <span className="text-xl font-bold tracking-wider text-lime-400">
            KIIROX
          </span>
          <span className="text-xs font-medium uppercase tracking-widest text-zinc-400 bg-zinc-800 px-2 py-0.5 rounded">
            Performance & Nutrition
          </span>
        </div>
        <Suspense fallback={<div className="h-9 w-32 bg-zinc-800/50 rounded-lg animate-pulse" />}>
          <AuthControls />
        </Suspense>
      </header>

      {/* Main Hero */}
      <main className="flex-1 flex flex-col items-center justify-center p-8 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6">
          Nutrición Deportiva & Running
        </h1>
        <p className="text-lg text-zinc-400 max-w-2xl mb-8">
          Catálogo premium de suplementos, geles, hidratación y accesorios para atletas de alto rendimiento.
        </p>
        <div className="flex gap-4">
          <a
            href="#catalogo"
            className="px-6 py-3 rounded-xl bg-lime-400 text-black font-bold hover:bg-lime-300 transition-all shadow-lg shadow-lime-400/10"
          >
            Ver Catálogo
          </a>
          <a
            href="/admin"
            className="px-6 py-3 rounded-xl bg-zinc-800 text-zinc-200 font-medium hover:bg-zinc-700 transition-all"
          >
            Panel Admin
          </a>
        </div>
      </main>

      <footer className="border-t border-zinc-900 py-6 text-center text-xs text-zinc-600">
        © 2026 KIIROX. Todos los derechos reservados.
      </footer>
    </div>
  );
}
