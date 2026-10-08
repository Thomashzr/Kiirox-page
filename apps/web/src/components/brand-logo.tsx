import React from 'react';

interface BrandLogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

/**
 * Brand Logo Component & Placeholder Slot
 * 
 * Replace the typography block below with your official logo asset:
 * e.g. <Image src="/logo.svg" alt="KIIROX" width={140} height={36} priority />
 */
export function BrandLogo({ className = '', size = 'md' }: BrandLogoProps) {
  const sizeClasses = {
    sm: 'text-base tracking-widest',
    md: 'text-xl tracking-tighter',
    lg: 'text-3xl tracking-tighter',
  }[size];

  return (
    <div className={`inline-flex items-center gap-2.5 ${className}`}>
      {/* 
        [LOGO_SLOT]: Cuando tengas el archivo de logo (SVG o PNG),
        reemplaza esta marca de marcaje tipográfica por tu componente <Image />.
      */}
      <div className="relative flex items-center">
        {/* Isotipo geométrico minimalista en blanco y negro */}
        <div className="w-8 h-8 rounded-none border-2 border-black dark:border-white bg-black dark:bg-white flex items-center justify-center text-white dark:text-black font-mono font-black text-sm select-none">
          K
        </div>
        <div className="ml-2.5 flex flex-col">
          <span className={`font-black font-sans uppercase leading-none text-black dark:text-white ${sizeClasses}`}>
            KIIROX
          </span>
          <span className="text-[9px] font-mono uppercase tracking-[0.25em] text-zinc-500 dark:text-zinc-400 mt-0.5">
            ATHLETICS &middot; LAB
          </span>
        </div>
      </div>
    </div>
  );
}
