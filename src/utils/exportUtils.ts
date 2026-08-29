import html2canvas from 'html2canvas';
import { jsPDF } from 'jspdf';
import type { InvoiceData } from '../types/invoice';
import { formatCurrency } from './numberToWords';

/**
 * Captures the invoice paper element and downloads as high-resolution A4 PDF
 */
export async function downloadInvoicePDF(invoice: InvoiceData): Promise<void> {
  const element = document.getElementById('invoice-printable-doc');
  if (!element) {
    throw new Error('Invoice document element not found');
  }

  // Temporarily ensure high resolution
  const canvas = await html2canvas(element, {
    scale: 2.5, // 2.5x for crisp text and lines
    useCORS: true,
    logging: false,
    backgroundColor: '#ffffff',
  });

  const imgData = canvas.toDataURL('image/png');
  
  // A4 dimensions in mm: 210 x 297
  const pdf = new jsPDF({
    orientation: 'portrait',
    unit: 'mm',
    format: 'a4',
  });

  const pdfWidth = pdf.internal.pageSize.getWidth();
  const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

  pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');

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
