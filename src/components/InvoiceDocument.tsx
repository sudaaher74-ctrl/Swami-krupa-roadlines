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
            <span>Email: </span>
            <span
              className="email-link"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('company.email', e.currentTarget.innerText)}
            >
              {company.email}
            </span>
            <span className="contact-divider"> &nbsp;|&nbsp; </span>
            <span>MOB : </span>
            <span
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('company.mobiles', e.currentTarget.innerText)}
            >
              {company.mobiles}
            </span>
          </div>

          <div
            className="invoice-pan-line"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('company.panNo', e.currentTarget.innerText)}
          >
            PAN NO - {company.panNo}
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
        <div className="invoice-meta-section invoice-meta-client-block">
          {/* Left: client name + address + BE NO stacked */}
          <div className="invoice-meta-client-left">
            <div className="invoice-meta-ms-row">
              <span className="meta-label">M/S. </span>
              <span
                className="meta-val-client"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('clientName', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none', display: 'inline-block' }}
              >
                {invoice.clientName || 'ADNISHA TRANSPORT'}
              </span>
            </div>

            {/* Address lines directly below name — always visible */}
            <div className="invoice-meta-address-lines">
              <span
                className="meta-val-address"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('clientAddress', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none', display: 'block', whiteSpace: 'pre-wrap', minHeight: '18px' }}
              >
                {invoice.clientAddress || ''}
              </span>
            </div>

            {/* BE NO row below address */}
            <div className="invoice-meta-beno-row">
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
                <span className="meta-label">{invoice.refDocType || 'BE NO'}</span>
              )}
              <span> :- </span>
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('beNo', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.beNo || '3188241'}
              </span>
              <span className="meta-dt-label"> dt.</span>
              <span
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('beDate', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.beDate || '17/08/2026'}
              </span>
            </div>
          </div>

          {/* Right: BILL NO + DATE stacked */}
          <div className="invoice-meta-client-right">
            <div className="invoice-meta-billno-row">
              <span className="meta-label">BILL NO :- </span>
              <span
                className="meta-val-billno"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('billNo', e.currentTarget.innerText)}
                style={{ outline: isEditableInline ? '1px dashed #999' : 'none' }}
              >
                {invoice.billNo || '122/ 2026-27'}
              </span>
            </div>
            <div className="invoice-meta-date-row">
              <span className="meta-label">DATE :- </span>
              <span
                className="meta-val-date"
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
              <span className="bank-label">BANK NAME : </span>
              <span className="bank-val">{bank.bankName}</span>
            </div>
            <div className="invoice-bank-line">
              <span className="bank-label">BRANCH : </span>
              <span className="bank-val">{bank.branch}</span>
            </div>
            <div className="invoice-bank-line bank-acc-ifsc-row">
              <div>
                <span className="bank-label">ACCOUNT NO : </span>
                <span className="bank-val">{bank.accountNo}</span>
              </div>
              <div>
                <span className="bank-label">IFSC CODE : </span>
                <span className="bank-val">{bank.ifscCode}</span>
              </div>
            </div>
          </div>

          {/* Right: Totals Summary */}
          <div className="invoice-amounts-summary">
            <div className="invoice-amount-row">
              <span className="invoice-amount-label">Bill Total : </span>
              <span className="invoice-amount-val">{formatCurrency(billTotal)}</span>
            </div>
            <div className="invoice-amount-row">
              <span className="invoice-amount-label">Advance : </span>
              <span className="invoice-amount-val">{formatCurrency(advanceAmount)}</span>
            </div>
            <div className="invoice-amount-row">
              <span className="invoice-amount-label">Balance : </span>
              <span className="invoice-amount-val">{formatCurrency(balanceAmount)}</span>
            </div>
          </div>
        </div>

        {/* Rupess in Words */}
        <div className="invoice-words-row">
          <span className="words-label">RUPEES : </span>
          <span className="words-val">{amountInWords}</span>
        </div>

        {/* GST Tax Payable Row */}
        <div className="invoice-gst-row">
          <span className="gst-label">GST TAX PAYABLE BY </span>
          <span className="gst-val">{gstPayableParty}</span>
        </div>

        {/* Terms & Conditions + Signature */}
        <div className="invoice-terms-signature-section">
          {/* Left: Terms */}
          <div className="invoice-terms-left">
            <div className="invoice-eoe">E.&.O.E.</div>
            {company.terms && company.terms.map((term, tIdx) => (
              <div key={tIdx} className="invoice-term-item">
                {term.startsWith(`${tIdx + 1}.`) ? term : `${tIdx + 1}. ${term}`}
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
