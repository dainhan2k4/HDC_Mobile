import { useState } from 'react';
import { PdfService, PdfSignatureData } from '../services/PdfService';

export const usePdfService = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const appendSignatureToPdf = async (data: PdfSignatureData) => {
    setLoading(true);
    setError(null);
    try {
      const result = await PdfService.appendSignatureToPdf(data);
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Có lỗi xảy ra';
      setError(errorMessage);
      throw err;
    } finally {
      setLoading(false);
    }
  };

  
  

  return {
    loading,
    error,
    appendSignatureToPdf,
  };
}; 