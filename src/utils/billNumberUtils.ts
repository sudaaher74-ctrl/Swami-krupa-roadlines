import type { InvoiceData } from '../types/invoice';

export const LOCAL_STORAGE_KEY_LAST_BILL_SEQ = 'swami_krupa_last_bill_seq_v1';

/**
 * Calculates current Indian Financial Year string (e.g., "2026-27")
 * April 1 to March 31 cycle
 */
export function getCurrentFinancialYear(date: Date = new Date()): string {
  const month = date.getMonth(); // 0 = Jan, 3 = April
  const year = date.getFullYear();
  const startYear = month >= 3 ? year : year - 1;
  const endYear = String(startYear + 1).slice(-2);
  return `${startYear}-${endYear}`;
}

/**
 * Extracts integer sequence prefix from bill number (e.g., "122/ 2026-27" -> 122, "123" -> 123)
 */
export function extractBillSequenceNumber(billNo?: string): number {
  if (!billNo) return 0;
  const match = billNo.trim().match(/^(\d+)/);
  return match ? parseInt(match[1], 10) : 0;
}

/**
 * Gets the stored highest bill sequence number from localStorage
 */
export function getStoredLastBillSeq(): number {
  try {
    const val = localStorage.getItem(LOCAL_STORAGE_KEY_LAST_BILL_SEQ);
    return val ? parseInt(val, 10) || 0 : 0;
  } catch (e) {
    return 0;
  }
}

/**
 * Updates the stored highest bill sequence number in localStorage
 */
export function recordBillSequenceNumber(seqOrBillNo: number | string): void {
  try {
    const seq = typeof seqOrBillNo === 'number' ? seqOrBillNo : extractBillSequenceNumber(seqOrBillNo);
    if (seq > 0) {
      const currentHighest = getStoredLastBillSeq();
      if (seq > currentHighest) {
        localStorage.setItem(LOCAL_STORAGE_KEY_LAST_BILL_SEQ, String(seq));
      }
    }
  } catch (e) {
    console.error('Failed to store last bill sequence', e);
  }
}

/**
 * Computes the next sequential bill number string (e.g. "123/ 2026-27")
 */
export function calculateNextBillNumber(
  savedInvoices: InvoiceData[] = [],
  currentInvoice?: InvoiceData
): string {
  const fy = getCurrentFinancialYear();
  let maxSeq = getStoredLastBillSeq();

  for (const inv of savedInvoices) {
    const seq = extractBillSequenceNumber(inv.billNo);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  if (currentInvoice) {
    const seq = extractBillSequenceNumber(currentInvoice.billNo);
    if (seq > maxSeq) {
      maxSeq = seq;
    }
  }

  // If no prior sequence exists, start at 122 (sample default) or 123
  const nextSeq = maxSeq > 0 ? maxSeq + 1 : 123;
  return `${nextSeq}/ ${fy}`;
}
