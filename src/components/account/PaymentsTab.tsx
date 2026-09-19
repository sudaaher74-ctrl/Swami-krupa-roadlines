import React, { useMemo } from 'react';
import { CreditCard, Plus, Trash2 } from 'lucide-react';
import { useStore } from '../../store/useStore';
import type { CustomerRecord } from '../../types/invoice';
import { formatCurrencyINR } from '../../utils/accountingService';
import { deletePayment } from '../../utils/supabaseService';

interface PaymentsTabProps {
  client: CustomerRecord;
  onRecordPayment: () => void;
}

const MODE_LABELS: Record<string, string> = {
  BANK_TRANSFER: 'Bank Transfer',
  UPI: 'UPI',
  CHEQUE: 'Cheque',
  CASH: 'Cash',
  OTHER: 'Other',
};

export const PaymentsTab: React.FC<PaymentsTabProps> = ({ client, onRecordPayment }) => {
  const { payments, setPayments, savedInvoices } = useStore();

  const clientPayments = useMemo(() =>
    payments
      .filter((p) => p.customerId === client.id)
      .sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime()),
    [payments, client]
  );

  const totalReceived = clientPayments.reduce((s, p) => s + p.amount, 0);

  const handleDelete = (id: string) => {
    if (!window.confirm('Delete this payment? This will affect outstanding calculations.')) return;
    setPayments(payments.filter((p) => p.id !== id));
    deletePayment(id);
  };

  const getInvoiceBillNo = (invoiceId: string | undefined) => {
    if (!invoiceId) return null;
    return savedInvoices.find((inv) => inv.id === invoiceId)?.billNo || null;
  };

  if (clientPayments.length === 0) {
    return (
      <div className="empty-state">
        <CreditCard size={40} />
        <h3>No Payments Recorded</h3>
        <p>Record the first payment from {client.name}</p>
        <button className="btn-primary" onClick={onRecordPayment}>
          <Plus size={15} /> Record Payment
        </button>
      </div>
    );
  }

  return (
    <div>
      <div className="tab-toolbar">
        <div className="tab-toolbar-info">
          <span className="stat-inline">Total Received: <strong className="received-text">{formatCurrencyINR(totalReceived)}</strong></span>
          <span className="stat-inline">{clientPayments.length} payment{clientPayments.length !== 1 ? 's' : ''}</span>
        </div>
        <button className="btn-primary" onClick={onRecordPayment}>
          <Plus size={15} /> Record Payment
        </button>
      </div>

      <div className="data-table-wrapper">
        <table className="data-table">
          <thead>
            <tr>
              <th>DATE</th>
              <th>AMOUNT</th>
              <th>MODE</th>
              <th>REFERENCE</th>
              <th>AGAINST INVOICE</th>
              <th>NOTES</th>
              <th>ACTIONS</th>
            </tr>
          </thead>
          <tbody>
            {clientPayments.map((pay) => {
              const billNo = getInvoiceBillNo(pay.invoiceId);
              return (
                <tr key={pay.id} className="data-table-row">
                  <td>{pay.paymentDate}</td>
                  <td>
                    <span className="cell-amount received-text">{formatCurrencyINR(pay.amount)}</span>
                  </td>
                  <td>
                    <span className="mode-badge">{MODE_LABELS[pay.paymentMode] || pay.paymentMode}</span>
                  </td>
                  <td>{pay.referenceNumber || '—'}</td>
                  <td>{billNo ? `Bill #${billNo}` : '—'}</td>
                  <td className="cell-secondary truncate">{pay.notes || '—'}</td>
                  <td>
                    <button
                      className="icon-btn icon-btn-red"
                      onClick={() => handleDelete(pay.id)}
                      title="Delete Payment"
                    >
                      <Trash2 size={13} />
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
};
