/**
 * Format a number as an Indian Rupee (INR) currency string.
 * Example: 12500 -> "₹12,500"
 * 
 * @param amount Amount in INR
 * @returns Formatted currency string
 */
export function formatCurrency(amount: number): string {
  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(amount);
  } catch {
    return `₹${amount}`;
  }
}
