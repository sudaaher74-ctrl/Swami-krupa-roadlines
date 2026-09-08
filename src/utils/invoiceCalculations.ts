import type { LineItem } from '../types/invoice';

/**
 * Parses any advance value (number, string with commas, currency symbols, etc.) to a valid number.
 */
export function parseAdvanceAmount(val: string | number | undefined | null): number {
  if (val === undefined || val === null) return 0;
  if (typeof val === 'number') return isNaN(val) ? 0 : val;
  const str = String(val).trim();
  if (!str) return 0;
  const cleaned = str.replace(/,/g, '').replace(/[^0-9.-]/g, '');
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Computes the total advance amount for an invoice.
 * Checks if line items have an advance specified (sum of item advances).
 * If no line item advances exist, falls back to the manual invoice.advanceDeduction field.
 */
export function getInvoiceAdvance(invoice?: { items?: LineItem[]; advanceDeduction?: number }): number {
  if (!invoice) return 0;
  const itemsAdvance = (invoice.items || []).reduce(
    (sum, item) => sum + parseAdvanceAmount(item.advance),
    0
  );
  if (itemsAdvance > 0) {
    return itemsAdvance;
  }
  return Number(invoice.advanceDeduction) || 0;
}

/**
 * Computes gross bill total, total advance amount, and net balance payable for an invoice.
 */
export function getInvoiceTotals(invoice?: { items?: LineItem[]; advanceDeduction?: number }) {
  if (!invoice) {
    return { billTotal: 0, advanceAmount: 0, balanceAmount: 0 };
  }
  const billTotal = (invoice.items || []).reduce(
    (sum, item) => sum + (Number(item.amount) || 0),
    0
  );
  const advanceAmount = getInvoiceAdvance(invoice);
  const balanceAmount = Math.max(0, billTotal - advanceAmount);

  return {
    billTotal,
    advanceAmount,
    balanceAmount,
  };
}
