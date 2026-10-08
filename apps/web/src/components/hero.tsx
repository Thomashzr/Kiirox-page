import React from 'react';
import { ArrowDown, WhatsappLogo } from '@phosphor-icons/react/dist/ssr';

interface HeroProps {
  whatsappNumber?: string;
}

export function Hero({ whatsappNumber = '+5491100000000' }: HeroProps) {
  return (
    <section className="relative w-full border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white pt-14 md:pt-20 pb-16 transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-10 items-center">
          {/* Main Hero Copy - Left Column */}
          <div className="lg:col-span-7 flex flex-col items-start text-left">
            {/* Headline (Editorial athletic weight, no kicker above) */}
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-black font-sans uppercase tracking-tight leading-[1.02] mb-6 text-black dark:text-white">
              Nutrición de precisión para atletas de resistencia.
            </h1>

            {/* Subtext (Balanced, high-contrast readable copy) */}
            <p className="text-base sm:text-lg text-zinc-600 dark:text-zinc-300 font-normal leading-relaxed max-w-[55ch] mb-8">
              Geles con tecnología hidrogel, proteínas aisladas y sales minerales diseñadas para sostener el ritmo y superar marcas sin compromisos digestivos.
            </p>

            {/* CTAs (Clear visual hierarchy, sans-serif athletic controls) */}
            <div className="flex flex-wrap items-center gap-4">
              <a
                href="#catalogo"
                className="inline-flex items-center gap-2 px-6 py-3.5 bg-black dark:bg-white text-white dark:text-black text-xs font-sans font-bold tracking-wider uppercase hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-colors cursor-pointer"
              >
                <span>Ver Catálogo</span>
                <ArrowDown size={14} weight="bold" />
              </a>

              <a
                href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20KIIROX,%20quisiera%20asesoramiento%20sobre%20suplementos`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-6 py-3.5 border border-black dark:border-white text-black dark:text-white text-xs font-sans font-bold tracking-wider uppercase hover:bg-zinc-100 dark:hover:bg-zinc-900 transition-colors cursor-pointer"
              >
                <WhatsappLogo size={16} weight="bold" />
                <span>Asesoría Directa</span>
              </a>
            </div>
          </div>

          {/* Architectural Technical Matrix - Right Column */}
          <div className="lg:col-span-5 flex flex-col justify-center">
            <div className="border border-zinc-200 dark:border-zinc-800 p-6 sm:p-7 bg-zinc-50 dark:bg-zinc-950">
              <div className="flex items-center justify-between border-b border-zinc-200 dark:border-zinc-800 pb-3 mb-5">
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[11px] font-sans font-bold uppercase tracking-wider text-black dark:text-white">
                    PROTOCOLO ATLÉTICO 2026
                  </span>
                </div>
                <span className="text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
                  LOTE: 2026.01
                </span>
              </div>

              <dl className="space-y-4 text-xs">
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-zinc-600 dark:text-zinc-400 uppercase font-sans font-medium text-[11px] tracking-wide">
                    Ratio Carbohidratos
                  </dt>
                  <dd className="font-mono tabular-nums font-bold text-black dark:text-white text-right">
                    1:0.8 Glucosa / Fructosa
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-zinc-600 dark:text-zinc-400 uppercase font-sans font-medium text-[11px] tracking-wide">
                    Tecnología Matriz
                  </dt>
                  <dd className="font-sans font-semibold text-black dark:text-white text-right">
                    Hidrogel Biopolímero
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-zinc-600 dark:text-zinc-400 uppercase font-sans font-medium text-[11px] tracking-wide">
                    Sodio & Electrolitos
                  </dt>
                  <dd className="font-mono tabular-nums font-bold text-black dark:text-white text-right">
                    200 – 500 mg / toma
                  </dd>
                </div>
                <div className="flex items-baseline justify-between gap-4">
                  <dt className="text-zinc-600 dark:text-zinc-400 uppercase font-sans font-medium text-[11px] tracking-wide">
                    Despacho & Stock
                  </dt>
                  <dd className="font-sans font-semibold text-black dark:text-white text-right">
                    Inmediato en 24h a todo el país
                  </dd>
                </div>
              </dl>

              <div className="mt-5 pt-3.5 border-t border-zinc-200 dark:border-zinc-800 text-[11px] text-zinc-500 dark:text-zinc-400 leading-normal">
                Fórmulas testeadas y aprobadas para maratón, media distancia y ultra-resistencia.
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
