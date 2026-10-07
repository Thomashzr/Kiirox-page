import React from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ArrowLeft, WarningOctagon } from '@phosphor-icons/react/dist/ssr';
import { getAdminProductById, getAdminCategories } from '../actions';
import { ProductForm } from '../../../../components/admin/product-form';

export const dynamic = 'force-dynamic';

interface EditProductPageProps {
  params: Promise<{ id: string }>;
}

export default async function EditProductPage({ params }: EditProductPageProps) {
  const { id } = await params;
  const [product, categories] = await Promise.all([
    getAdminProductById(id),
    getAdminCategories(),
  ]);

  if (!product) {
    return (
      <div className="max-w-md mx-auto my-12 bg-zinc-950 border border-zinc-800 p-8 text-center space-y-4">
        <div className="w-12 h-12 bg-red-950/40 border border-red-800 text-red-500 rounded-full flex items-center justify-center mx-auto">
          <WarningOctagon size={24} weight="bold" />
        </div>
        <h2 className="text-lg font-bold uppercase font-sans text-white">
          Producto no encontrado
        </h2>
        <p className="text-xs font-mono text-zinc-400">
          No se encontró ningún producto con el identificador &quot;{id}&quot;.
        </p>
        <Link
          href="/admin/products"
          className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 transition-colors"
        >
          <ArrowLeft size={14} />
          <span>Volver al Catálogo</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="py-2">
      <ProductForm mode="edit" categories={categories} initialData={product} />
    </div>
  );
}
