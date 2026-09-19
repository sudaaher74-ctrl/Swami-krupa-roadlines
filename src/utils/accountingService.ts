import type { InvoiceData, CustomerRecord, LedgerTransaction, LedgerTransactionType, Payment, CustomerSummary } from '../types/invoice';
import { getInvoiceTotals } from './invoiceCalculations';

// ============================================================
// ACCOUNTING SERVICE — Single Source of Truth
// All financial calculations flow through here.
// No other component should derive its own outstanding/balance.
// ============================================================

/**
 * Parses various date formats used in the app to a JS Date.
 * Supports: "DD-MM-YYYY", "DD/MM/YYYY", "DD/MM/YY", "YYYY-MM-DD"
 */
export function parseDate(dateStr: string | undefined | null): Date | null {
  if (!dateStr) return null;
  const s = dateStr.trim();

  // ISO format YYYY-MM-DD
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) {
    return new Date(s);
  }

  // DD-MM-YYYY or DD/MM/YYYY
  const parts = s.split(/[-/]/);
  if (parts.length === 3) {
    const day = parseInt(parts[0], 10);
    const month = parseInt(parts[1], 10) - 1;
    let year = parseInt(parts[2], 10);
    if (year < 100) year += 2000; // "26" → 2026
    return new Date(year, month, day);
  }

  return null;
}

/**
 * Calculates number of days overdue (positive = overdue).
 * Payment terms like "30 days" means due 30 days after invoice date.
 */
export function getDaysOverdue(invoiceDate: string | undefined, paymentTerms?: string): number {
  const invDate = parseDate(invoiceDate);
  if (!invDate) return 0;

  const termDays = parseInt(paymentTerms?.replace(/\D/g, '') || '30', 10);
  const dueDate = new Date(invDate);
  dueDate.setDate(dueDate.getDate() + termDays);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const diffMs = today.getTime() - dueDate.getTime();
  return Math.floor(diffMs / (1000 * 60 * 60 * 24));
}

/**
 * Determines invoice status from its data.
 */
export function getInvoiceStatus(invoice: InvoiceData): 'PAID' | 'PARTIAL' | 'OVERDUE' | 'PENDING' {
  if (invoice.paymentStatus === 'PAID') return 'PAID';
  const totals = getInvoiceTotals(invoice);
  const received = invoice.amountReceived || 0;
  const outstanding = Math.max(0, totals.balanceAmount - received);
  if (outstanding === 0) return 'PAID';
  const daysOverdue = getDaysOverdue(invoice.date, '30 days');
  if (received > 0) return 'PARTIAL';
  if (daysOverdue > 0) return 'OVERDUE';
  return 'PENDING';
}

/**
 * Computes the complete financial summary for a customer.
 * Uses ACTUAL invoices and payments — never hardcoded.
 */
export function getCustomerSummary(
  customerId: string,
  customer: CustomerRecord | undefined,
  invoices: InvoiceData[],
  payments: Payment[]
): CustomerSummary {
  const custInvoices = invoices.filter(
    (inv) =>
      inv.customerId === customerId ||
      (customer && inv.clientName?.toLowerCase().trim() === customer.name?.toLowerCase().trim())
  );

  const custPayments = payments.filter((p) => p.customerId === customerId);

  const totalInvoiced = custInvoices.reduce((sum, inv) => {
    const totals = getInvoiceTotals(inv);
    return sum + totals.balanceAmount;
  }, 0);

  // Sum of standalone payment records
  const paymentsTotal = custPayments.reduce((sum, p) => {
    const settled = (p.totalSettled && p.totalSettled > 0)
      ? p.totalSettled
      : (p.amount || 0) + (p.tdsAmount || 0) + (p.deductionAmount || 0);
    return sum + settled;
  }, 0);

  // Also count amountReceived recorded inline on invoices (for backwards compat)
  // Only count invoice.amountReceived if there's no matching standalone payment for that invoice
  const invoicesWithStandalonePayments = new Set(
    custPayments.flatMap((p) => [
      p.invoiceId,
      ...(p.allocations ? p.allocations.map((a) => a.invoiceId) : [])
    ]).filter(Boolean)
  );
  const inlineReceived = custInvoices.reduce((sum, inv) => {
    if (!invoicesWithStandalonePayments.has(inv.id)) {
      return sum + (inv.amountReceived || 0);
    }
    return sum;
  }, 0);

  const totalReceived = paymentsTotal + inlineReceived;

  const openingBalance = customer?.openingBalance || 0;
  const openingBalanceType = customer?.openingBalanceType || 'debit';
  const openingDebit = openingBalanceType === 'debit' ? openingBalance : 0;
  const openingCredit = openingBalanceType === 'credit' ? openingBalance : 0;

  const outstanding = Math.max(0, totalInvoiced + openingDebit - totalReceived - openingCredit);

  // Overdue amount: invoices past due date
  const overdueAmount = custInvoices.reduce((sum, inv) => {
    if (inv.paymentStatus === 'PAID') return sum;
    const totals = getInvoiceTotals(inv);
    const received = inv.amountReceived || 0;
    const invOutstanding = Math.max(0, totals.balanceAmount - received);
    const daysOverdue = getDaysOverdue(inv.date, customer?.paymentTerms || '30 days');
    if (daysOverdue > 0) return sum + invOutstanding;
    return sum;
  }, 0);

  return {
    customerId,
    totalInvoiced,
    totalReceived,
    outstanding,
    openingBalance,
    openingBalanceType,
    invoiceCount: custInvoices.length,
    paymentCount: custPayments.length,
    overdueAmount,
  };
}

/**
 * Returns the full ledger for a customer, sorted by date, with running balance.
 */
export function getCustomerLedger(
  customerId: string,
  customer: CustomerRecord | undefined,
  invoices: InvoiceData[],
  payments: Payment[],
  existingLedger: LedgerTransaction[]
): Array<LedgerTransaction & { runningBalance: number }> {
  const entries: LedgerTransaction[] = [];

  // Opening balance entry
  if (customer?.openingBalance && customer.openingBalance > 0) {
    entries.push({
      id: `ob-${customerId}`,
      customerId,
      transactionDate: customer.createdAt || new Date().toISOString().slice(0, 10),
      transactionType: 'OPENING_BALANCE',
      referenceNumber: 'OB',
      description: 'Opening Balance',
      debit: customer.openingBalanceType === 'debit' ? customer.openingBalance : 0,
      credit: customer.openingBalanceType === 'credit' ? customer.openingBalance : 0,
      createdAt: customer.createdAt || new Date().toISOString(),
    });
  }

  const custInvoices = invoices.filter(
    (inv) =>
      inv.customerId === customerId ||
      (customer && inv.clientName?.toLowerCase().trim() === customer.name?.toLowerCase().trim())
  );

  const custPayments = payments.filter((p) => p.customerId === customerId);

  // Build ledger from invoices
  custInvoices.forEach((inv) => {
    const totals = getInvoiceTotals(inv);
    // Check if there's already a ledger entry for this invoice
    if (!existingLedger.find((e) => e.invoiceId === inv.id && e.transactionType === 'INVOICE')) {
      entries.push({
        id: `inv-ledger-${inv.id}`,
        customerId,
        invoiceId: inv.id,
        transactionDate: inv.date,
        transactionType: 'INVOICE' as LedgerTransactionType,
        referenceNumber: inv.billNo,
        description: `Tax Invoice #${inv.billNo}`,
        debit: totals.balanceAmount,
        credit: 0,
        createdAt: inv.createdAt,
      });
    }
  });

  // Build ledger from standalone payments
  custPayments.forEach((pay) => {
    if (!existingLedger.find((e) => e.paymentId === pay.id && e.transactionType === 'PAYMENT')) {
      const settled = (pay.totalSettled && pay.totalSettled > 0)
        ? pay.totalSettled
        : (pay.amount || 0) + (pay.tdsAmount || 0) + (pay.deductionAmount || 0);

      let desc = 'Payment Received';
      if (pay.allocations && pay.allocations.length > 0) {
        const bills = pay.allocations.map((a) => a.billNo || a.invoiceId.slice(-6)).join(', ');
        desc += ` (Against Bills: ${bills})`;
      } else if (pay.invoiceId) {
        const matched = custInvoices.find((i) => i.id === pay.invoiceId);
        desc += ` (Against Bill #${matched ? matched.billNo : pay.invoiceId.slice(-6)})`;
      }

      const notesParts: string[] = [];
      if (pay.tdsAmount && pay.tdsAmount > 0) {
        notesParts.push(`TDS: ₹${pay.tdsAmount.toLocaleString('en-IN')}${pay.tdsPercent ? ` (${pay.tdsPercent}%)` : ''}`);
      }
      if (pay.deductionAmount && pay.deductionAmount > 0) {
        notesParts.push(`Ded: ₹${pay.deductionAmount.toLocaleString('en-IN')}${pay.deductionReason ? ` (${pay.deductionReason})` : ''}`);
      }
      if (notesParts.length > 0) {
        desc += ` [Bank: ₹${pay.amount.toLocaleString('en-IN')}, ${notesParts.join(', ')}]`;
      }

      entries.push({
        id: `pay-ledger-${pay.id}`,
        customerId,
        paymentId: pay.id,
        invoiceId: pay.invoiceId,
        transactionDate: pay.paymentDate,
        transactionType: 'PAYMENT' as LedgerTransactionType,
        referenceNumber: pay.referenceNumber || `PAY-${pay.id.slice(-4).toUpperCase()}`,
        description: desc,
        debit: 0,
        credit: settled,
        createdAt: pay.createdAt,
      });
    }
  });

  // Also add inline payments on invoices (backwards compat)
  const invoicesWithStandalonePayments = new Set(
    custPayments.flatMap((p) => [
      p.invoiceId,
      ...(p.allocations ? p.allocations.map((a) => a.invoiceId) : [])
    ]).filter(Boolean)
  );

  custInvoices.forEach((inv) => {
    if (inv.amountReceived && inv.amountReceived > 0 && !invoicesWithStandalonePayments.has(inv.id)) {
      entries.push({
        id: `inline-pay-${inv.id}`,
        customerId,
        invoiceId: inv.id,
        transactionDate: inv.paymentDate || inv.updatedAt?.slice(0, 10) || inv.date,
        transactionType: 'PAYMENT' as LedgerTransactionType,
        referenceNumber: `PAY-${inv.billNo}`,
        description: `Payment Received (Against Bill #${inv.billNo})`,
        debit: 0,
        credit: inv.amountReceived,
        createdAt: inv.updatedAt || inv.createdAt,
      });
    }
  });

  // Sort by date ascending
  entries.sort((a, b) => {
    const da = parseDate(a.transactionDate);
    const db = parseDate(b.transactionDate);
    if (!da || !db) return 0;
    return da.getTime() - db.getTime();
  });

  // Add running balance
  let balance = 0;
  return entries.map((entry) => {
    balance = balance + entry.debit - entry.credit;
    return { ...entry, runningBalance: balance };
  });
}

export interface FilteredLedgerResult {
  openingBalance: number;
  openingBalanceType: 'Dr' | 'Cr';
  entries: Array<LedgerTransaction & { runningBalance: number }>;
  totalPeriodDebit: number;
  totalPeriodCredit: number;
  closingBalance: number;
  closingBalanceType: 'Dr' | 'Cr';
}

/**
 * Returns date-filtered customer ledger with accurate period opening and closing balance.
 */
export function getFilteredCustomerLedger(
  customerId: string,
  customer: CustomerRecord | undefined,
  invoices: InvoiceData[],
  payments: Payment[],
  existingLedger: LedgerTransaction[],
  startDate?: string,
  endDate?: string
): FilteredLedgerResult {
  const allEntries = getCustomerLedger(customerId, customer, invoices, payments, existingLedger);

  if (!startDate && !endDate) {
    const totalDebit = allEntries.reduce((s, e) => s + e.debit, 0);
    const totalCredit = allEntries.reduce((s, e) => s + e.credit, 0);
    const closing = totalDebit - totalCredit;
    return {
      openingBalance: 0,
      openingBalanceType: 'Dr',
      entries: allEntries,
      totalPeriodDebit: totalDebit,
      totalPeriodCredit: totalCredit,
      closingBalance: Math.abs(closing),
      closingBalanceType: closing >= 0 ? 'Dr' : 'Cr',
    };
  }

  const startD = startDate ? parseDate(startDate) : null;
  const endD = endDate ? parseDate(endDate) : null;
  if (endD) endD.setHours(23, 59, 59, 999);

  let prePeriodBalance = 0;
  const periodEntries: LedgerTransaction[] = [];

  allEntries.forEach((entry) => {
    const d = parseDate(entry.transactionDate);
    if (!d) {
      periodEntries.push(entry);
      return;
    }
    if (startD && d < startD) {
      prePeriodBalance += (entry.debit - entry.credit);
    } else if (!endD || d <= endD) {
      periodEntries.push(entry);
    }
  });

  let running = prePeriodBalance;
  const mapped = periodEntries.map((e) => {
    running += (e.debit - e.credit);
    return { ...e, runningBalance: running };
  });

  const totalPeriodDebit = periodEntries.reduce((s, e) => s + e.debit, 0);
  const totalPeriodCredit = periodEntries.reduce((s, e) => s + e.credit, 0);
  const finalBalance = prePeriodBalance + totalPeriodDebit - totalPeriodCredit;

  return {
    openingBalance: Math.abs(prePeriodBalance),
    openingBalanceType: prePeriodBalance >= 0 ? 'Dr' : 'Cr',
    entries: mapped,
    totalPeriodDebit,
    totalPeriodCredit,
    closingBalance: Math.abs(finalBalance),
    closingBalanceType: finalBalance >= 0 ? 'Dr' : 'Cr',
  };
}

/**
 * Outstanding aging buckets for a customer.
 */
export function getOutstandingAging(
  customerId: string,
  customer: CustomerRecord | undefined,
  invoices: InvoiceData[],
  payments: Payment[]
): {
  current: number;
  days1to30: number;
  days31to60: number;
  days60plus: number;
  total: number;
} {
  const custInvoices = invoices.filter(
    (inv) =>
      inv.customerId === customerId ||
      (customer && inv.clientName?.toLowerCase().trim() === customer.name?.toLowerCase().trim())
  );

  const termDays = parseInt(customer?.paymentTerms?.replace(/\D/g, '') || '30', 10);

  let current = 0;
  let days1to30 = 0;
  let days31to60 = 0;
  let days60plus = 0;

  custInvoices.forEach((inv) => {
    if (inv.paymentStatus === 'PAID') return;
    const totals = getInvoiceTotals(inv);
    const received = inv.amountReceived || 0;
    const invOutstanding = Math.max(0, totals.balanceAmount - received);
    if (invOutstanding === 0) return;

    // Also subtract standalone payments linked to this invoice (including allocations, TDS, and deductions)
    const invoicePayments = payments.filter((p) => {
      if (p.customerId !== customerId) return false;
      if (p.invoiceId === inv.id) return true;
      if (p.allocations && p.allocations.some((a) => a.invoiceId === inv.id)) return true;
      return false;
    });
    const standaloneReceived = invoicePayments.reduce((s, p) => {
      if (p.allocations) {
        const a = p.allocations.find((al) => al.invoiceId === inv.id);
        if (a) return s + (a.amount || 0) + (a.tdsAmount || 0) + (a.deductionAmount || 0);
      }
      return s + (p.totalSettled && p.totalSettled > 0 ? p.totalSettled : (p.amount || 0) + (p.tdsAmount || 0) + (p.deductionAmount || 0));
    }, 0);
    const adjustedOutstanding = Math.max(0, totals.balanceAmount - Math.max(received, standaloneReceived));
    if (adjustedOutstanding === 0) return;

    const daysOverdue = getDaysOverdue(inv.date, `${termDays} days`);

    if (daysOverdue <= 0) current += adjustedOutstanding;
    else if (daysOverdue <= 30) days1to30 += adjustedOutstanding;
    else if (daysOverdue <= 60) days31to60 += adjustedOutstanding;
    else days60plus += adjustedOutstanding;
  });

  return {
    current,
    days1to30,
    days31to60,
    days60plus,
    total: current + days1to30 + days31to60 + days60plus,
  };
}

/**
 * Creates a new ledger transaction ID.
 */
export function createLedgerTxnId(): string {
  return `lt-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Creates a new payment ID.
 */
export function createPaymentId(): string {
  return `pay-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

/**
 * Formats a number as Indian currency string (e.g. "1,16,500").
 */
export function formatINR(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) return '0';
  return new Intl.NumberFormat('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(Math.round(amount));
}

/**
 * Formats amount with ₹ symbol.
 */
export function formatCurrencyINR(amount: number): string {
  return `₹${formatINR(amount)}`;
}
