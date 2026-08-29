export interface LineItem {
  id: string;
  sn: string; // Serial number e.g. "1"
  date: string; // e.g. "22/08/26"
  vehicleNo: string; // e.g. "MH46DL7778"
  containerNo: string; // e.g. "BEAU5560140\n1X40" or "BEAU5560140 1X40"
  particulars: string; // e.g. "CONTINENTAL TO VASAI" or "EMPTY OFFLOADING"
  weight: string; // e.g. "FIXED" or "24 MT"
  advance: string; // e.g. "" or "5,000.00"
  amount: number | ''; // e.g. 19000.00
}

export interface BankDetails {
  bankName: string;
  branch: string;
  accountNo: string;
  ifscCode: string;
}

export interface CompanyProfile {
  jurisdiction: string; // e.g. "Subject To Navi Mumbai Jurisdiction"
  companyName: string; // e.g. "SWAMI KRUPA ROADLINES"
  tagline: string; // e.g. "FLEET OWNERS & TRANSPORT CONTRACTORS"
  addressLine1: string; // e.g. "SHOP NO 5 GROUND FLOOR MAHESHWER VILLA PLOT NO 30 SECTOR 5A NEW PANVEL"
  addressLine2: string; // e.g. "NAVI MUMBAI-410206"
  email: string; // e.g. "Swamikruparoadlines@gmail.com"
  mobiles: string; // e.g. "9987010013 / 8888522803"
  panNo: string; // e.g. "CAYPG4986P"
  signatureForText: string; // e.g. "For SWAMI KRUPA ROADLINES"
  proprietorText: string; // e.g. "Proprietor"
  terms: string[];
}

export interface InvoiceData {
  id: string;
  title: string; // e.g. "TAX INVOICE"
  clientName: string; // e.g. "ADNISHA TRANSPORT"
  clientPhone?: string; // e.g. "+91 9876543210"
  billNo: string; // e.g. "122/ 2026-27"
  date: string; // e.g. "22-08-2026"
  beNo: string; // e.g. "3188241"
  beDate: string; // e.g. "17/08/2026"
  refDocType?: 'BE NO' | 'INVOICE NO' | string; // e.g. "BE NO" or "INVOICE NO"
  items: LineItem[];
  company: CompanyProfile;
  bank: BankDetails;
  advanceDeduction: number; // e.g. 0.00
  customAmountInWords?: string;
  customGstPayableBy?: string;
  paymentStatus?: 'PAID' | 'UNPAID' | 'PARTIAL';
  amountReceived?: number;
  paymentDate?: string;
  paymentMode?: 'BANK_TRANSFER' | 'UPI' | 'CHEQUE' | 'CASH' | 'OTHER' | string;
  paymentNotes?: string;
  createdAt: string;
  updatedAt: string;
}

export interface CustomerRecord {
  id: string;
  name: string;
  phone?: string;
  gstin?: string;
  address?: string;
}

export interface VehicleRecord {
  id: string;
  vehicleNo: string;
  driverName?: string;
  driverPhone?: string;
  type?: string;
}

export interface TripSlip {
  id: string;
  slipNo: string;
  date: string;
  vehicleNo: string;
  driverName: string;
  driverPhone?: string;
  fromLocation: string;
  toLocation: string;
  containerNo?: string;
  dieselLiters?: number | '';
  dieselRate?: number | '';
  dieselAmount?: number | '';
  dieselPumpName?: string;
  driverAdvance?: number | '';
  tollCharges?: number | '';
  otherExpenses?: number | '';
  remarks?: string;
  totalExpense: number;
  company: CompanyProfile;
  createdAt: string;
}
