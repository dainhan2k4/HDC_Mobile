/**
 * Formats a number into Vietnamese Dong (VND) currency string.
 * @param amount The number to format.
 * @returns The formatted currency string (e.g., "100.000 ₫").
 */
export const formatVND = (amount: number): string => {
    if (amount === undefined || amount === null) {
        return '0 ₫';
    }

    if (typeof amount !== 'number') {
      return '0 ₫'; // Return a default value for non-numeric input
    }
  
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
    }).format(amount);
  }; 
export default formatVND;