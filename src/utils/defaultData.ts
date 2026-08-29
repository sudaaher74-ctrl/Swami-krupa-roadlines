import type { InvoiceData, CompanyProfile, BankDetails } from '../types/invoice';

export const defaultCompanyProfile: CompanyProfile = {
  jurisdiction: 'Subject To Navi Mumbai Jurisdiction',
  companyName: 'SWAMI KRUPA ROADLINES',
  tagline: 'FLEET OWNERS & TRANSPORT CONTRACTORS',
  addressLine1: 'SHOP NO 5 GROUND FLOOR MAHESHWER VILLA PLOT NO 30 SECTOR 5A NEW PANVEL',
  addressLine2: 'NAVI MUMBAI-410206',
  email: 'Swamikruparoadlines@gmail.com',
  mobiles: '9987010013 / 8888522803',
  panNo: 'CAYPG4986P',
  signatureForText: 'For SWAMI KRUPA ROADLINES',
  proprietorText: 'Proprietor',
  terms: [
    'Interest will be charged @ 18% if the bill is not Paid 5 Days after presentation.',
    'We are not Responsible for Leakage Breakage Damage, Thief & Fire',
    'We do not own more than 10 vehicles.'
  ]
};

export const defaultBankDetails: BankDetails = {
  bankName: 'GS MAHANAGER CO BANK',
  branch: 'KHANDACONLNY',
  accountNo: '032011200000548',
  ifscCode: 'MCBL0960032'
};

export const defaultInvoice: InvoiceData = {
  id: 'sample-inv-122',
  title: 'TAX INVOICE',
  clientName: 'ADNISHA TRANSPORT',
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

export function createNewInvoice(billNumber?: string): InvoiceData {
  const today = new Date();
  const dd = String(today.getDate()).padStart(2, '0');
  const mm = String(today.getMonth() + 1).padStart(2, '0');
  const yyyy = today.getFullYear();
  const formattedDate = `${dd}-${mm}-${yyyy}`;

  return {
    id: 'inv-' + Date.now(),
    title: 'TAX INVOICE',
    clientName: '',
    billNo: billNumber || `101/ ${yyyy}-${String(yyyy + 1).slice(-2)}`,
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
    company: { ...defaultCompanyProfile },
    bank: { ...defaultBankDetails },
    advanceDeduction: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  };
}
