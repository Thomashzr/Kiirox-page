import React from 'react';
import { BrandLogo } from './brand-logo';
import { WhatsappLogo, ShieldCheck, Truck, Clock } from '@phosphor-icons/react/dist/ssr';

interface FooterProps {
  whatsappNumber?: string;
}

export function Footer({ whatsappNumber = '+5491100000000' }: FooterProps) {
  return (
    <footer id="garantia" className="w-full border-t border-zinc-200 dark:border-zinc-800 bg-white dark:bg-black text-black dark:text-white transition-colors">
      {/* Value Pillars Banner */}
      <div className="border-b border-zinc-200 dark:border-zinc-800 py-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 grid grid-cols-1 md:grid-cols-3 gap-8">
          <div className="flex items-start gap-4">
            <div className="w-10 h-10 border border-black dark:border-white flex items-center justify-center shrink-0">
              <ShieldCheck size={20} weight="bold" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm uppercase tracking-wider mb-1">
                Fórmulas Certificadas
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                Suplementación deportiva 100% original con trazabilidad garantizada por lote y fabricante.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 border border-black dark:border-white flex items-center justify-center shrink-0">
              <Truck size={20} weight="bold" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm uppercase tracking-wider mb-1">
                Envíos a Todo el País
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                Despachos seguros en 24 a 48 horas con seguimiento en tiempo real de tu encomienda.
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="w-10 h-10 border border-black dark:border-white flex items-center justify-center shrink-0">
              <Clock size={20} weight="bold" />
            </div>
            <div>
              <h4 className="font-sans font-bold text-sm uppercase tracking-wider mb-1">
                Atención para Atletas
              </h4>
              <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans leading-relaxed">
                Asesoramiento personalizado en timing de carbohidratos, hidratación y gramos de sodio por hora.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
        <div>
          <BrandLogo size="md" className="mb-3" />
          <p className="text-xs text-zinc-600 dark:text-zinc-400 font-sans max-w-sm leading-relaxed">
            Laboratorio de nutrición y suplementos deportivos para atletas de resistencia, maratón y triatlón.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6 text-xs font-sans font-semibold uppercase tracking-wider text-zinc-600 dark:text-zinc-400">
          <a
            href={`https://wa.me/${whatsappNumber.replace(/[^0-9]/g, '')}?text=Hola%20KIIROX,%20quisiera%20hacer%20una%20consulta`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 hover:text-black dark:hover:text-white transition-colors"
          >
            <WhatsappLogo size={16} weight="bold" />
            <span>Atención WhatsApp</span>
          </a>
          <a
            href="/admin"
            className="hover:text-black dark:hover:text-white transition-colors border-b border-transparent hover:border-black dark:hover:border-white"
          >
            Panel Administrativo
          </a>
        </div>
      </div>

      {/* Copyright Bar */}
      <div className="border-t border-zinc-200 dark:border-zinc-800 py-6 text-center text-[11px] font-mono tabular-nums text-zinc-500 dark:text-zinc-400">
        &copy; 2026 KIIROX ATHLETICS. Todos los derechos reservados.
      </div>
    </footer>
  );
}
