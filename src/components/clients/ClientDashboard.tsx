import React, { useMemo } from 'react';
import {
  FileText, ClipboardList, CreditCard, BookOpen,
  Phone, Mail, MapPin,
  ChevronRight, Edit2, MessageSquare
} from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord, ActiveView } from '../../types/invoice';
import { getCustomerSummary, getOutstandingAging, formatCurrencyINR, getDaysOverdue } from '../../utils/accountingService';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';

interface ClientDashboardProps {
  client: CustomerRecord;
  onNavigate: (view: ActiveView) => void;
  onCreateInvoice: () => void;
  onCreateLR: () => void;
  onRecordPayment: () => void;
  onEditClient: () => void;
}

export const ClientDashboard: React.FC<ClientDashboardProps> = ({
  client,
  onNavigate,
  onCreateInvoice,
  onCreateLR,
  onRecordPayment,
  onEditClient,
}) => {
  const { savedInvoices, consignmentNotes, payments } = useStore();

  const summary = useMemo(
    () => getCustomerSummary(client.id, client, savedInvoices, payments),
    [client, savedInvoices, payments]
  );

  const aging = useMemo(
    () => getOutstandingAging(client.id, client, savedInvoices, payments),
    [client, savedInvoices, payments]
  );

  const clientInvoices = useMemo(() =>
    savedInvoices
      .filter((inv) =>
        inv.customerId === client.id ||
        inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
      )
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 5),
    [savedInvoices, client]
  );

  const clientLRs = useMemo(() =>
    consignmentNotes
      .filter((lr) =>
        lr.customerId === client.id ||
        lr.consigneeName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
      )
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3),
    [consignmentNotes, client]
  );

  const clientPayments = useMemo(() =>
    payments
      .filter((p) => p.customerId === client.id)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime())
      .slice(0, 3),
    [payments, client]
  );

  const creditUsedPct = summary.totalInvoiced > 0 && (client.creditLimit || 0) > 0
    ? Math.min(100, Math.round((summary.outstanding / (client.creditLimit || 1)) * 100))
    : 0;

  return (
    <div className="page-container">
      {/* Client Header */}
      <div className="client-dashboard-header">
        <div className="client-dash-avatar">{client.name.charAt(0).toUpperCase()}</div>
        <div className="client-dash-info">
          <div className="client-dash-name-row">
            <h1 className="client-dash-name">{client.name}</h1>
            <span className={`status-badge ${client.status !== 'inactive' ? 'status-active' : 'status-inactive'}`}>
              {client.status !== 'inactive' ? '● ACTIVE' : '○ INACTIVE'}
            </span>
          </div>
          <div className="client-dash-details">
            {client.gstin && <span><FileText size={12} />{client.gstin}</span>}
            {client.phone && <span><Phone size={12} />{client.phone}</span>}
            {client.email && <span><Mail size={12} />{client.email}</span>}
            {(client.city || client.state) && (
              <span><MapPin size={12} />{[client.city, client.state].filter(Boolean).join(', ')}</span>
            )}
          </div>
          {client.notes && (
            <div className="client-dash-notes">
              <MessageSquare size={12} />
              <span>{client.notes}</span>
            </div>
          )}
        </div>
        <button className="btn-ghost-sm" onClick={onEditClient}><Edit2 size={14} /> Edit</button>
      </div>

      {/* Financial Summary Cards */}
      <div className="fin-summary-grid">
        <div className="fin-card fin-card-blue">
          <div className="fin-card-label">TOTAL INVOICED</div>
          <div className="fin-card-value">{formatCurrencyINR(summary.totalInvoiced)}</div>
          <div className="fin-card-sub">{summary.invoiceCount} invoice{summary.invoiceCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="fin-card fin-card-green">
          <div className="fin-card-label">TOTAL RECEIVED</div>
          <div className="fin-card-value">{formatCurrencyINR(summary.totalReceived)}</div>
          <div className="fin-card-sub">{summary.paymentCount} payment{summary.paymentCount !== 1 ? 's' : ''}</div>
        </div>
        <div className="fin-card fin-card-amber">
          <div className="fin-card-label">OUTSTANDING</div>
          <div className="fin-card-value outstanding-text">{formatCurrencyINR(summary.outstanding)}</div>
          <div className="fin-card-sub">Balance due</div>
        </div>
        <div className="fin-card fin-card-red">
          <div className="fin-card-label">OVERDUE</div>
          <div className="fin-card-value">{formatCurrencyINR(summary.overdueAmount)}</div>
          <div className="fin-card-sub">Past due date</div>
        </div>
      </div>

      {/* Credit & Quick Actions Row */}
      <div className="client-dash-row">
        {/* Credit Limit */}
        {(client.creditLimit || 0) > 0 && (
          <div className="card-panel credit-panel">
            <div className="credit-panel-header">
              <span className="card-panel-title">Credit Limit</span>
              <span className="credit-limit-value">{formatCurrencyINR(client.creditLimit || 0)}</span>
            </div>
            <div className="credit-bar-track">
              <div
                className={`credit-bar-fill ${creditUsedPct > 80 ? 'danger' : creditUsedPct > 60 ? 'warning' : ''}`}
                style={{ width: `${creditUsedPct}%` }}
              />
            </div>
            <div className="credit-bar-labels">
              <span>Used: {formatCurrencyINR(summary.outstanding)}</span>
              <span>Available: {formatCurrencyINR(Math.max(0, (client.creditLimit || 0) - summary.outstanding))}</span>
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="card-panel quick-actions-panel">
          <div className="card-panel-title">Quick Actions</div>
          <div className="quick-actions-grid">
            <button className="quick-action-btn" onClick={onCreateInvoice}>
              <FileText size={18} />
              <span>Create Invoice</span>
            </button>
            <button className="quick-action-btn" onClick={onCreateLR}>
              <ClipboardList size={18} />
              <span>Create e-LR</span>
            </button>
            <button className="quick-action-btn" onClick={onRecordPayment}>
              <CreditCard size={18} />
              <span>Record Payment</span>
            </button>
            <button className="quick-action-btn" onClick={() => onNavigate('account')}>
              <BookOpen size={18} />
              <span>View Ledger</span>
            </button>
          </div>
        </div>
      </div>

      {/* Outstanding Aging */}
      {summary.outstanding > 0 && (
        <div className="card-panel aging-panel">
          <div className="card-panel-title">Outstanding Aging</div>
          <div className="aging-grid">
            {[
              { label: 'Current', value: aging.current, color: '#10b981' },
              { label: '1–30 Days', value: aging.days1to30, color: '#f59e0b' },
              { label: '31–60 Days', value: aging.days31to60, color: '#ef4444' },
              { label: '60+ Days', value: aging.days60plus, color: '#dc2626' },
            ].map((bucket) => (
              <div key={bucket.label} className="aging-bucket">
                <div className="aging-bucket-bar-track">
                  <div
                    className="aging-bucket-bar"
                    style={{
                      height: `${aging.total > 0 ? Math.round((bucket.value / aging.total) * 80) : 0}px`,
                      background: bucket.color,
                      minHeight: bucket.value > 0 ? '4px' : '0',
                    }}
                  />
                </div>
                <div className="aging-bucket-amount" style={{ color: bucket.color }}>
                  {formatCurrencyINR(bucket.value)}
                </div>
                <div className="aging-bucket-label">{bucket.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="client-dash-recent-row">
        {/* Recent Invoices */}
        <div className="card-panel recent-panel">
          <div className="card-panel-header">
            <span className="card-panel-title">Recent Invoices</span>
            <button className="see-all-btn" onClick={() => onNavigate('invoice-list')}>
              See all <ChevronRight size={13} />
            </button>
          </div>
          {clientInvoices.length === 0 ? (
            <div className="empty-state-sm">No invoices yet</div>
          ) : (
            clientInvoices.map((inv) => {
              const totals = getInvoiceTotals(inv);
              const received = inv.amountReceived || 0;
              const outstanding = Math.max(0, totals.balanceAmount - received);
              const status = inv.paymentStatus === 'PAID' || outstanding <= 0 ? 'PAID'
                : received > 0 ? 'PARTIAL'
                : getDaysOverdue(inv.date, client.paymentTerms || '30 days') > 0 ? 'OVERDUE'
                : 'PENDING';
              return (
                <div key={inv.id} className="recent-list-item">
                  <div className="recent-item-icon"><FileText size={14} /></div>
                  <div className="recent-item-content">
                    <div className="recent-item-title">Bill #{inv.billNo}</div>
                    <div className="recent-item-date">{inv.date}</div>
                  </div>
                  <div className="recent-item-right">
                    <div className="recent-item-amount">{formatCurrencyINR(totals.balanceAmount)}</div>
                    <span className={`status-badge-sm status-${status.toLowerCase()}`}>{status}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Recent e-LRs */}
        <div className="card-panel recent-panel">
          <div className="card-panel-header">
            <span className="card-panel-title">Recent e-LRs</span>
            <button className="see-all-btn" onClick={() => onNavigate('lr-list')}>
              See all <ChevronRight size={13} />
            </button>
          </div>
          {clientLRs.length === 0 ? (
            <div className="empty-state-sm">No e-LRs yet</div>
          ) : (
            clientLRs.map((lr) => (
              <div key={lr.id} className="recent-list-item">
                <div className="recent-item-icon"><ClipboardList size={14} /></div>
                <div className="recent-item-content">
                  <div className="recent-item-title">LR #{lr.lrNo}</div>
                  <div className="recent-item-date">{lr.date} · {lr.fromLocation} → {lr.toLocation}</div>
                </div>
                <div className="recent-item-right">
                  <div className="recent-item-amount">{lr.vehicleNo || '—'}</div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Recent Payments */}
        <div className="card-panel recent-panel">
          <div className="card-panel-header">
            <span className="card-panel-title">Recent Payments</span>
            <button className="see-all-btn" onClick={() => onNavigate('account')}>
              See all <ChevronRight size={13} />
            </button>
          </div>
          {clientPayments.length === 0 ? (
            <div className="empty-state-sm">No payments recorded</div>
          ) : (
            clientPayments.map((pay) => (
              <div key={pay.id} className="recent-list-item">
                <div className="recent-item-icon green"><CreditCard size={14} /></div>
                <div className="recent-item-content">
                  <div className="recent-item-title">Payment Received</div>
                  <div className="recent-item-date">{pay.paymentDate} · {pay.paymentMode?.replace('_', ' ')}</div>
                </div>
                <div className="recent-item-right">
                  <div className="recent-item-amount received-text">{formatCurrencyINR(pay.amount)}</div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};
