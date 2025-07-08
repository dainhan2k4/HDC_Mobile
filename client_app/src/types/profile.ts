// Profile-related type definitions

export interface PersonalInfo {
  id?: number | null;
  name: string;
  email: string;
  phone: string;
  birth_date: string;
  gender: string;
  nationality: string;
  id_type: string;
  id_number: string;
  id_issue_date: string;
  id_issue_place: string;
  id_front?: string;
  id_back?: string;
}

export interface BankInfo {
  id?: number | null;
  account_holder: string;
  account_number: string;
  bank_name: string;
  branch: string;
  company_name?: string;
  company_address?: string;
  monthly_income?: string;
  occupation?: string;
  position?: string;
}

export interface AddressInfo {
  id?: number | null;
  street: string;
  ward: string;
  district: string;
  province: string;
  country?: string;
  postal_code?: string;
}

export interface ProfileData {
  personalInfo: PersonalInfo | null;
  bankInfo: BankInfo | null;
  addressInfo: AddressInfo | null;
}