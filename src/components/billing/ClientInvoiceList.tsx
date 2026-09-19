import React, { useMemo, useState } from 'react';
import { FileText, Plus, Search, Edit2, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';
import { getDaysOverdue, formatCurrencyINR } from '../../utils/accountingService';
import { deleteInvoice } from '../../utils/supabaseService';

interface ClientInvoiceListProps {
  client: CustomerRecord;
  onCreateInvoice: () => void;
  onSelectInvoice?: (id: string) => void;
}

export const ClientInvoiceList: React.FC<ClientInvoiceListProps> = ({
  client,
  onCreateInvoice,
  onSelectInvoice,
}) => {
  const { savedInvoices, setSavedInvoices, payments } = useStore();
  const [searchQ, setSearchQ] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE'>('all');

  const clientInvoices = useMemo(() => {
    return savedInvoices
      .filter((inv) =>
        inv.customerId === client.id ||
        inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
      )
      .filter((inv) => {
        const q = searchQ.toLowerCase();
        return !q || inv.billNo?.toLowerCase().includes(q) || inv.beNo?.toLowerCase().includes(q);
      })
      .map((inv) => {
        const totals = getInvoiceTotals(inv);
        const invPayments = payments.filter((p) => p.customerId === client.id && p.invoiceId === inv.id);
        const standaloneReceived = invPayments.reduce((s, p) => s + p.amount, 0);
        const received = (inv.amountReceived || 0) + standaloneReceived;
        const outstanding = Math.max(0, totals.balanceAmount - received);
        const daysOverdue = getDaysOverdue(inv.date, client.paymentTerms || '30 days');
        const status: 'PAID' | 'PARTIAL' | 'PENDING' | 'OVERDUE' =
          outstanding === 0 ? 'PAID'
          : received > 0 ? 'PARTIAL'
          : daysOverdue > 0 ? 'OVERDUE'
          : 'PENDING';
        return { ...inv, outstanding, received, status, totalAmount: totals.balanceAmount };
      })
      .filter((inv) => statusFilter === 'all' || inv.status === statusFilter)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [savedInvoices, client, searchQ, statusFilter, payments]);

  const summary = useMemo(() => ({
    totalInvoiced: clientInvoices.reduce((s, inv) => s + inv.totalAmount, 0),
    totalReceived: clientInvoices.reduce((s, inv) => s + inv.received, 0),
    totalOutstanding: clientInvoices.reduce((s, inv) => s + inv.outstanding, 0),
    overdue: clientInvoices.filter((i) => i.status === 'OVERDUE').reduce((s, inv) => s + inv.outstanding, 0),
  }), [clientInvoices]);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this invoice? This cannot be undone.')) return;
    setSavedInvoices(savedInvoices.filter((inv) => inv.id !== id));
    deleteInvoice(id);
  };

  return (
    <div>
      {/* Summary Cards */}
      <div className="mini-stats-row">
        <div className="mini-stat">
          <span className="mini-stat-label">Total Invoiced</span>
          <span className="mini-stat-value">{formatCurrencyINR(summary.totalInvoiced)}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Total Received</span>
          <span className="mini-stat-value received-text">{formatCurrencyINR(summary.totalReceived)}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Outstanding</span>
          <span className="mini-stat-value outstanding-text">{formatCurrencyINR(summary.totalOutstanding)}</span>
        </div>
        <div className="mini-stat">
          <span className="mini-stat-label">Overdue</span>
          <span className="mini-stat-value" style={{ color: '#ef4444' }}>{formatCurrencyINR(summary.overdue)}</span>
        </div>
      </div>

      {/* Toolbar */}
      <div className="tab-toolbar">
        <div className="search-bar-row">
          <Search size={14} className="search-bar-icon" />
          <input
            className="search-bar-input"
            placeholder="Search by bill no, LR no…"
            value={searchQ}
            onChange={(e) => setSearchQ(e.target.value)}
          />
        </div>
        <div className="filter-pills">
          {(['all', 'PENDING', 'PARTIAL', 'OVERDUE', 'PAID'] as const).map((s) => (
            <button
              key={s}
              className={`filter-pill ${statusFilter === s ? 'active' : ''}`}
              onClick={() => setStatusFilter(s)}
            >
              {s === 'all' ? 'All' : s}
            </button>
          ))}
        </div>
        <button className="btn-primary" onClick={onCreateInvoice}>
          <Plus size={15} /> New Invoice
        </button>
      </div>

      {/* Table */}
      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>INVOICE NO</th>
              <th>DATE</th>
              <th>LR / REF</th>
              <th>TOTAL AMOUNT</th>
              <th>RECEIVED</th>
              <th>OUTSTANDING</th>
              <th>STATUS</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {clientInvoices.map((inv) => (
              <tr key={inv.id} className="data-table-row clickable" onClick={() => onSelectInvoice?.(inv.id)}>
                <td className="cell-primary">#{inv.billNo}</td>
                <td>{inv.date}</td>
                <td className="cell-secondary">{inv.beNo || '—'}</td>
                <td><span className="cell-amount">{formatCurrencyINR(inv.totalAmount)}</span></td>
                <td><span className="received-text">{formatCurrencyINR(inv.received)}</span></td>
                <td>
                  <span className={`cell-amount ${inv.outstanding > 0 ? 'outstanding-text' : 'received-text'}`}>
                    {formatCurrencyINR(inv.outstanding)}
                  </span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <span className={`status-badge status-${inv.status.toLowerCase()}`}>{inv.status}</span>
                </td>
                <td onClick={(e) => e.stopPropagation()}>
                  <div className="action-buttons">
                    <button
                      className="icon-btn icon-btn-blue"
                      onClick={() => onSelectInvoice?.(inv.id)}
                      title="Open Invoice"
                    >
                      <Edit2 size={13} />
                    </button>
                    <button
                      className="icon-btn icon-btn-red"
                      onClick={() => handleDelete(inv.id)}
                      title="Delete Invoice"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {clientInvoices.length === 0 && (
              <tr>
                <td colSpan={8} className="empty-row">
                  <FileText size={28} />
                  <div>
                    {statusFilter !== 'all'
                      ? `No ${statusFilter} invoices for ${client.name}`
                      : `No invoices yet for ${client.name}`}
                  </div>
                  <button className="btn-primary" onClick={onCreateInvoice}>
                    <Plus size={14} /> Create First Invoice
                  </button>
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};
