/**
 * Formats a number into Vietnamese Dong (VND) currency string.
 * @param amount The number to format.
 * @returns The formatted currency string (e.g., "100.000 ₫").
 */
export const formatVND = (amount: number): string => {
  if (typeof amount !== 'number') {
    return '0 ₫'; // Return a default value for non-numeric input
  }

  return new Intl.NumberFormat('vi-VN', {
    style: 'currency',
    currency: 'VND',
  }).format(amount);
};

/**
 * Formats a date object or string into a "dd/MM/yyyy" string.
 * @param date The date to format.
 * @returns The formatted date string.
 */
export const formatDate = (date: string | Date): string => {
  try {
    return new Date(date).toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
  } catch (error) {
    return 'Invalid Date';
  }
}; 