import React from 'react';
import type { InvoiceData } from '../types/invoice';
import { numberToIndianWords, formatCurrency } from '../utils/numberToWords';

interface InvoiceDocumentProps {
  invoice: InvoiceData;
  isEditableInline?: boolean;
  onUpdateField?: (field: string, value: any) => void;
}

export const InvoiceDocument: React.FC<InvoiceDocumentProps> = ({
  invoice,
  isEditableInline = false,
  onUpdateField,
}) => {
  const { company, bank, items } = invoice;

  // Calculations
  const billTotal = items.reduce((sum, item) => sum + (Number(item.amount) || 0), 0);
  const advanceAmount = Number(invoice.advanceDeduction) || 0;
  const balanceAmount = billTotal - advanceAmount;

  const amountInWords =
    invoice.customAmountInWords ||
    (balanceAmount > 0 ? numberToIndianWords(balanceAmount) : numberToIndianWords(billTotal));

  const gstPayableParty = invoice.customGstPayableBy || invoice.clientName || 'ADNISHA TRANSPORT';

  // Calculate filler rows to ensure tall physical table appearance
  const totalDisplayRows = Math.max(12, items.length + 1);
  const fillerCount = Math.max(0, totalDisplayRows - items.length);

  const handleTextChange = (field: string, val: string) => {
    if (onUpdateField) {
      onUpdateField(field, val);
    }
  };

  return (
    <div className="invoice-paper" id="invoice-printable-doc">
      <div className="invoice-frame">
        {/* Jurisdiction */}
        <div
          className="invoice-top-jurisdiction"
          contentEditable={isEditableInline}
          suppressContentEditableWarning
          onBlur={(e) => handleTextChange('company.jurisdiction', e.currentTarget.innerText)}
        >
          {company.jurisdiction || 'Subject To Navi Mumbai Jurisdiction'}
        </div>

        {/* Company Header */}
        <div className="invoice-header-section">
          <h1
            className="invoice-company-title"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('company.companyName', e.currentTarget.innerText)}
          >
            {company.companyName}
          </h1>

          <div
            className="invoice-company-tagline"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('company.tagline', e.currentTarget.innerText)}
          >
            {company.tagline}
          </div>

          <div
            className="invoice-address-line"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('company.addressLine1', e.currentTarget.innerText)}
          >
            {company.addressLine1}
          </div>

          <div
            className="invoice-address-line"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('company.addressLine2', e.currentTarget.innerText)}
          >
            {company.addressLine2}
          </div>

          <div className="invoice-contact-line">
            Email- <span
              className="email-link"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('company.email', e.currentTarget.innerText)}
            >
              {company.email}
            </span>
            &nbsp; MOB :-
            <span
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('company.mobiles', e.currentTarget.innerText)}
            >
              {company.mobiles}.
            </span>
          </div>

          <div
            className="invoice-pan-line"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('company.panNo', e.currentTarget.innerText)}
          >
            PAN NO-{company.panNo}.
          </div>
        </div>

        {/* TAX INVOICE Title */}
        <div
          className="invoice-title-bar"
          contentEditable={isEditableInline}
          suppressContentEditableWarning
          onBlur={(e) => handleTextChange('title', e.currentTarget.innerText)}
        >
          {invoice.title || 'TAX INVOICE'}
        </div>

        {/* Invoice Metadata Section */}
        <div className="invoice-meta-section">
          {/* Row 1: MS & BILL NO */}
          <div className="invoice-meta-row">
            <div className="invoice-meta-left">
              MS :&nbsp;
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('clientName', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none', minWidth: '150px', display: 'inline-block' }}
              >
                {invoice.clientName || 'ADNISHA TRANSPORT'}
              </span>
            </div>
            <div className="invoice-meta-right">
              BILL NO :-&nbsp;
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('billNo', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.billNo || '122/ 2026-27'}
              </span>
            </div>
          </div>

          {/* Row 2: BE NO / INVOICE NO & DATE */}
          <div className="invoice-meta-row">
            <div className="invoice-meta-left">
              {isEditableInline ? (
                <span
                  className="doc-ref-badge-inline"
                  title="Click to switch between BE NO and INVOICE NO"
                  onClick={() => {
                    const next = (invoice.refDocType || 'BE NO') === 'BE NO' ? 'INVOICE NO' : 'BE NO';
                    handleTextChange('refDocType', next);
                  }}
                  style={{
                    cursor: 'pointer',
                    userSelect: 'none',
                    borderBottom: '1px dotted #2563eb',
                    fontWeight: 700,
                  }}
                >
                  {invoice.refDocType || 'BE NO'}
                </span>
              ) : (
                <span>{invoice.refDocType || 'BE NO'}</span>
              )}
              &nbsp;:-&nbsp;
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('beNo', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.beNo || '3188241'}
              </span>
              &nbsp;dt.
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('beDate', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.beDate || '17/08/2026'}
              </span>
            </div>
            <div className="invoice-meta-right">
              DATE :-&nbsp;&nbsp;&nbsp;
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('date', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.date || '22-08-2026'}
              </span>
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="invoice-table-wrapper">
          <table className="invoice-table">
            <thead>
              <tr>
                <th className="col-sn">S.N.</th>
                <th className="col-date">Date</th>
                <th className="col-vehicle">Vehicle No.</th>
                <th className="col-container">Container No</th>
                <th className="col-particulars th-particulars">P A R T I C U L A R S</th>
                <th className="col-weight">Weight</th>
                <th className="col-advance">Advance</th>
                <th className="col-amount">Amount</th>
              </tr>
            </thead>
            <tbody>
              {/* Active Item Rows */}
              {items.map((item, idx) => (
                <tr key={item.id || idx} style={{ minHeight: '28px' }}>
                  <td className="col-sn text-center">{item.sn || (idx === 0 ? '1' : '')}</td>
                  <td className="col-date text-center">{item.date}</td>
                  <td className="col-vehicle text-center">{item.vehicleNo}</td>
                  <td className="col-container text-center container-cell">{item.containerNo}</td>
                  <td className="col-particulars text-center">{item.particulars}</td>
                  <td className="col-weight text-center">{item.weight}</td>
                  <td className="col-advance text-center">{item.advance}</td>
                  <td className="col-amount text-right">
                    {item.amount !== '' && item.amount !== undefined
                      ? formatCurrency(item.amount)
                      : ''}
                  </td>
                </tr>
              ))}

              {/* Empty filler rows to maintain tall vertical grid columns */}
              {Array.from({ length: fillerCount }).map((_, fIdx) => (
                <tr key={`filler-${fIdx}`} style={{ height: '26px' }}>
                  <td className="col-sn">&nbsp;</td>
                  <td className="col-date">&nbsp;</td>
                  <td className="col-vehicle">&nbsp;</td>
                  <td className="col-container">&nbsp;</td>
                  <td className="col-particulars">&nbsp;</td>
                  <td className="col-weight">&nbsp;</td>
                  <td className="col-advance">&nbsp;</td>
                  <td className="col-amount">&nbsp;</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Footer Section with Bank & Amounts */}
        <div className="invoice-footer-grid">
          {/* Left: Bank Details */}
          <div className="invoice-bank-details">
            <div className="invoice-bank-line">
              BANK NAME : {bank.bankName}
            </div>
            <div className="invoice-bank-line">
              BRANCH : {bank.branch}
            </div>
            <div className="invoice-bank-line">
              ACCOUNT NO :{bank.accountNo}&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;IFSC CODE :{bank.ifscCode}
            </div>
          </div>

          {/* Right: Totals Summary */}
          <div className="invoice-amounts-summary">
            <div className="invoice-amount-row">
              <span className="invoice-amount-label">Bill Total :-</span>
              <span className="invoice-amount-val">{formatCurrency(billTotal)}</span>
            </div>
            <div className="invoice-amount-row">
              <span className="invoice-amount-label">Advance :-</span>
              <span className="invoice-amount-val">{formatCurrency(advanceAmount)}</span>
            </div>
            <div className="invoice-amount-row">
              <span className="invoice-amount-label">Balance :-</span>
              <span className="invoice-amount-val">{formatCurrency(balanceAmount)}</span>
            </div>
          </div>
        </div>

        {/* Rupess in Words */}
        <div className="invoice-words-row">
          Rupess : {amountInWords}
        </div>

        {/* GST Tax Payable Row */}
        <div className="invoice-gst-row">
          GST TAX PAYABLE BY {gstPayableParty}
        </div>

        {/* Terms & Conditions + Signature */}
        <div className="invoice-terms-signature-section">
          {/* Left: Terms */}
          <div className="invoice-terms-left">
            <div className="invoice-eoe">E.&.O.E</div>
            {company.terms && company.terms.map((term, tIdx) => (
              <div key={tIdx} className="invoice-term-item">
                {tIdx + 1}. {term}
              </div>
            ))}
          </div>

          {/* Right: Signature Area */}
          <div className="invoice-signature-right">
            <div className="invoice-for-company">
              {company.signatureForText || `For ${company.companyName}`}
            </div>
            <div className="invoice-proprietor">
              {company.proprietorText || 'Proprietor'}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
