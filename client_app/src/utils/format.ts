export const formatCurrency = (value: number, suffix = 'đ'): string => {
  if (value === null || value === undefined || isNaN(value as any)) return `0 ${suffix}`;
  try {
    return `${Number(value).toLocaleString('vi-VN')} ${suffix}`;
  } catch {
    return `${value} ${suffix}`;
  }
};

export const formatPercent = (value: number): string => {
  if (value === null || value === undefined || isNaN(value as any)) return '0%';
  return `${Number(value).toFixed(0)}%`;
};








