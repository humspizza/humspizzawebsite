// Currency formatting utilities

export function formatCurrency(amount: number | string): string {
  const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
  
  // Simple VND formatting with đ symbol, no decimals
  return `${Math.round(numAmount).toLocaleString('vi-VN')}đ`;
}

export function formatPrice(price: number | string): string {
  if (price === null || price === undefined) {
    return '0đ';
  }
  
  const numPrice = typeof price === 'string' ? parseFloat(price) : price;
  
  if (isNaN(numPrice)) {
    return '0đ';
  }
  
  // Simple VND formatting with thousand separators, no decimals
  return `${Math.round(numPrice).toLocaleString('vi-VN')}đ`;
}

// Convert price to number for calculations
export function parsePriceToNumber(price: string | number): number {
  return typeof price === 'string' ? parseFloat(price) : price;
}