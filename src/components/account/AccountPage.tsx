import React, { useState } from 'react';
import { BookOpen, CreditCard, AlertCircle, FileText, BarChart3 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord, ActiveView, Payment } from '../../types/invoice';
import { getCustomerSummary, getOutstandingAging, formatCurrencyINR } from '../../utils/accountingService';
import { LedgerView } from './LedgerView';
import { PaymentsTab } from './PaymentsTab';
import { OutstandingTab } from './OutstandingTab';
import { PaymentModal } from './PaymentModal';
import { ClientInvoiceList } from '../billing/ClientInvoiceList';
import { savePayment, saveInvoice } from '../../utils/supabaseService';
import { createPaymentId } from '../../utils/accountingService';

type AccountTab = 'overview' | 'ledger' | 'invoices' | 'payments' | 'outstanding';

interface AccountPageProps {
  client: CustomerRecord;
  onNavigate: (view: ActiveView) => void;
  onCreateInvoice: () => void;
}

export const AccountPage: React.FC<AccountPageProps> = ({ client, onNavigate: _onNavigate, onCreateInvoice }) => {
  const [activeTab, setActiveTab] = useState<AccountTab>('overview');
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const { savedInvoices, payments, setPayments, setSavedInvoices } = useStore();

  const summary = getCustomerSummary(client.id, client, savedInvoices, payments);

  const handleSavePayment = (paymentData: Omit<Payment, 'id' | 'createdAt'>) => {
    const newPayment: Payment = {
      ...paymentData,
      id: createPaymentId(),
      createdAt: new Date().toISOString(),
    };

    const updated = [newPayment, ...payments];
    setPayments(updated);
    savePayment(newPayment);

    // Also update invoice records if linked or allocated
    let updatedInvoices = [...savedInvoices];

    if (paymentData.allocations && paymentData.allocations.length > 0) {
      const allocMap = new Map(paymentData.allocations.map((a) => [a.invoiceId, a]));
      updatedInvoices = updatedInvoices.map((inv) => {
        const alloc = allocMap.get(inv.id);
        if (!alloc) return inv;
        const currentReceived = inv.amountReceived || 0;
        const settledDelta = (alloc.amount || 0) + (alloc.tdsAmount || 0) + (alloc.deductionAmount || 0);
        const newReceived = currentReceived + settledDelta;
        const billTotal = (inv.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0) - (inv.advanceDeduction || 0);
        const updatedInv = {
          ...inv,
          amountReceived: newReceived,
          tdsDeducted: (inv.tdsDeducted || 0) + (alloc.tdsAmount || 0),
          freightDeduction: (inv.freightDeduction || 0) + (alloc.deductionAmount || 0),
          paymentStatus: (newReceived >= billTotal ? 'PAID' : 'PARTIAL') as 'PAID' | 'PARTIAL',
          updatedAt: new Date().toISOString(),
        };
        saveInvoice(updatedInv);
        return updatedInv;
      });
      setSavedInvoices(updatedInvoices);
    } else if (paymentData.invoiceId) {
      updatedInvoices = updatedInvoices.map((inv) => {
        if (inv.id === paymentData.invoiceId) {
          const currentReceived = inv.amountReceived || 0;
          const settledDelta = (paymentData.totalSettled && paymentData.totalSettled > 0)
            ? paymentData.totalSettled
            : (paymentData.amount || 0) + (paymentData.tdsAmount || 0) + (paymentData.deductionAmount || 0);
          const newReceived = currentReceived + settledDelta;
          const billTotal = (inv.items?.reduce((s, i) => s + (Number(i.amount) || 0), 0) || 0) - (inv.advanceDeduction || 0);
          const updatedInv = {
            ...inv,
            amountReceived: newReceived,
            tdsDeducted: (inv.tdsDeducted || 0) + (paymentData.tdsAmount || 0),
            freightDeduction: (inv.freightDeduction || 0) + (paymentData.deductionAmount || 0),
            paymentStatus: (newReceived >= billTotal ? 'PAID' : 'PARTIAL') as 'PAID' | 'PARTIAL',
            updatedAt: new Date().toISOString(),
          };
          saveInvoice(updatedInv);
          return updatedInv;
        }
        return inv;
      });
      setSavedInvoices(updatedInvoices);
    }

    setShowPaymentModal(false);
  };

  const tabs = [
    { id: 'overview' as AccountTab, label: 'Overview', icon: <BarChart3 size={14} /> },
    { id: 'ledger' as AccountTab, label: 'Ledger', icon: <BookOpen size={14} /> },
    { id: 'invoices' as AccountTab, label: 'Invoices', icon: <FileText size={14} /> },
    { id: 'payments' as AccountTab, label: 'Payments', icon: <CreditCard size={14} /> },
    { id: 'outstanding' as AccountTab, label: 'Outstanding', icon: <AlertCircle size={14} /> },
  ];

  return (
    <div className="page-container">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <h1 className="page-title">Account — {client.name}</h1>
          <p className="page-subtitle">Financial overview and transaction history</p>
        </div>
        <button className="btn-primary" onClick={() => setShowPaymentModal(true)}>
          <CreditCard size={15} />
          Record Payment
        </button>
      </div>

      {/* Summary Strip */}
      <div className="account-summary-strip">
        <div className="acs-item">
          <span className="acs-label">INVOICED</span>
          <span className="acs-value">{formatCurrencyINR(summary.totalInvoiced)}</span>
        </div>
        <div className="acs-divider" />
        <div className="acs-item">
          <span className="acs-label">RECEIVED</span>
          <span className="acs-value received-text">{formatCurrencyINR(summary.totalReceived)}</span>
        </div>
        <div className="acs-divider" />
        <div className="acs-item">
          <span className="acs-label">OUTSTANDING</span>
          <span className="acs-value outstanding-text">{formatCurrencyINR(summary.outstanding)}</span>
        </div>
        <div className="acs-divider" />
        <div className="acs-item">
          <span className="acs-label">OVERDUE</span>
          <span className="acs-value" style={{ color: summary.overdueAmount > 0 ? '#ef4444' : '#94a3b8' }}>
            {formatCurrencyINR(summary.overdueAmount)}
          </span>
        </div>
        {(client.creditLimit || 0) > 0 && (
          <>
            <div className="acs-divider" />
            <div className="acs-item">
              <span className="acs-label">CREDIT LIMIT</span>
              <span className="acs-value">{formatCurrencyINR(client.creditLimit || 0)}</span>
            </div>
          </>
        )}
      </div>

      {/* Sub-Tabs */}
      <div className="page-tabs">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            className={`page-tab ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="tab-content">
        {activeTab === 'overview' && (
          <AccountOverview
            client={client}
            summary={summary}
            onTabChange={setActiveTab}
            onRecordPayment={() => setShowPaymentModal(true)}
            onCreateInvoice={onCreateInvoice}
          />
        )}
        {activeTab === 'ledger' && (
          <LedgerView client={client} />
        )}
        {activeTab === 'invoices' && (
          <ClientInvoiceList client={client} onCreateInvoice={onCreateInvoice} />
        )}
        {activeTab === 'payments' && (
          <PaymentsTab client={client} onRecordPayment={() => setShowPaymentModal(true)} />
        )}
        {activeTab === 'outstanding' && (
          <OutstandingTab client={client} onRecordPayment={() => setShowPaymentModal(true)} />
        )}
      </div>

      {showPaymentModal && (
        <PaymentModal
          client={client}
          onSave={handleSavePayment}
          onClose={() => setShowPaymentModal(false)}
        />
      )}
    </div>
  );
};

// ── Account Overview ──────────────────────────────────────────
interface AccountOverviewProps {
  client: CustomerRecord;
  summary: ReturnType<typeof getCustomerSummary>;
  onTabChange: (tab: AccountTab) => void;
  onRecordPayment: () => void;
  onCreateInvoice: () => void;
}

const AccountOverview: React.FC<AccountOverviewProps> = ({
  client, summary, onTabChange, onRecordPayment, onCreateInvoice
}) => {
  const { savedInvoices, payments } = useStore();

  const aging = getOutstandingAging(client.id, client, savedInvoices, payments);

  const clientInvoices = savedInvoices.filter(
    (inv) =>
      inv.customerId === client.id ||
      inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim()
  );

  const lastSix: number[] = [];
  const now = new Date();
  const months: string[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push(d.toLocaleDateString('en-IN', { month: 'short' }));
    let total = 0;
    clientInvoices.forEach((inv) => {
      const parts = inv.date?.split(/[-/]/);
      if (parts?.length === 3) {
        const m = parseInt(parts[1], 10) - 1;
        const y = parseInt(parts[2].length === 2 ? '20' + parts[2] : parts[2], 10);
        if (m === d.getMonth() && y === d.getFullYear()) {
          total += inv.items?.reduce((s, item) => s + (Number(item.amount) || 0), 0) || 0;
        }
      }
    });
    lastSix.push(total);
  }

  const maxBar = Math.max(...lastSix, 1);

  return (
    <div className="account-overview">
      {/* Trend Chart */}
      <div className="card-panel">
        <div className="card-panel-title">Invoice Trend (Last 6 Months)</div>
        <div className="mini-bar-chart">
          {lastSix.map((val, i) => (
            <div key={i} className="mini-bar-group">
              <div className="mini-bar-track">
                <div
                  className="mini-bar-fill"
                  style={{ height: `${Math.round((val / maxBar) * 120)}px` }}
                  title={`${months[i]}: ${formatCurrencyINR(val)}`}
                />
              </div>
              <div className="mini-bar-label">{months[i]}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Aging Analysis */}
      <div className="card-panel">
        <div className="card-panel-title">Aging Analysis (Outstanding: {formatCurrencyINR(aging.total || summary.outstanding)})</div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginTop: '10px' }}>
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>Current</div>
            <div style={{ fontWeight: 600, color: '#10b981', marginTop: '4px' }}>{formatCurrencyINR(aging.current)}</div>
          </div>
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>1 - 30 Days</div>
            <div style={{ fontWeight: 600, color: '#f59e0b', marginTop: '4px' }}>{formatCurrencyINR(aging.days1to30)}</div>
          </div>
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>31 - 60 Days</div>
            <div style={{ fontWeight: 600, color: '#f97316', marginTop: '4px' }}>{formatCurrencyINR(aging.days31to60)}</div>
          </div>
          <div style={{ padding: '10px', background: '#f8fafc', borderRadius: '6px', textAlign: 'center' }}>
            <div style={{ fontSize: '11px', color: '#64748b' }}>60+ Days</div>
            <div style={{ fontWeight: 600, color: '#ef4444', marginTop: '4px' }}>{formatCurrencyINR(aging.days60plus)}</div>
          </div>
        </div>
      </div>

      {/* Quick links */}
      <div className="overview-quick-links">
        <button className="overview-ql-btn" onClick={() => onTabChange('ledger')}>
          <BookOpen size={16} /> View Full Ledger
        </button>
        <button className="overview-ql-btn" onClick={() => onTabChange('outstanding')}>
          <AlertCircle size={16} /> View Outstanding
        </button>
        <button className="overview-ql-btn" onClick={onRecordPayment}>
          <CreditCard size={16} /> Record Payment
        </button>
        <button className="overview-ql-btn" onClick={onCreateInvoice}>
          <FileText size={16} /> Create Invoice
        </button>
      </div>

      {/* Client Info */}
      {client.notes && (
        <div className="card-panel info-box" style={{ marginTop: 0 }}>
          <strong>Note:</strong> {client.notes}
        </div>
      )}
    </div>
  );
};
