'use client';

import React, { createContext, useContext, useState, useEffect, useCallback, useMemo } from 'react';
import { Product, CartItem } from '../types';
import { formatCurrency } from '../lib/cart-utils';

const STORAGE_KEY = 'kiirox_cart_v1';

export interface ToastMessage {
  id: string;
  title: string;
  productName?: string;
  type?: 'success' | 'warning' | 'info';
}

interface CartContextValue {
  items: CartItem[];
  totalItems: number;
  totalPrice: number;
  formattedTotalPrice: string;
  isDrawerOpen: boolean;
  toast: ToastMessage | null;
  addItem: (product: Product, quantity?: number) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  removeItem: (productId: string) => void;
  clearCart: () => void;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  dismissToast: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [toast, setToast] = useState<ToastMessage | null>(null);
  const [isHydrated, setIsHydrated] = useState(false);

  // 1. Initial hydration from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setItems(parsed);
        }
      }
    } catch (err) {
      console.warn('Failed to parse cart from localStorage:', err);
    } finally {
      setIsHydrated(true);
    }
  }, []);

  // 2. Synchronize to localStorage whenever items change (after initial mount)
  useEffect(() => {
    if (!isHydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
    } catch (err) {
      console.warn('Failed to save cart to localStorage:', err);
    }
  }, [items, isHydrated]);

  // Toast auto-dismiss timeout
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => {
      setToast(null);
    }, 3500);
    return () => clearTimeout(timer);
  }, [toast]);

  const showToast = useCallback((title: string, productName?: string, type: 'success' | 'warning' | 'info' = 'success') => {
    setToast({
      id: Math.random().toString(36).substring(2, 9),
      title,
      productName,
      type,
    });
  }, []);

  const dismissToast = useCallback(() => {
    setToast(null);
  }, []);

  const addItem = useCallback((product: Product, quantity: number = 1) => {
    if (product.stock <= 0) {
      showToast('Producto agotado', product.name, 'warning');
      return;
    }

    setItems((prevItems) => {
      const existingIndex = prevItems.findIndex((i) => i.product_id === product.id);

      if (existingIndex > -1) {
        const existing = prevItems[existingIndex];
        const newQuantity = existing.quantity + quantity;

        if (newQuantity > product.stock) {
          showToast(`Stock máximo alcanzado (${product.stock} unidades)`, product.name, 'warning');
          const updated = [...prevItems];
          updated[existingIndex] = {
            ...existing,
            quantity: product.stock,
          };
          return updated;
        }

        const updated = [...prevItems];
        updated[existingIndex] = {
          ...existing,
          quantity: newQuantity,
        };
        showToast('Cantidad actualizada en el carrito', product.name, 'success');
        return updated;
      }

      // New item
      const initialQty = Math.min(Math.max(1, quantity), product.stock);
      const primaryImage =
        product.images.find((img) => img.is_primary)?.public_url ||
        product.images[0]?.public_url ||
        null;

      const newItem: CartItem = {
        product_id: product.id,
        name: product.name,
        sku: product.sku,
        price: product.price,
        currency: product.currency || 'ARS',
        quantity: initialQty,
        image_url: primaryImage,
        stock: product.stock,
        slug: product.slug,
      };

      showToast('Agregado al carrito', product.name, 'success');
      return [...prevItems, newItem];
    });
  }, [showToast]);

  const updateQuantity = useCallback((productId: string, quantity: number) => {
    setItems((prevItems) => {
      if (quantity <= 0) {
        return prevItems.filter((i) => i.product_id !== productId);
      }

      return prevItems.map((item) => {
        if (item.product_id !== productId) return item;
        const boundedQty = Math.min(quantity, item.stock);
        return {
          ...item,
          quantity: boundedQty,
        };
      });
    });
  }, []);

  const removeItem = useCallback((productId: string) => {
    setItems((prevItems) => {
      const removedItem = prevItems.find((i) => i.product_id === productId);
      if (removedItem) {
        showToast('Producto eliminado del carrito', removedItem.name, 'info');
      }
      return prevItems.filter((i) => i.product_id !== productId);
    });
  }, [showToast]);

  const clearCart = useCallback(() => {
    setItems([]);
    showToast('Carrito vaciado', undefined, 'info');
  }, [showToast]);

  const openDrawer = useCallback(() => setIsDrawerOpen(true), []);
  const closeDrawer = useCallback(() => setIsDrawerOpen(false), []);
  const toggleDrawer = useCallback(() => setIsDrawerOpen((prev) => !prev), []);

  // Derived values computed during render
  const totalItems = useMemo(() => {
    return items.reduce((acc, item) => acc + item.quantity, 0);
  }, [items]);

  const totalPrice = useMemo(() => {
    return items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  }, [items]);

  const formattedTotalPrice = useMemo(() => {
    const currency = items[0]?.currency || 'ARS';
    return formatCurrency(totalPrice, currency);
  }, [totalPrice, items]);

  const value = useMemo<CartContextValue>(() => ({
    items,
    totalItems,
    totalPrice,
    formattedTotalPrice,
    isDrawerOpen,
    toast,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    dismissToast,
  }), [
    items,
    totalItems,
    totalPrice,
    formattedTotalPrice,
    isDrawerOpen,
    toast,
    addItem,
    updateQuantity,
    removeItem,
    clearCart,
    openDrawer,
    closeDrawer,
    toggleDrawer,
    dismissToast,
  ]);

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart(): CartContextValue {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
