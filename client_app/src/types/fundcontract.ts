export interface FundContractProps {
    investorName: string;
    investorId: string;
    investorPhone: string;
    investorAddress: string;
    fundName: string | null;
    fundCode: number;
    quantity: number;
    value: number;
    nav: number;
    transactionDate: string; // ISO string hoặc dd/MM/yyyy
    signature: string;
    signedPdfBase64?: string; // PDF đã ký từ server
  }