export interface FundContractProps {
    investorName: string | null;
    investorId: string | null;
    investorAddress: string | null;
    fundName: string | null;
    fundCode: string | null;
    quantity: number | null;
    value: number | null;
    nav: number | null;
    transactionDate: string | null; // ISO string hoặc dd/MM/yyyy
    signature: string | null;
  }