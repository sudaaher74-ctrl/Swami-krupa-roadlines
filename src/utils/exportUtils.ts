import { toPng } from 'html-to-image';
import { jsPDF } from 'jspdf';
import type { InvoiceData } from '../types/invoice';
import { formatCurrency } from './numberToWords';

/**
 * Captures the invoice paper element and downloads as high-resolution A4 PDF using native HTML-to-Image rendering
 */
export async function downloadInvoicePDF(invoice: InvoiceData): Promise<void> {
  const element = document.getElementById('invoice-printable-doc');
  if (!element) {
    throw new Error('Invoice document element not found');
  }

  // Ensure fonts are fully loaded before capturing
  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  // Render using native browser engine (SVG ForeignObject) for flawless typography and zero space collapse
  const imgData = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0 auto',
      boxShadow: 'none',
    },
  });

  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const elementWidth = element.offsetWidth || 794;
  const elementHeight = element.offsetHeight || 1123;
  const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  if (typeof window !== 'undefined') {
    (window as any).__lastPdfDataUrl = imgData;
  }

  const cleanBillNo = (invoice.billNo || 'invoice').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const filename = `Invoice_${cleanBillNo}_${invoice.clientName || 'Transport'}.pdf`;
  
  pdf.save(filename);
}

/**
 * Generates WhatsApp sharing link with structured invoice details
 */
export function generateWhatsAppMessage(invoice: InvoiceData): string {
  const total = invoice.items.reduce((s, i) => s + (Number(i.amount) || 0), 0);
  const advance = Number(invoice.advanceDeduction) || 0;
  const balance = total - advance;

  const vehicleList = Array.from(
    new Set(invoice.items.map((i) => i.vehicleNo).filter(Boolean))
  ).join(', ');

  const particularsSummary = invoice.items
    .map((item) => `• ${item.particulars || 'Freight'} ${item.vehicleNo ? `(${item.vehicleNo})` : ''} - ₹${formatCurrency(item.amount)}`)
    .join('\n');

  const message = 
`🚛 *${invoice.company.companyName}*
*TAX INVOICE BILL*
━━━━━━━━━━━━━━━━━━━━
📄 *Bill No:* ${invoice.billNo}
📅 *Date:* ${invoice.date}
🏢 *Party:* ${invoice.clientName || 'ADNISHA TRANSPORT'}
${invoice.beNo ? `📋 *${invoice.refDocType || 'BE No'}:* ${invoice.beNo} (dt. ${invoice.beDate})\n` : ''}${vehicleList ? `🚚 *Vehicle(s):* ${vehicleList}\n` : ''}
*Particulars Breakdown:*
${particularsSummary}
━━━━━━━━━━━━━━━━━━━━
💰 *Bill Total:* ₹${formatCurrency(total)}
💳 *Advance:* ₹${formatCurrency(advance)}
⚖️ *Balance Payable:* ₹${formatCurrency(balance)}
━━━━━━━━━━━━━━━━━━━━
🏦 *Bank Transfer Details:*
• *Bank:* ${invoice.bank.bankName}
• *A/C No:* ${invoice.bank.accountNo}
• *IFSC Code:* ${invoice.bank.ifscCode}
• *Branch:* ${invoice.bank.branch}
━━━━━━━━━━━━━━━━━━━━
_Thank you for your business!_`;

  return message;
}

export function openWhatsAppShare(invoice: InvoiceData, customPhone?: string): void {
  const message = generateWhatsAppMessage(invoice);
  const encodedMsg = encodeURIComponent(message);
  
  let cleanPhone = (customPhone || invoice.clientPhone || '').replace(/[^\d]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone; // Default to India country code if 10 digits
  }

  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  window.open(url, '_blank');
}

/**
 * Escapes a cell for CSV formatting
 */
function escapeCSV(val: any): string {
  if (val === null || val === undefined) return '""';
  const str = String(val).replace(/"/g, '""');
  return `"${str}"`;
}

/**
 * Exports invoice list to standard Excel CSV with UTF-8 BOM
 */
export function exportInvoicesToCSV(invoices: InvoiceData[]): void {
  if (!invoices || invoices.length === 0) {
    throw new Error('No invoices to export');
  }

  const headers = [
    'Bill No',
    'Date',
    'Party / Consignee',
    'Phone',
    'Ref Type',
    'Ref No',
    'Ref Date',
    'Vehicle Numbers',
    'Container Numbers',
    'Particulars / Routes',
    'Items Count',
    'Gross Amount (INR)',
    'Advance Deduction (INR)',
    'Net Amount (INR)',
    'Payment Status',
    'Amount Received (INR)',
    'Pending Balance (INR)',
    'Payment Date',
    'Payment Mode',
    'Payment Notes',
  ];

  const rows = invoices.map((inv) => {
    const gross = inv.items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
    const advance = Number(inv.advanceDeduction) || 0;
    const net = gross - advance;
    const received = Number(inv.amountReceived) || (inv.paymentStatus === 'PAID' ? net : 0);
    const pending = Math.max(0, net - received);

    const vehicles = Array.from(new Set(inv.items.map((i) => i.vehicleNo).filter(Boolean))).join('; ');
    const containers = Array.from(new Set(inv.items.map((i) => (i.containerNo || '').replace(/\n/g, ' ')).filter(Boolean))).join('; ');
    const particulars = inv.items.map((i) => i.particulars).filter(Boolean).join(' | ');

    return [
      escapeCSV(inv.billNo),
      escapeCSV(inv.date),
      escapeCSV(inv.clientName || 'N/A'),
      escapeCSV(inv.clientPhone || ''),
      escapeCSV(inv.refDocType || 'BE NO'),
      escapeCSV(inv.beNo || ''),
      escapeCSV(inv.beDate || ''),
      escapeCSV(vehicles),
      escapeCSV(containers),
      escapeCSV(particulars),
      escapeCSV(inv.items.length),
      escapeCSV(gross.toFixed(2)),
      escapeCSV(advance.toFixed(2)),
      escapeCSV(net.toFixed(2)),
      escapeCSV(inv.paymentStatus || (received >= net && net > 0 ? 'PAID' : received > 0 ? 'PARTIAL' : 'UNPAID')),
      escapeCSV(received.toFixed(2)),
      escapeCSV(pending.toFixed(2)),
      escapeCSV(inv.paymentDate || ''),
      escapeCSV(inv.paymentMode || ''),
      escapeCSV(inv.paymentNotes || ''),
    ].join(',');
  });

  const csvContent = '\uFEFF' + [headers.map(h => `"${h}"`).join(','), ...rows].join('\r\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const todayStr = new Date().toISOString().slice(0, 10);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.setAttribute('download', `SwamiKrupa_Invoices_Billing_Report_${todayStr}.csv`);
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

/**
 * Captures the trip slip element and downloads as printable PDF using HTML-to-Image
 */
export async function downloadTripSlipPDF(slipElementId: string, slipNo: string, vehicleNo: string): Promise<void> {
  const element = document.getElementById(slipElementId);
  if (!element) {
    throw new Error('Trip slip element not found');
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const imgData = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0 auto',
      boxShadow: 'none',
    },
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a5',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const elementWidth = element.offsetWidth || 500;
  const elementHeight = element.offsetHeight || 700;
  const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const cleanSlipNo = (slipNo || 'slip').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const filename = `TripSlip_${cleanSlipNo}_${vehicleNo || 'Fleet'}.pdf`;
  pdf.save(filename);
}

/**
 * Captures the Goods Consignment Note element and downloads as high-res A4 PDF
 */
export async function downloadConsignmentNotePDF(note: import('../types/invoice').ConsignmentNote): Promise<void> {
  const element = document.getElementById('consignment-printable-doc');
  if (!element) {
    throw new Error('Consignment Note element not found');
  }

  if (document.fonts && document.fonts.ready) {
    await document.fonts.ready;
  }

  const imgData = await toPng(element, {
    quality: 1.0,
    pixelRatio: 2.5,
    backgroundColor: '#ffffff',
    cacheBust: true,
    style: {
      transform: 'none',
      margin: '0 auto',
      boxShadow: 'none',
    },
  });

  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const elementWidth = element.offsetWidth || 794;
  const elementHeight = element.offsetHeight || 1123;
  const pdfHeight = (elementHeight * pdfWidth) / elementWidth;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

  const cleanLrNo = (note.lrNo || 'LR').replace(/[/\\?%*:|"<>]/g, '_').trim();
  const filename = `ConsignmentNote_${cleanLrNo}_${note.vehicleNo || 'Transport'}.pdf`;
  pdf.save(filename);
}

/**
 * Generates WhatsApp message for Goods Consignment Note (e-LR)
 */
export function generateConsignmentWhatsAppMessage(note: import('../types/invoice').ConsignmentNote): string {
  const message =
`📋 *${note.company.companyName}*
*GOODS CONSIGNMENT NOTE (e-LR)*
━━━━━━━━━━━━━━━━━━━━
📄 *G.C. / LR No:* ${note.lrNo}
📅 *Date:* ${note.date}
🚚 *Vehicle No:* ${note.vehicleNo}
🏢 *Consignor (Sender):* ${note.consignorName} (${note.fromLocation})
🏬 *Consignee (Receiver):* ${note.consigneeName} (${note.toLocation})
━━━━━━━━━━━━━━━━━━━━
📦 *Goods Description:* ${note.description}
🔢 *Packages:* ${note.packagesCount}
${note.containerNo ? `📦 *Container:* ${note.containerNo}\n` : ''}⚖️ *Weight:* ${note.senderWeight}
${note.ewayBillNo ? `📑 *E-Way Bill:* ${note.ewayBillNo}\n` : ''}${note.invoiceNo ? `📄 *Invoice No:* ${note.invoiceNo} (dt. ${note.invoiceDate})\n` : ''}━━━━━━━━━━━━━━━━━━━━
💰 *Freight Type:* ${note.freightType}
${note.totalFreightAmount ? `💵 *Total Freight:* ₹${formatCurrency(note.totalFreightAmount)}\n` : ''}⚖️ *GST Payable By:* ${note.gstPayableBy}
📌 *Copy:* ${note.copyType}
━━━━━━━━━━━━━━━━━━━━
_Thank you for choosing Swami Krupa Roadlines!_`;

  return message;
}

export function openConsignmentWhatsAppShare(note: import('../types/invoice').ConsignmentNote, customPhone?: string): void {
  const message = generateConsignmentWhatsAppMessage(note);
  const encodedMsg = encodeURIComponent(message);
  
  let cleanPhone = (customPhone || '').replace(/[^\d]/g, '');
  if (cleanPhone.length === 10) {
    cleanPhone = '91' + cleanPhone;
  }

  const url = cleanPhone
    ? `https://api.whatsapp.com/send?phone=${cleanPhone}&text=${encodedMsg}`
    : `https://api.whatsapp.com/send?text=${encodedMsg}`;

  window.open(url, '_blank');
}

