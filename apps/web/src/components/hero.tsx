import React from 'react';
import { ArrowDown, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';

interface HeroProps {
  whatsappNumber?: string;
}

export function Hero({ whatsappNumber = '+5491100000000' }: HeroProps) {
  return (
    <section className="relative w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white pt-16 md:pt-20 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-8 items-center">
          {/* Main Hero Copy - Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* 1. Eyebrow */}
            <div className="inline-flex items-center gap-2 mb-4 px-2.5 py-1 border border-black dark:border-white text-[11px] font-mono tracking-widest uppercase">
              <span className="w-1.5 h-1.5 bg-black dark:bg-white rounded-none" />
              <span>KIIROX ATHLETICS &middot; 2026</span>
            </div>

            {/* 2. Headline (Max 2 lines on desktop) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans uppercase tracking-tighter leading-[1.05] mb-5 text-black dark:text-white">
              Nutrición de precisión para atletas de resistencia.
            </h1>

            {/* 3. Subtext (Under 20 words) */}
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 font-normal leading-relaxed max-w-[55ch] mb-8">
              Geles con tecnología hidrogel, proteínas aisladas y sales minerales diseñadas para superar marcas personales sin compromisos digestivos.
            </p>

            {/* 4. CTAs (Visible immediately, full contrast) */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-mono font-bold tracking-wider uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors"
              >
                <span>Ver Catálogo</span>
                <ArrowDown size={14} weight="bold" />
              </a>

              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20KIIROX,%20quisiera%20asesoramiento%20sobre%20suplementos`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-black dark:border-white text-black dark:text-white text-xs font-mono font-bold tracking-wider uppercase hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors"
              >
                <WhatsappLogo size={16} weight="bold" />
                <span>Asesoría Rápida</span>
              </a>
            </div>
          </div>

          {/* Architectural Minimalist Spec Box - Right Column */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 bg-zinc-50 dark:bg-zinc-950 font-mono">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-4">
                <span className="text-[11px] uppercase tracking-wider text-zinc-500">
                  ESTÁNDAR DE SUMINISTRO
                </span>
                <span className="text-[10px] text-zinc-400">BATCH: 2026.01</span>
              </div>

              <ul className="space-y-4 text-xs">
                <li className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500 uppercase">MARCAS</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    Maurten &middot; SiS &middot; Optimum &middot; Skratch
                  </span>
                </li>
                <li className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500 uppercase">DISPONIBILIDAD</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    Stock en tiempo real verificado
                  </span>
                </li>
                <li className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500 uppercase">ENVÍOS</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    Despacho 24hs en todo el país
                  </span>
                </li>
                <li className="flex items-start justify-between gap-4">
                  <span className="text-zinc-500 uppercase">PAGO</span>
                  <span className="font-bold text-black dark:text-white text-right">
                    Transferencia &middot; Efectivo &middot; WhatsApp
                  </span>
                </li>
              </ul>

              <div className="mt-6 pt-4 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-400">
                Formula testeadas bajo estándares internacionales de nutrición atlética.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
