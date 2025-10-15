// Utility functions for formatting and display

export function formatVND(amount: number): string {
  // Format Vietnamese Dong without decimal places
  return `${amount.toLocaleString('vi-VN')}đ`;
}

export function formatPrice(price: string | number): string {
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  return formatVND(numPrice);
}