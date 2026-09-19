import React, { useMemo } from 'react';
import { FileText, ClipboardList, CreditCard } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';
import { formatCurrencyINR } from '../../utils/accountingService';

interface DocumentsPageProps {
  client: CustomerRecord | null;
}

export const DocumentsPage: React.FC<DocumentsPageProps> = ({ client }) => {
  const { savedInvoices, consignmentNotes, payments } = useStore();

  const docs = useMemo(() => {
    if (!client) {
      return {
        invoices: savedInvoices.slice(0, 20),
        lrs: consignmentNotes.slice(0, 20),
        pays: payments.slice(0, 20),
      };
    }
    return {
      invoices: savedInvoices.filter(
        (inv) =>
          inv.customerId === client.id ||
          inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
      ),
      lrs: consignmentNotes.filter(
        (lr) =>
          lr.customerId === client.id ||
          lr.consigneeName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
      ),
      pays: payments.filter((p) => p.customerId === client.id),
    };
  }, [client, savedInvoices, consignmentNotes, payments]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div>
          <h1 className="page-title">Documents{client ? ` — ${client.name}` : ''}</h1>
          <p className="page-subtitle">All documents organized in one place</p>
        </div>
      </div>

      <div className="docs-grid">
        {/* Invoices */}
        <div className="docs-section">
          <div className="docs-section-header">
            <FileText size={18} className="docs-icon-invoice" />
            <h2>Tax Invoices ({docs.invoices.length})</h2>
          </div>
          {docs.invoices.map((inv) => {
            const totals = getInvoiceTotals(inv);
            return (
              <div key={inv.id} className="doc-item">
                <div className="doc-item-icon"><FileText size={16} /></div>
                <div className="doc-item-info">
                  <div className="doc-item-title">Bill #{inv.billNo}</div>
                  <div className="doc-item-sub">{inv.date} · {formatCurrencyINR(totals.balanceAmount)}</div>
                </div>
                <div className="doc-item-actions">
                  <span className={`status-badge-sm status-${(inv.paymentStatus || 'pending').toLowerCase()}`}>
                    {inv.paymentStatus || 'PENDING'}
                  </span>
                </div>
              </div>
            );
          })}
          {docs.invoices.length === 0 && <div className="empty-state-sm">No invoices found</div>}
        </div>

        {/* e-LRs */}
        <div className="docs-section">
          <div className="docs-section-header">
            <ClipboardList size={18} className="docs-icon-lr" />
            <h2>e-LR / Bilty ({docs.lrs.length})</h2>
          </div>
          {docs.lrs.map((lr) => (
            <div key={lr.id} className="doc-item">
              <div className="doc-item-icon lr"><ClipboardList size={16} /></div>
              <div className="doc-item-info">
                <div className="doc-item-title">LR #{lr.lrNo}</div>
                <div className="doc-item-sub">
                  {lr.date} · {lr.fromLocation || '—'} → {lr.toLocation || '—'}
                </div>
              </div>
              <div className="doc-item-actions">
                <span className={`freight-type-badge freight-${lr.freightType?.replace(' ', '-').toLowerCase()}`}>
                  {lr.freightType}
                </span>
              </div>
            </div>
          ))}
          {docs.lrs.length === 0 && <div className="empty-state-sm">No e-LRs found</div>}
        </div>

        {/* Payments */}
        <div className="docs-section">
          <div className="docs-section-header">
            <CreditCard size={18} className="docs-icon-payment" />
            <h2>Payment Receipts ({docs.pays.length})</h2>
          </div>
          {docs.pays.map((pay) => (
            <div key={pay.id} className="doc-item">
              <div className="doc-item-icon payment"><CreditCard size={16} /></div>
              <div className="doc-item-info">
                <div className="doc-item-title">{formatCurrencyINR(pay.amount)}</div>
                <div className="doc-item-sub">{pay.paymentDate} · {pay.paymentMode?.replace('_', ' ')}</div>
              </div>
              {pay.referenceNumber && (
                <div className="doc-item-actions">
                  <span className="doc-ref">{pay.referenceNumber}</span>
                </div>
              )}
            </div>
          ))}
          {docs.pays.length === 0 && <div className="empty-state-sm">No payments found</div>}
        </div>
      </div>
    </div>
  );
};
