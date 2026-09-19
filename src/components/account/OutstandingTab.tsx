import React, { useMemo } from 'react';
import { AlertCircle, CreditCard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import { getOutstandingAging, getDaysOverdue, formatCurrencyINR } from '../../utils/accountingService';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';

interface OutstandingTabProps {
  client: CustomerRecord;
  onRecordPayment: () => void;
}

export const OutstandingTab: React.FC<OutstandingTabProps> = ({ client, onRecordPayment }) => {
  const { savedInvoices, payments } = useStore();

  const unpaidInvoices = useMemo(() => {
    return savedInvoices
      .filter((inv) => {
        const matchClient =
          inv.customerId === client.id ||
          inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim();
        if (!matchClient) return false;
        if (inv.paymentStatus === 'PAID') return false;
        const totals = getInvoiceTotals(inv);
        const invPayments = payments.filter((p) => p.customerId === client.id && p.invoiceId === inv.id);
        const standaloneReceived = invPayments.reduce((s, p) => s + p.amount, 0);
        const outstanding = Math.max(0, totals.balanceAmount - (inv.amountReceived || 0) - standaloneReceived);
        return outstanding > 0;
      })
      .map((inv) => {
        const totals = getInvoiceTotals(inv);
        const invPayments = payments.filter((p) => p.customerId === client.id && p.invoiceId === inv.id);
        const standaloneReceived = invPayments.reduce((s, p) => s + p.amount, 0);
        const received = (inv.amountReceived || 0) + standaloneReceived;
        const outstanding = Math.max(0, totals.balanceAmount - received);
        const daysOverdue = getDaysOverdue(inv.date, client.paymentTerms || '30 days');
        const status: 'PENDING' | 'PARTIAL' | 'OVERDUE' =
          daysOverdue > 0 ? 'OVERDUE' : received > 0 ? 'PARTIAL' : 'PENDING';

        // Due date
        const invDate = inv.date;
        const termDays = parseInt(client.paymentTerms?.replace(/\D/g, '') || '30', 10);
        const parts = invDate?.split(/[-/]/);
        let dueDate = '—';
        if (parts?.length === 3) {
          const d = new Date(
            parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2], 10),
            parseInt(parts[1], 10) - 1,
            parseInt(parts[0], 10)
          );
          d.setDate(d.getDate() + termDays);
          dueDate = `${String(d.getDate()).padStart(2, '0')}-${String(d.getMonth() + 1).padStart(2, '0')}-${d.getFullYear()}`;
        }

        return { ...inv, outstanding, received, status, daysOverdue, dueDate, totalAmount: totals.balanceAmount };
      })
      .sort((a, b) => b.daysOverdue - a.daysOverdue);
  }, [savedInvoices, payments, client]);

  const aging = useMemo(
    () => getOutstandingAging(client.id, client, savedInvoices, payments),
    [client, savedInvoices, payments]
  );

  const totalOutstanding = unpaidInvoices.reduce((s, inv) => s + inv.outstanding, 0);

  if (unpaidInvoices.length === 0) {
    return (
      <div className="empty-state">
        <AlertCircle size={40} style={{ color: '#10b981' }} />
        <h3>No Outstanding Invoices</h3>
        <p>{client.name} has no pending payments. 🎉</p>
      </div>
    );
  }

  return (
    <div>
      {/* Aging Summary */}
      <div className="aging-summary-strip">
        {[
          { label: 'Current', value: aging.current, color: '#10b981' },
          { label: '1–30 Days', value: aging.days1to30, color: '#f59e0b' },
          { label: '31–60 Days', value: aging.days31to60, color: '#ef4444' },
          { label: '60+ Days', value: aging.days60plus, color: '#dc2626' },
        ].map((bucket) => (
          <div key={bucket.label} className="aging-strip-item">
            <span className="aging-strip-label">{bucket.label}</span>
            <span className="aging-strip-value" style={{ color: bucket.color }}>
              {formatCurrencyINR(bucket.value)}
            </span>
          </div>
        ))}
        <div className="aging-strip-total">
          <span>Total Outstanding</span>
          <span className="outstanding-text">{formatCurrencyINR(totalOutstanding)}</span>
        </div>
      </div>

      {/* Outstanding Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>INVOICE</th>
              <th>INVOICE DATE</th>
              <th>DUE DATE</th>
              <th>TOTAL AMOUNT</th>
              <th>RECEIVED</th>
              <th>OUTSTANDING</th>
              <th>DAYS</th>
              <th>STATUS</th>
              <th>ACTION</th>
            </tr>
          </thead>
          <tbody>
            {unpaidInvoices.map((inv) => (
              <tr key={inv.id} className="data-table-row">
                <td className="cell-primary">Bill #{inv.billNo}</td>
                <td>{inv.date}</td>
                <td>{inv.dueDate}</td>
                <td><span className="cell-amount">{formatCurrencyINR(inv.totalAmount)}</span></td>
                <td><span className="received-text">{formatCurrencyINR(inv.received)}</span></td>
                <td><span className="cell-amount outstanding-text">{formatCurrencyINR(inv.outstanding)}</span></td>
                <td>
                  {inv.daysOverdue > 0 ? (
                    <span className="overdue-days">{inv.daysOverdue}d overdue</span>
                  ) : (
                    <span className="current-days">Current</span>
                  )}
                </td>
                <td>
                  <span className={`status-badge status-${inv.status.toLowerCase()}`}>{inv.status}</span>
                </td>
                <td>
                  <button
                    className="btn-sm btn-primary-sm"
                    onClick={onRecordPayment}
                    title="Record payment for this invoice"
                  >
                    <CreditCard size={12} /> Pay
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};
