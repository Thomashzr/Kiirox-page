'use client';

import React, { useState, useRef } from 'react';
import {
  UploadSimple,
  CircleNotch,
  WarningCircle,
  Link as LinkIcon,
} from '@phosphor-icons/react';

interface ImageUploaderProps {
  onImageUploaded: (image: {
    public_id: string;
    public_url: string;
    alt_text?: string;
  }) => void;
  className?: string;
}

export function ImageUploader({ onImageUploaded, className = '' }: ImageUploaderProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);
  const [showUrlInput, setShowUrlInput] = useState(false);
  const [directUrl, setDirectUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Por favor selecciona un archivo de imagen válido (JPEG, PNG, WEBP, AVIF)');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      setError('El archivo supera los 10MB máximos permitidos.');
      return;
    }

    setIsUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append('file', file);

      const response = await fetch('/api/admin/cloudinary/upload', {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        if (data.error === 'CONFIG_MISSING') {
          // If Cloudinary is not configured yet, offer direct URL fallback
          setShowUrlInput(true);
          throw new Error(
            'Cloudinary no está configurado en el servidor todavía. Puedes ingresar una URL directa de imagen abajo.'
          );
        }
        throw new Error(data.message || 'Error al subir la imagen');
      }

      onImageUploaded({
        public_id: data.image.public_id,
        public_url: data.image.public_url,
        alt_text: file.name.replace(/\.[^/.]+$/, ''),
      });
    } catch (err: any) {
      setError(err.message || 'Error durante la subida');
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!directUrl.trim()) return;

    const trimmed = directUrl.trim();
    const publicId = `url_${Date.now()}`;

    onImageUploaded({
      public_id: publicId,
      public_url: trimmed,
      alt_text: 'Imagen importada',
    });

    setDirectUrl('');
    setShowUrlInput(false);
    setError(null);
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragOver(false);
          const files = e.dataTransfer.files;
          if (files && files.length > 0) {
            handleFileUpload(files[0]);
          }
        }}
        onClick={() => {
          if (!isUploading) fileInputRef.current?.click();
        }}
        className={`border-2 border-dashed p-6 text-center cursor-pointer transition-colors ${
          dragOver
            ? 'border-white bg-zinc-900'
            : 'border-zinc-800 bg-zinc-950/60 hover:border-zinc-600 hover:bg-zinc-900/50'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/png, image/jpeg, image/webp, image/avif"
          className="hidden"
          onChange={(e) => {
            const files = e.target.files;
            if (files && files.length > 0) {
              handleFileUpload(files[0]);
            }
          }}
          disabled={isUploading}
        />

        <div className="flex flex-col items-center justify-center gap-2">
          {isUploading ? (
            <div className="flex flex-col items-center gap-2">
              <CircleNotch size={32} className="animate-spin text-white" />
              <p className="text-xs font-mono text-zinc-400 uppercase tracking-wider">
                Optimizando y subiendo a Cloudinary...
              </p>
            </div>
          ) : (
            <>
              <div className="w-12 h-12 bg-zinc-900 border border-zinc-800 flex items-center justify-center text-zinc-400 mb-1">
                <UploadSimple size={24} />
              </div>
              <p className="text-xs font-mono text-zinc-300 font-bold uppercase tracking-wider">
                Arrastra una imagen o haz clic para subir
              </p>
              <p className="text-[11px] font-mono text-zinc-500">
                Formatos: PNG, JPG, WEBP, AVIF (Máx. 10MB)
              </p>
            </>
          )}
        </div>
      </div>

      {error && (
        <div className="flex items-start gap-2 p-3 bg-red-950/40 border border-red-900 text-red-400 text-xs font-mono">
          <WarningCircle size={16} className="shrink-0 mt-0.5" />
          <div className="flex-1">
            <p>{error}</p>
            {!showUrlInput && (
              <button
                type="button"
                onClick={() => setShowUrlInput(true)}
                className="mt-1 text-white underline hover:text-zinc-300 block text-[11px]"
              >
                ¿Quieres ingresar una URL directa de imagen?
              </button>
            )}
          </div>
        </div>
      )}

      {/* Alternative direct URL input */}
      <div className="flex justify-between items-center text-[11px] font-mono">
        <button
          type="button"
          onClick={() => setShowUrlInput(!showUrlInput)}
          className="text-zinc-500 hover:text-zinc-300 flex items-center gap-1.5 transition-colors"
        >
          <LinkIcon size={13} />
          <span>{showUrlInput ? 'Ocultar entrada por URL' : 'O vincular imagen por URL directa'}</span>
        </button>
      </div>

      {showUrlInput && (
        <form onSubmit={handleUrlSubmit} className="flex gap-2">
          <input
            type="url"
            value={directUrl}
            onChange={(e) => setDirectUrl(e.target.value)}
            placeholder="https://ejemplo.com/imagen.jpg o https://res.cloudinary.com/..."
            className="flex-1 bg-black border border-zinc-800 px-3 py-2 text-xs font-mono text-white placeholder-zinc-600 focus:outline-none focus:border-white"
          />
          <button
            type="submit"
            disabled={!directUrl.trim()}
            className="px-4 py-2 bg-white text-black text-xs font-mono uppercase font-bold tracking-wider hover:bg-zinc-200 disabled:opacity-50 transition-colors"
          >
            Vincular
          </button>
        </form>
      )}
    </div>
  );
}
