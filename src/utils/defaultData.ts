import type { InvoiceData, CompanyProfile, BankDetails } from '../types/invoice';
import { getCurrentFinancialYear } from './billNumberUtils';

export const defaultCompanyProfile: CompanyProfile = {
  jurisdiction: 'Subject To Navi Mumbai Jurisdiction',
  companyName: 'SWAMI KRUPA ROADLINES',
  tagline: 'FLEET OWNERS & TRANSPORT CONTRACTORS',
  addressLine1: 'SHOP NO 5, GROUND FLOOR, MAHESHWAR VILLA, PLOT NO 30, SECTOR 5A, NEW PANVEL',
  addressLine2: 'NAVI MUMBAI - 410206',
  email: 'Swamikruparoadlines@gmail.com',
  mobiles: '9987010013 / 8888522803',
  panNo: 'CAYPG4986P',
  signatureForText: 'For SWAMI KRUPA ROADLINES',
  proprietorText: 'Proprietor',
  terms: [
    'Interest will be charged @ 18% if the bill is not Paid 5 Days after presentation.',
    'We are not Responsible for Leakage, Breakage, Damage, Theft & Fire.',
    'We do not own more than 10 vehicles.'
  ]
};

export const defaultBankDetails: BankDetails = {
  bankName: 'GS MAHANAGER CO BANK',
  branch: 'KHANDA COLONY',
  accountNo: '032011200000548',
  ifscCode: 'MCBL0960032'
};

export const defaultInvoice: InvoiceData = {
  id: 'sample-inv-122',
  title: 'TAX INVOICE',
  clientName: 'ADNISHA TRANSPORT',
  clientAddress: '',
  billNo: '122/ 2026-27',
  date: '22-08-2026',
  beNo: '3188241',
  beDate: '17/08/2026',
  refDocType: 'BE NO',
  items: [
    {
      id: 'row-1',
      sn: '1',
      date: '22/08/26',
      vehicleNo: 'MH46DL7778',
      containerNo: 'BEAU5560140\n1X40',
      particulars: 'CONTINENTAL TO VASAI',
      weight: 'FIXED',
      advance: '',
      amount: 19000
    },
    {
      id: 'row-2',
      sn: '',
      date: '',
      vehicleNo: '',
      containerNo: '',
      particulars: 'EMPTY OFFLOADING',
      weight: '',
      advance: '',
      amount: 4800
    }
  ],
  company: defaultCompanyProfile,
  bank: defaultBankDetails,
  advanceDeduction: 0,
  customAmountInWords: '',
  customGstPayableBy: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function createNewInvoice(
  billNumber?: string,
  customCompany?: CompanyProfile,
  customBank?: BankDetails
): InvoiceData {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const formattedDate = `${dd}-${mm}-${yyyy}`;

  return {
    id: 'inv-' + Date.now(),
    title: 'TAX INVOICE',
    clientName: '',
    clientAddress: '',
    billNo: billNumber || `123/ ${getCurrentFinancialYear(today)}`,
    date: formattedDate,
    beNo: '',
    beDate: formattedDate,
    refDocType: 'BE NO',
    items: [
      {
        id: 'row-' + Date.now(),
        sn: '1',
        date: `${dd}/${mm}/${String(yyyy).slice(-2)}`,
        vehicleNo: '',
        containerNo: '',
        particulars: '',
        weight: 'FIXED',
        advance: '',
        amount: ''
      }
    ],
    company: customCompany ? { ...customCompany } : { ...defaultCompanyProfile },
    bank: customBank ? { ...customBank } : { ...defaultBankDetails },
    advanceDeduction: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

export const defaultConsignmentNote: import('../types/invoice').ConsignmentNote = {
  id: 'sample-lr-025992',
  lrNo: '025992',
  date: '24/08/2026',
  vehicleNo: 'MH46CL8146',
  branchName: 'NAVI MUMBAI (PANVEL) BRANCH',

  consignorName: 'M/s Alembic Pharmaceuticals LTD',
  consignorAddress: 'Nhava Sheva Mumbai Allcargo CFS',
  consignorGst: '',
  fromLocation: 'N/Shiva',

  consigneeName: 'M/s Alembic Pharmaceuticals LTD',
  consigneeAddress: 'F4 Jarod, Vadodara, Gujarat',
  consigneeGst: '24AAATCA5591M1Z9',
  toLocation: 'Jarod',

  packagesCount: '1X20',
  description: 'Flowlac-100 Lactose',
  containerNo: 'MSKU3653724',
  poNumber: 'PO No. 3200009020',
  senderWeight: '1X20 Container Load',
  weightCharges: '',

  freightType: 'TBB',
  freightAmount: '',
  collectionCharges: '',
  doorDeliveryCharges: '',
  biltyCharges: '',
  insuranceCharges: '',
  labourCharges: '',
  gstAmount: '',
  totalFreightAmount: '',
  freightRemark: 'ABB A/C Alembic',

  ewayBillNo: '612169013377',
  invoiceNo: '3081744',
  invoiceDate: '11/08/2026',
  invoiceValue: 'As per Invoice',
  deliveryType: 'Godown',

  gstPayableBy: 'CONSIGNEE',
  copyType: 'CONSIGNEE COPY',
  company: defaultCompanyProfile,
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString()
};

export function createNewConsignmentNote(lrNumber?: string): import('../types/invoice').ConsignmentNote {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const formattedDate = `${dd}/${mm}/${yyyy}`;

  const randomDigits = Math.floor(10000 + Math.random() * 90000);

  return {
    id: 'lr-' + Date.now(),
    lrNo: lrNumber || `0${randomDigits}`,
    date: formattedDate,
    vehicleNo: '',
    branchName: 'NAVI MUMBAI BRANCH',

    consignorName: '',
    consignorAddress: '',
    consignorGst: '',
    fromLocation: '',

    consigneeName: '',
    consigneeAddress: '',
    consigneeGst: '',
    toLocation: '',

    packagesCount: '1X20',
    description: '',
    containerNo: '',
    poNumber: '',
    senderWeight: '',
    weightCharges: '',

    freightType: 'TO PAY',
    freightAmount: '',
    collectionCharges: '',
    doorDeliveryCharges: '',
    biltyCharges: '',
    insuranceCharges: '',
    labourCharges: '',
    gstAmount: '',
    totalFreightAmount: '',
    freightRemark: '',

    ewayBillNo: '',
    invoiceNo: '',
    invoiceDate: formattedDate,
    invoiceValue: 'As per Invoice',
    deliveryType: 'Door Delivery',

    gstPayableBy: 'CONSIGNEE',
    copyType: 'CONSIGNEE COPY',
    company: { ...defaultCompanyProfile },
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}

