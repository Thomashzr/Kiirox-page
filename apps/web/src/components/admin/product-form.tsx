'use client';

import React, { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ArrowLeft,
  FloppyDisk,
  CircleNotch,
  Trash,
  Star,
  Archive,
} from '@phosphor-icons/react';
import {
  createProductAction,
  updateProductAction,
  archiveProductAction,
  deleteProductPermanentAction,
  addProductImageAction,
  deleteProductImageAction,
  setPrimaryProductImageAction,
  ProductFormData,
} from '../../app/admin/products/actions';
import { Category, Product, ProductImage } from '../../types';
import { ImageUploader } from './image-uploader';

interface ProductFormProps {
  mode: 'create' | 'edit';
  categories: Category[];
  initialData?: Product;
}

export function ProductForm({ mode, categories, initialData }: ProductFormProps) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  // Form Fields
  const [name, setName] = useState(initialData?.name || '');
  const [sku, setSku] = useState(initialData?.sku || '');
  const [slug, setSlug] = useState(initialData?.slug || '');
  const [brand, setBrand] = useState(initialData?.brand || '');
  const [categoryId, setCategoryId] = useState(
    initialData?.category_id || categories[0]?.id || ''
  );
  const [price, setPrice] = useState(initialData?.price ? String(initialData.price) : '');
  const [currency] = useState(initialData?.currency || 'ARS');
  const [stock, setStock] = useState(initialData?.stock !== undefined ? String(initialData.stock) : '0');
  const [lowStockThreshold, setLowStockThreshold] = useState(
    initialData?.low_stock_threshold !== undefined ? String(initialData.low_stock_threshold) : '5'
  );
  const [status, setStatus] = useState<'published' | 'draft' | 'archived'>(
    initialData?.status || 'published'
  );
  const [isFeatured, setIsFeatured] = useState(initialData?.is_featured || false);
  const [isNew, setIsNew] = useState(initialData?.is_new || false);
  const [sortOrder] = useState(
    initialData?.sort_order !== undefined ? String(initialData.sort_order) : '0'
  );
  const [shortDescription, setShortDescription] = useState(initialData?.short_description || '');
  const [description, setDescription] = useState(initialData?.description || '');

  // Images state
  const [images, setImages] = useState<ProductImage[]>(initialData?.images || []);
  const [newUploadedImage, setNewUploadedImage] = useState<{
    public_id: string;
    public_url: string;
    alt_text?: string;
  } | null>(null);

  // Slug auto-generation helper
  const handleNameChange = (val: string) => {
    setName(val);
    if (mode === 'create') {
      const generatedSlug = val
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMsg(null);

    if (!name.trim()) {
      setError('El nombre del producto es obligatorio');
      return;
    }
    if (!sku.trim()) {
      setError('El SKU del producto es obligatorio');
      return;
    }
    if (!slug.trim()) {
      setError('El Slug URL es obligatorio');
      return;
    }
    if (!categoryId) {
      setError('Debes seleccionar una categoría');
      return;
    }

    const numPrice = parseFloat(price);
    if (isNaN(numPrice) || numPrice < 0) {
      setError('El precio debe ser un número mayor o igual a cero');
      return;
    }

    const numStock = parseInt(stock, 10);
    if (isNaN(numStock) || numStock < 0) {
      setError('El stock debe ser un número entero mayor o igual a cero');
      return;
    }

    const numThreshold = parseInt(lowStockThreshold, 10) || 5;
    const numOrder = parseInt(sortOrder, 10) || 0;

    const payload: ProductFormData = {
      name: name.trim(),
      sku: sku.trim().toUpperCase(),
      slug: slug.trim().toLowerCase(),
      brand: brand.trim() || null,
      category_id: categoryId,
      price: numPrice,
      currency,
      stock: numStock,
      low_stock_threshold: numThreshold,
      status,
      is_featured: isFeatured,
      is_new: isNew,
      sort_order: numOrder,
      short_description: shortDescription.trim() || null,
      description: description.trim() || null,
      initial_image: mode === 'create' ? newUploadedImage : null,
    };

    startTransition(async () => {
      if (mode === 'create') {
        const res = await createProductAction(payload);
        if (res.success && res.productId) {
          router.push('/admin/products');
        } else {
          setError(res.error || 'Error al crear el producto');
        }
      } else if (initialData?.id) {
        const res = await updateProductAction(initialData.id, payload);
        if (res.success) {
          setSuccessMsg('Producto actualizado con éxito');
          router.refresh();
        } else {
          setError(res.error || 'Error al actualizar el producto');
        }
      }
    });
  };

  // Image handlers for edit mode
  const handleAddImage = async (img: {
    public_id: string;
    public_url: string;
    alt_text?: string;
  }) => {
    if (mode === 'create') {
      setNewUploadedImage(img);
      return;
    }

    if (!initialData?.id) return;

    startTransition(async () => {
      const isFirst = images.length === 0;
      const res = await addProductImageAction(initialData.id, {
        public_id: img.public_id,
        public_url: img.public_url,
        alt_text: img.alt_text || name,
        sort_order: images.length + 1,
        is_primary: isFirst,
      });

      if (res.success && res.image) {
        setImages((prev) => [...prev, res.image!]);
        setSuccessMsg('Imagen agregada con éxito');
      } else {
        setError(res.error || 'Error al agregar la imagen');
      }
    });
  };

  const handleDeleteImage = async (imageId: string, publicId: string) => {
    if (!initialData?.id) return;
    if (!window.confirm('¿Deseas eliminar esta imagen?')) return;

    startTransition(async () => {
      const res = await deleteProductImageAction(initialData.id, imageId, publicId);
      if (res.success) {
        setImages((prev) => prev.filter((img) => img.id !== imageId));
      } else {
        setError(res.error || 'Error al eliminar la imagen');
      }
    });
  };

  const handleSetPrimaryImage = async (imageId: string) => {
    if (!initialData?.id) return;

    startTransition(async () => {
      const res = await setPrimaryProductImageAction(initialData.id, imageId);
      if (res.success) {
        setImages((prev) =>
          prev.map((img) => ({
            ...img,
            is_primary: img.id === imageId,
          }))
        );
      } else {
        setError(res.error || 'Error al cambiar imagen principal');
      }
    });
  };

  const handleArchive = () => {
    if (!initialData?.id) return;
    if (!window.confirm('¿Archivar este producto?')) return;

    startTransition(async () => {
      const res = await archiveProductAction(initialData.id);
      if (res.success) {
        setStatus('archived');
        setSuccessMsg('Producto archivado correctamente');
        router.refresh();
      } else {
        setError(res.error || 'Error al archivar');
      }
    });
  };

  const handleDeletePermanent = () => {
    if (!initialData?.id) return;
    if (
      !window.confirm(
        '⚠️ PELIGRO: ¿Eliminar PERMANENTEMENTE este producto?\nEsta acción es irreversible y borrará el registro y sus fotos de Cloudinary.'
      )
    )
      return;

    startTransition(async () => {
      const res = await deleteProductPermanentAction(initialData.id);
      if (res.success) {
        router.push('/admin/products');
      } else {
        setError(res.error || 'Error al eliminar el producto');
      }
    });
  };

  return (
    <div className="space-y-8 max-w-5xl">
      {/* Navigation and Title */}
      <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 bg-zinc-900 border border-zinc-800 hover:border-zinc-600 text-zinc-400 hover:text-white transition-colors"
          >
            <ArrowLeft size={16} />
          </Link>
          <div>
            <h1 className="text-xl font-bold uppercase tracking-tight font-sans text-white">
              {mode === 'create' ? 'Nuevo Producto' : `Editar: ${initialData?.name}`}
            </h1>
            <p className="text-xs font-mono text-zinc-500">
              {mode === 'create'
                ? 'Completa los datos para dar de alta en el catálogo'
                : `ID: ${initialData?.id}`}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <Link
            href="/admin/products"
            className="px-3 py-2 text-xs font-mono uppercase tracking-wider text-zinc-400 hover:text-white border border-zinc-800 hover:border-zinc-700 transition-colors"
          >
            Cancelar
          </Link>
          <button
            onClick={handleSubmit}
            disabled={isPending}
            className="inline-flex items-center gap-2 px-4 py-2 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-sm"
          >
            {isPending ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <FloppyDisk size={14} weight="bold" />
            )}
            <span>{mode === 'create' ? 'Crear Producto' : 'Guardar Cambios'}</span>
          </button>
        </div>
      </div>

      {/* Notifications */}
      {error && (
        <div className="p-3 bg-red-950/60 border border-red-800 text-red-400 text-xs font-mono flex items-center justify-between">
          <span>{error}</span>
          <button onClick={() => setError(null)} className="text-white hover:underline text-[11px]">
            Cerrar
          </button>
        </div>
      )}

      {successMsg && (
        <div className="p-3 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-xs font-mono flex items-center justify-between">
          <span>{successMsg}</span>
          <button onClick={() => setSuccessMsg(null)} className="text-white hover:underline text-[11px]">
            Cerrar
          </button>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Section 1: Basic Info */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
            1. Información Principal
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Name */}
            <div className="md:col-span-2">
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Nombre del Producto *
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                placeholder="Ej. Gel Maurten 100 Hydrogel"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                required
              />
            </div>

            {/* SKU */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Código SKU *
              </label>
              <input
                type="text"
                value={sku}
                onChange={(e) => setSku(e.target.value)}
                placeholder="Ej. GEL-MAURTEN-100"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white uppercase focus:outline-none focus:border-white"
                required
              />
            </div>

            {/* Slug URL */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Slug URL *
              </label>
              <input
                type="text"
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="ej-gel-maurten-100"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none focus:border-white"
                required
              />
            </div>

            {/* Brand */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Marca / Fabricante
              </label>
              <input
                type="text"
                value={brand}
                onChange={(e) => setBrand(e.target.value)}
                placeholder="Ej. Maurten, Science in Sport, Optimum Nutrition"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>

            {/* Category */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Categoría *
              </label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                required
              >
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Section 2: Pricing & Inventory */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
            2. Precio & Control de Stock
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Price */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Precio ({currency}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0"
                value={price}
                onChange={(e) => setPrice(e.target.value)}
                placeholder="4800.00"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Stock Disponible *
              </label>
              <input
                type="number"
                min="0"
                value={stock}
                onChange={(e) => setStock(e.target.value)}
                placeholder="50"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                required
              />
              {mode === 'edit' && initialData?.id && (
                <p className="text-[10px] font-mono text-zinc-500 mt-1">
                  💡 Para trazabilidad con auditoría y Kardex, ajusta las unidades en el{' '}
                  <a href="/admin/inventory" className="text-zinc-300 underline hover:text-white">
                    Centro de Inventario
                  </a>.
                </p>
              )}
            </div>

            {/* Low stock threshold */}
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Alerta de Stock Bajo (Unidades)
              </label>
              <input
                type="number"
                min="0"
                value={lowStockThreshold}
                onChange={(e) => setLowStockThreshold(e.target.value)}
                placeholder="5"
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Section 3: Descriptions */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
            3. Descripciones del Suplemento
          </h2>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Descripción Corta (Visible en tarjetas de catálogo)
              </label>
              <input
                type="text"
                value={shortDescription}
                onChange={(e) => setShortDescription(e.target.value)}
                placeholder="Ej. Gel energético de hidrogel para máxima absorción gastrointestinal."
                className="w-full bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white focus:outline-none focus:border-white"
                maxLength={300}
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-1.5">
                Descripción Completa & Información Nutricional
              </label>
              <textarea
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Ingredientes, modo de empleo, tabla nutricional y recomendaciones..."
                className="w-full bg-black border border-zinc-800 p-3 text-xs font-mono text-white focus:outline-none focus:border-white"
              />
            </div>
          </div>
        </div>

        {/* Section 4: Visibility & Badges */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400 border-b border-zinc-900 pb-2">
            4. Estado & Etiquetas
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-mono uppercase text-zinc-300 mb-2">
                Estado de Publicación
              </label>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setStatus('published')}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border ${
                    status === 'published'
                      ? 'bg-emerald-950/60 border-emerald-700 text-emerald-400 font-bold'
                      : 'border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  Publicado
                </button>
                <button
                  type="button"
                  onClick={() => setStatus('draft')}
                  className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border ${
                    status === 'draft'
                      ? 'bg-zinc-800 border-zinc-600 text-white font-bold'
                      : 'border-zinc-800 text-zinc-500 hover:text-white'
                  }`}
                >
                  Borrador
                </button>
                {mode === 'edit' && (
                  <button
                    type="button"
                    onClick={() => setStatus('archived')}
                    className={`flex-1 py-2 text-xs font-mono uppercase tracking-wider border ${
                      status === 'archived'
                        ? 'bg-zinc-900 border-zinc-700 text-zinc-400 font-bold'
                        : 'border-zinc-800 text-zinc-500 hover:text-white'
                    }`}
                  >
                    Archivado
                  </button>
                )}
              </div>
            </div>

            <div className="space-y-3">
              <label className="block text-xs font-mono uppercase text-zinc-300">
                Destacados & Novedades
              </label>
              <div className="flex flex-col gap-2">
                <label className="flex items-center gap-2.5 text-xs font-mono text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={(e) => setIsFeatured(e.target.checked)}
                    className="w-4 h-4 bg-black border border-zinc-800 rounded-none accent-white"
                  />
                  <span>Marcar como Producto Destacado ⭐</span>
                </label>

                <label className="flex items-center gap-2.5 text-xs font-mono text-zinc-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isNew}
                    onChange={(e) => setIsNew(e.target.checked)}
                    className="w-4 h-4 bg-black border border-zinc-800 rounded-none accent-white"
                  />
                  <span>Etiquetar como Producto Nuevo ✨</span>
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Section 5: Photos & Cloudinary Gallery */}
        <div className="bg-zinc-950 border border-zinc-800 p-6 space-y-4">
          <div className="flex items-center justify-between border-b border-zinc-900 pb-2">
            <h2 className="text-xs font-mono uppercase tracking-wider text-zinc-400">
              5. Galería de Fotos (Cloudinary)
            </h2>
            <span className="text-[11px] font-mono text-zinc-500">
              {mode === 'create'
                ? newUploadedImage
                  ? '1 imagen preparada'
                  : 'Opcional al crear'
                : `${images.length} imágenes`}
            </span>
          </div>

          {/* Create mode: single initial image preview */}
          {mode === 'create' && (
            <div>
              {newUploadedImage ? (
                <div className="flex items-center gap-4 p-4 border border-zinc-800 bg-black">
                  <img
                    src={newUploadedImage.public_url}
                    alt={newUploadedImage.alt_text || 'Preview'}
                    className="w-20 h-20 object-cover border border-zinc-800"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-mono text-white font-bold truncate">
                      {newUploadedImage.alt_text || 'Imagen cargada'}
                    </p>
                    <p className="text-[11px] font-mono text-zinc-500 truncate">
                      ID: {newUploadedImage.public_id}
                    </p>
                    <span className="inline-block mt-1 px-2 py-0.5 bg-emerald-950/60 border border-emerald-800 text-emerald-400 text-[10px] font-mono">
                      Se guardará como imagen principal al crear
                    </span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setNewUploadedImage(null)}
                    className="p-2 text-zinc-500 hover:text-red-400 border border-zinc-800 hover:border-red-900 transition-colors"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              ) : (
                <ImageUploader onImageUploaded={handleAddImage} />
              )}
            </div>
          )}

          {/* Edit mode: gallery list + uploader for additional images */}
          {mode === 'edit' && (
            <div className="space-y-6">
              {/* Existing Images Grid */}
              {images.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                  {images.map((img) => (
                    <div
                      key={img.id}
                      className={`relative border p-2 bg-black group ${
                        img.is_primary ? 'border-white' : 'border-zinc-800'
                      }`}
                    >
                      <div className="aspect-square w-full bg-zinc-900 overflow-hidden mb-2">
                        <img
                          src={img.public_url}
                          alt={img.alt_text || name}
                          className="w-full h-full object-cover"
                        />
                      </div>

                      {img.is_primary && (
                        <div className="absolute top-3 left-3 bg-white text-black px-1.5 py-0.5 text-[9px] font-mono font-bold uppercase tracking-wider">
                          Principal
                        </div>
                      )}

                      <div className="flex items-center justify-between gap-1 pt-1 border-t border-zinc-900">
                        {!img.is_primary ? (
                          <button
                            type="button"
                            onClick={() => handleSetPrimaryImage(img.id)}
                            className="text-[11px] font-mono text-zinc-400 hover:text-white flex items-center gap-1 transition-colors"
                          >
                            <Star size={12} />
                            <span>Hacer Principal</span>
                          </button>
                        ) : (
                          <span className="text-[11px] font-mono text-zinc-500">
                            Principal
                          </span>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDeleteImage(img.id, img.public_id)}
                          className="p-1 text-zinc-500 hover:text-red-400 transition-colors"
                          title="Eliminar imagen"
                        >
                          <Trash size={14} />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-6 border border-zinc-800 bg-black text-center text-zinc-500 text-xs font-mono">
                  Este producto aún no tiene fotos cargadas. Sube una a continuación.
                </div>
              )}

              {/* Upload new photo */}
              <div>
                <p className="text-xs font-mono uppercase text-zinc-400 mb-2">
                  + Subir Foto Adicional
                </p>
                <ImageUploader onImageUploaded={handleAddImage} />
              </div>
            </div>
          )}
        </div>

        {/* Section 6: Danger Zone (Edit mode only) */}
        {mode === 'edit' && (
          <div className="border border-red-950 bg-red-950/20 p-6 space-y-4">
            <h2 className="text-xs font-mono uppercase tracking-wider text-red-400 font-bold">
              Zona de Peligro & Eliminación
            </h2>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <p className="text-xs font-mono text-zinc-300 font-bold">
                  Archivar o Eliminar Producto
                </p>
                <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                  Archivar oculta el producto de la tienda de forma segura. La eliminación permanente remueve todo registro.
                </p>
              </div>

              <div className="flex items-center gap-3">
                {status !== 'archived' && (
                  <button
                    type="button"
                    onClick={handleArchive}
                    disabled={isPending}
                    className="inline-flex items-center gap-2 px-3 py-2 bg-zinc-900 border border-zinc-700 text-zinc-300 hover:text-amber-400 hover:border-amber-700 text-xs font-mono uppercase transition-colors"
                  >
                    <Archive size={14} />
                    <span>Archivar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDeletePermanent}
                  disabled={isPending}
                  className="inline-flex items-center gap-2 px-3 py-2 bg-red-950/60 border border-red-800 text-red-400 hover:bg-red-900 text-xs font-mono uppercase font-bold transition-colors"
                >
                  <Trash size={14} />
                  <span>Eliminar Permanente</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Sticky Form Footer */}
        <div className="sticky bottom-4 z-20 bg-zinc-950/95 backdrop-blur-md border border-zinc-800 p-4 flex items-center justify-between shadow-2xl">
          <Link
            href="/admin/products"
            className="text-xs font-mono text-zinc-400 hover:text-white transition-colors"
          >
            &larr; Volver a la lista
          </Link>

          <button
            type="submit"
            disabled={isPending}
            className="inline-flex items-center gap-2 px-6 py-2.5 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 disabled:opacity-50 transition-colors shadow-md"
          >
            {isPending ? (
              <CircleNotch size={14} className="animate-spin" />
            ) : (
              <FloppyDisk size={14} weight="bold" />
            )}
            <span>{mode === 'create' ? 'Crear y Publicar' : 'Guardar Todos los Cambios'}</span>
          </button>
        </div>
      </form>
    </div>
  );
}
