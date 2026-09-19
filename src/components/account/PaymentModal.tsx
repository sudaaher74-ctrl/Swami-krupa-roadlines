import React, { useState } from 'react';
import { X, Save, Link } from 'lucide-react';
import type { CustomerRecord, Payment } from '../../types/invoice';
import { useStore } from '../../store/useStore';
import { getInvoiceTotals } from '../../utils/invoiceCalculations';
import { formatCurrencyINR } from '../../utils/accountingService';

interface PaymentModalProps {
  client: CustomerRecord;
  onSave: (payment: Omit<Payment, 'id' | 'createdAt'>) => void;
  onClose: () => void;
  defaultInvoiceId?: string;
}

export const PaymentModal: React.FC<PaymentModalProps> = ({ client, onSave, onClose, defaultInvoiceId }) => {
  const { savedInvoices } = useStore();

  const clientInvoices = savedInvoices.filter(
    (inv) =>
      (inv.customerId === client.id ||
        inv.clientName?.toLowerCase().trim() === client.name?.toLowerCase().trim()) &&
      inv.paymentStatus !== 'PAID'
  );

  const today = new Date().toISOString().slice(0, 10).split('-').reverse().join('-');

  const [form, setForm] = useState({
    paymentDate: today,
    amount: '',
    paymentMode: 'BANK_TRANSFER' as Payment['paymentMode'],
    referenceNumber: '',
    notes: '',
    invoiceId: defaultInvoiceId || '',
  });

  const [errors, setErrors] = useState<Record<string, string>>({});

  const set = (field: string, value: any) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => { const e = { ...prev }; delete e[field]; return e; });
  };

  // When an invoice is selected, suggest the outstanding amount
  const handleInvoiceSelect = (invoiceId: string) => {
    set('invoiceId', invoiceId);
    if (invoiceId) {
      const inv = savedInvoices.find((i) => i.id === invoiceId);
      if (inv) {
        const totals = getInvoiceTotals(inv);
        const outstanding = Math.max(0, totals.balanceAmount - (inv.amountReceived || 0));
        set('amount', outstanding.toString());
      }
    }
  };

  const validate = () => {
    const errs: Record<string, string> = {};
    if (!form.paymentDate) errs.paymentDate = 'Payment date is required';
    if (!form.amount || parseFloat(form.amount) <= 0) errs.amount = 'Enter a valid payment amount';
    return errs;
  };

  const handleSubmit = () => {
    const errs = validate();
    if (Object.keys(errs).length > 0) { setErrors(errs); return; }

    onSave({
      customerId: client.id,
      invoiceId: form.invoiceId || undefined,
      paymentDate: form.paymentDate,
      amount: parseFloat(form.amount),
      paymentMode: form.paymentMode,
      referenceNumber: form.referenceNumber || undefined,
      notes: form.notes || undefined,
      createdBy: 'system',
    });
  };

  const selectedInvoice = form.invoiceId ? savedInvoices.find((i) => i.id === form.invoiceId) : null;
  const invoiceOutstanding = selectedInvoice
    ? Math.max(0, getInvoiceTotals(selectedInvoice).balanceAmount - (selectedInvoice.amountReceived || 0))
    : 0;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-panel" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <div>
            <h2 className="modal-title">Record Payment</h2>
            <p className="modal-subtitle">From: <strong>{client.name}</strong></p>
          </div>
          <button className="modal-close-btn" onClick={onClose}><X size={18} /></button>
        </div>

        <div className="modal-body">
          <div className="form-grid">
            {/* Link to Invoice */}
            <div className="form-group full">
              <label className="form-label">
                <Link size={13} /> Link to Invoice (Optional)
              </label>
              <select
                className="form-select"
                value={form.invoiceId}
                onChange={(e) => handleInvoiceSelect(e.target.value)}
              >
                <option value="">— General Payment (no specific invoice) —</option>
                {clientInvoices.map((inv) => {
                  const totals = getInvoiceTotals(inv);
                  const outstanding = Math.max(0, totals.balanceAmount - (inv.amountReceived || 0));
                  return (
                    <option key={inv.id} value={inv.id}>
                      Bill #{inv.billNo} · {inv.date} · Outstanding: {formatCurrencyINR(outstanding)}
                    </option>
                  );
                })}
              </select>
              {selectedInvoice && (
                <div className="form-hint">
                  Outstanding on this invoice: <strong>{formatCurrencyINR(invoiceOutstanding)}</strong>
                </div>
              )}
            </div>

            {/* Amount */}
            <div className="form-group">
              <label className="form-label">Payment Amount (₹) *</label>
              <input
                className={`form-input ${errors.amount ? 'form-input-error' : ''}`}
                type="number"
                value={form.amount}
                onChange={(e) => set('amount', e.target.value)}
                placeholder="e.g. 20000"
              />
              {errors.amount && <span className="form-error">{errors.amount}</span>}
            </div>

            {/* Date */}
            <div className="form-group">
              <label className="form-label">Payment Date *</label>
              <input
                className={`form-input ${errors.paymentDate ? 'form-input-error' : ''}`}
                type="date"
                value={form.paymentDate.split('-').reverse().join('-')}
                onChange={(e) => set('paymentDate', e.target.value.split('-').reverse().join('-'))}
              />
              {errors.paymentDate && <span className="form-error">{errors.paymentDate}</span>}
            </div>

            {/* Payment Mode */}
            <div className="form-group">
              <label className="form-label">Payment Mode</label>
              <select
                className="form-select"
                value={form.paymentMode}
                onChange={(e) => set('paymentMode', e.target.value)}
              >
                <option value="BANK_TRANSFER">Bank Transfer / NEFT / RTGS</option>
                <option value="UPI">UPI / Google Pay / PhonePe</option>
                <option value="CHEQUE">Cheque</option>
                <option value="CASH">Cash</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            {/* Reference */}
            <div className="form-group">
              <label className="form-label">Reference No. / UTR / Cheque No.</label>
              <input
                className="form-input"
                value={form.referenceNumber}
                onChange={(e) => set('referenceNumber', e.target.value)}
                placeholder="e.g. UTR123456789"
              />
            </div>

            {/* Notes */}
            <div className="form-group full">
              <label className="form-label">Notes</label>
              <textarea
                className="form-textarea"
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
                placeholder="Optional internal notes"
                rows={2}
              />
            </div>
          </div>
        </div>

        <div className="modal-footer">
          <button className="btn-ghost" onClick={onClose}>Cancel</button>
          <button className="btn-primary" onClick={handleSubmit}>
            <Save size={15} />
            Save Payment
          </button>
        </div>
      </div>
    </div>
  );
};
