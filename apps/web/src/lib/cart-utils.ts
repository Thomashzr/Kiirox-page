import { CartItem } from '../types';

export function formatCurrency(amount: number, currency: string = 'ARS'): string {
  return new Intl.NumberFormat('es-AR', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function generateOrderText(items: CartItem[], storeName: string = 'KIIROX'): string {
  if (items.length === 0) return '';

  const lines = items.map((item) => {
    const itemTotal = item.price * item.quantity;
    return `• ${item.quantity}x ${item.name} (SKU: ${item.sku}) — ${formatCurrency(itemTotal, item.currency)}`;
  });

  const total = items.reduce((acc, item) => acc + item.price * item.quantity, 0);
  const currency = items[0]?.currency || 'ARS';

  return [
    `Hola ${storeName}!`,
    '',
    'Quiero consultar por el siguiente pedido:',
    '',
    ...lines,
    '',
    `Total estimado: ${formatCurrency(total, currency)}`,
    '',
    '¿Podrían confirmarme disponibilidad y forma de pago?',
  ].join('\n');
}

export function generateWhatsAppUrl(
  items: CartItem[],
  whatsappNumber: string,
  storeName: string = 'KIIROX'
): string {
  const cleanNumber = whatsappNumber.replace(/[^0-9]/g, '');
  const text = generateOrderText(items, storeName);
  return `https://wa.me/${cleanNumber}?text=${encodeURIComponent(text)}`;
}

export function downloadOrderTxt(items: CartItem[], storeName: string = 'KIIROX'): void {
  if (items.length === 0) return;
  const content = generateOrderText(items, storeName);
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  const dateStr = new Date().toISOString().slice(0, 10);
  link.href = url;
  link.download = `pedido-${storeName.toLowerCase()}-${dateStr}.txt`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
