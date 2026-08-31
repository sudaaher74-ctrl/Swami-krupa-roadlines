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
  clientAddress?: string; // e.g. "Shop No 5, Ground Floor, Panvel"
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

export type ConsignmentCopyType =
  | 'CONSIGNEE COPY'
  | 'CONSIGNOR COPY'
  | 'DRIVER COPY'
  | 'OFFICE COPY'
  | 'TRANSPORTER COPY';

export interface ConsignmentNote {
  id: string;
  lrNo: string; // e.g. "025992" or "SKR-025992"
  date: string; // e.g. "24/08/2026"
  vehicleNo: string; // e.g. "MH46CL8146"
  branchName?: string; // e.g. "NAVI MUMBAI BRANCH"

  // Consignor (Sender)
  consignorName: string; // e.g. "M/s Alembic Pharmaceuticals LTD"
  consignorAddress: string; // e.g. "Nhava Sheva Mumbai Allcargo CFS"
  consignorGst?: string;
  fromLocation: string; // e.g. "N/Shiva"

  // Consignee (Receiver)
  consigneeName: string; // e.g. "M/s Alembic Pharmaceuticals LTD"
  consigneeAddress: string; // e.g. "F4 Jarod"
  consigneeGst?: string; // e.g. "24AAATCA5591M1Z9"
  toLocation: string; // e.g. "Jarod"

  // Goods details
  packagesCount: string; // e.g. "1X20" or "500 Bags"
  description: string; // e.g. "Flowlac-100 Lactose"
  containerNo?: string; // e.g. "MSKU3653724"
  poNumber?: string; // e.g. "PO No. 3200009020"
  senderWeight: string; // e.g. "1X20 Container Load" or "24.500 MT"
  weightCharges?: string;

  // Freight & Charges
  freightType: 'TO PAY' | 'PAID' | 'TBB';
  freightAmount?: number | '';
  collectionCharges?: number | '';
  doorDeliveryCharges?: number | '';
  biltyCharges?: number | '';
  insuranceCharges?: number | '';
  labourCharges?: number | '';
  gstAmount?: number | '';
  totalFreightAmount: number | '';
  freightRemark?: string; // e.g. "ABB A/C Alembic"

  // Documents attached
  ewayBillNo?: string; // e.g. "612169013377"
  invoiceNo?: string; // e.g. "3081744"
  invoiceDate?: string; // e.g. "11/08/2026"
  invoiceValue?: string; // e.g. "As per Invoice" or "₹ 15,40,000"
  deliveryType?: 'Godown' | 'Door Delivery' | 'Unloading By Consignee' | 'Unloading By Transport';

  // Compliance
  gstPayableBy: 'CONSIGNOR' | 'CONSIGNEE' | 'CARRIER';
  copyType: ConsignmentCopyType;

  // Company Profile
  company: CompanyProfile;
  createdAt: string;
  updatedAt?: string;
}
