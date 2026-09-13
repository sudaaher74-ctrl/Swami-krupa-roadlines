import React, { useMemo } from 'react';
import type { InvoiceData } from '../types/invoice';
import { 
  getInvoiceTotals
} from '../utils/invoiceCalculations';
import { formatCurrency, numberToIndianWords } from '../utils/numberToWords';
import { 
  MapPin, 
  Mail, 
  Phone, 
  FileText, 
  ShieldCheck, 
  Clock, 
  Users, 
  Calendar, 
  User, 
  Landmark, 
  Calculator,
  Globe
} from 'lucide-react';
import defaultLogo from '../logo.png';
import '../styles/modern-invoice.css';

interface ModernInvoiceDocumentProps {
  invoice: InvoiceData;
  isEditableInline?: boolean;
  onUpdateField?: (field: string, val: string) => void;
}

export const ModernInvoiceDocument: React.FC<ModernInvoiceDocumentProps> = ({
  invoice,
  isEditableInline = false,
  onUpdateField,
}) => {
  const { billTotal, advanceAmount, balanceAmount } = getInvoiceTotals(invoice);

  const amountInWords = useMemo(() => {
    if (invoice.customAmountInWords) return invoice.customAmountInWords;
    return (numberToIndianWords(balanceAmount)).toUpperCase();
  }, [balanceAmount, invoice.customAmountInWords]);

  const gstPayableParty = invoice.customGstPayableBy || invoice.clientName || 'CLIENT TRANSPORT';

  const fillerCount = Math.max(0, 5 - invoice.items.length);
  const items = invoice.items || [];
  const company = invoice.company;
  const bank = invoice.bank;

  const handleTextChange = (field: string, val: string) => {
    if (onUpdateField) {
      onUpdateField(field, val);
    }
  };

  return (
    <div className="modern-invoice-container a4-page">
      {/* 1. Header Section */}
      <header className="mod-header">
        <div className="mod-header-left">
          {/* Logo Area */}
          <div className="mod-logo-box">
            <img src={company.logoUrl || defaultLogo} alt="Logo" className="mod-logo-img" />
          </div>
          
          <div className="mod-header-details">
            <h3 className="mod-tagline">{company.tagline || 'FLEET OWNERS & TRANSPORT CONTRACTORS'}</h3>
            <div className="mod-contact-row">
              <MapPin size={14} className="mod-icon" />
              <span>{company.addressLine1}, {company.addressLine2}</span>
            </div>
            <div className="mod-contact-row">
              <Mail size={14} className="mod-icon" />
              <span>{company.email}</span>
            </div>
            <div className="mod-contact-row">
              <Phone size={14} className="mod-icon" />
              <span>{company.mobiles}</span>
            </div>
            <div className="mod-contact-row">
              <FileText size={14} className="mod-icon" />
              <span>PAN No: {company.panNo}</span>
            </div>
          </div>
        </div>

        {/* Top Right Graphic Placeholder */}
        <div className="mod-header-right-graphic">
          <div className="mod-graphic-text">
            Delivering<br />Trust<br />Every Mile
            <div className="mod-orange-line"></div>
          </div>
          <div className="mod-graphic-overlay"></div>
        </div>
      </header>

      {/* 2. Features Banner */}
      <div className="mod-features-banner">
        <div className="mod-feature-item">
          <ShieldCheck size={18} />
          <span>SAFE<br/>TRANSPORT</span>
        </div>
        <div className="mod-feature-item">
          <Clock size={18} />
          <span>ON TIME<br/>DELIVERY</span>
        </div>
        <div className="mod-feature-item">
          <Users size={18} />
          <span>YOUR BUSINESS<br/>OUR PRIORITY</span>
        </div>
      </div>

      {/* 3. Title & Meta Row */}
      <div className="mod-title-meta-row">
        <div className="mod-slogan">
          TRANSPORTING<br/>YOUR BUSINESS<br/>FORWARD
        </div>
        <div className="mod-main-title">
          <span className="mod-title-dark">TAX </span>
          <span className="mod-title-orange">INVOICE</span>
        </div>
        <div className="mod-meta-box">
          <div className="mod-meta-item">
            <FileText size={16} className="mod-meta-icon" />
            <span className="mod-meta-label">Invoice No.</span>
            <span className="mod-meta-colon">:</span>
            <span 
              className="mod-meta-val"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('billNo', e.currentTarget.innerText)}
            >{invoice.billNo}</span>
          </div>
          <div className="mod-meta-item">
            <Calendar size={16} className="mod-meta-icon" />
            <span className="mod-meta-label">Invoice Date</span>
            <span className="mod-meta-colon">:</span>
            <span 
              className="mod-meta-val"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('date', e.currentTarget.innerText)}
            >{invoice.date}</span>
          </div>
        </div>
      </div>

      {/* 4. Bill To Box */}
      <div className="mod-billto-box">
        <div className="mod-billto-icon">
          <User size={24} color="#fff" />
        </div>
        <div className="mod-billto-content">
          <div className="mod-billto-label">Bill To</div>
          <div 
            className="mod-billto-name"
            contentEditable={isEditableInline}
            suppressContentEditableWarning
            onBlur={(e) => handleTextChange('clientName', e.currentTarget.innerText)}
          >{invoice.clientName}</div>
          <div className="mod-billto-refs">
            <span>{invoice.refDocType || 'BE NO'}.: </span>
            <span 
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('beNo', e.currentTarget.innerText)}
            >{invoice.beNo}</span>
            <span className="mod-divider">|</span>
            <span>Date: </span>
            <span
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('beDate', e.currentTarget.innerText)}
            >{invoice.beDate}</span>
          </div>
        </div>
      </div>

      {/* 5. Main Table */}
      <div className="mod-table-container">
        <table className="mod-table">
          <thead>
            <tr>
              <th className="mod-th-sn">S.No.</th>
              <th className="mod-th-date">Date</th>
              <th className="mod-th-vehicle">Vehicle No.</th>
              <th className="mod-th-container">Container No.</th>
              <th className="mod-th-particulars">Particulars</th>
              <th className="mod-th-weight">Weight</th>
              <th className="mod-th-advance">Advance</th>
              <th className="mod-th-amount">Amount</th>
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => (
              <tr key={item.id || idx}>
                <td className="mod-td-sn">{item.sn || (idx === 0 ? '1' : '')}</td>
                <td className="mod-td-center">{item.date}</td>
                <td className="mod-td-center">{item.vehicleNo}</td>
                <td className="mod-td-center mod-pre-wrap">{item.containerNo}</td>
                <td className="mod-td-left">{item.particulars}</td>
                <td className="mod-td-center">{item.weight}</td>
                <td className="mod-td-right">
                  {item.advance && Number(item.advance.replace(/,/g, '')) > 0
                    ? formatCurrency(Number(item.advance.replace(/,/g, '')))
                    : item.advance}
                </td>
                <td className="mod-td-right">
                  {item.amount !== '' && item.amount !== undefined
                    ? formatCurrency(item.amount)
                    : ''}
                </td>
              </tr>
            ))}
            {/* Filler rows */}
            {Array.from({ length: fillerCount }).map((_, fIdx) => (
              <tr key={`filler-${fIdx}`} className="mod-filler-row">
                <td></td><td></td><td></td><td></td><td></td><td></td><td></td><td></td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 6. Bank & Summary */}
      <div className="mod-bank-summary-row">
        <div className="mod-bank-card">
          <div className="mod-card-header">
            <div className="mod-card-icon-wrapper"><Landmark size={20} color="#fff" /></div>
            <h4>Bank Details</h4>
          </div>
          <div className="mod-bank-grid">
            <div className="mod-lbl">Bank Name</div><div className="mod-col">:</div><div className="mod-val">{bank.bankName}</div>
            <div className="mod-lbl">Branch</div><div className="mod-col">:</div><div className="mod-val">{bank.branch}</div>
            <div className="mod-lbl">Account No.</div><div className="mod-col">:</div><div className="mod-val">{bank.accountNo}</div>
            <div className="mod-lbl">IFSC Code</div><div className="mod-col">:</div><div className="mod-val">{bank.ifscCode}</div>
          </div>
          <div className="mod-bank-watermark">
            <Landmark size={120} color="rgba(15, 61, 50, 0.05)" />
          </div>
        </div>

        <div className="mod-summary-card">
          <div className="mod-card-header">
            <div className="mod-card-icon-wrapper"><Calculator size={20} color="#fff" /></div>
            <h4>Invoice Summary</h4>
          </div>
          <div className="mod-summary-grid">
            <div className="mod-lbl">Bill Total</div><div className="mod-col">:</div><div className="mod-val">₹ {formatCurrency(billTotal)}</div>
            <div className="mod-lbl">Advance</div><div className="mod-col">:</div><div className="mod-val">₹ {formatCurrency(advanceAmount)}</div>
          </div>
          <div className="mod-summary-balance">
            <div className="mod-lbl">Balance</div><div className="mod-col">:</div><div className="mod-val">₹ {formatCurrency(balanceAmount)}</div>
          </div>
        </div>
      </div>

      {/* 7. Amount in Words */}
      <div className="mod-words-box">
        <span className="mod-lbl">Amount in Words</span>
        <span className="mod-col">:</span>
        <span className="mod-val">{amountInWords}</span>
      </div>

      {/* 8. GST Payable By */}
      <div className="mod-words-box mod-gst-box">
        <span className="mod-lbl">GST Tax Payable By</span>
        <span className="mod-col">:</span>
        <span className="mod-val">{gstPayableParty}</span>
      </div>

      {/* 9. Footer Terms & Signature */}
      <div className="mod-footer-section">
        <div className="mod-terms-area">
          <div className="mod-terms-header">
            <div className="mod-terms-icon-wrapper"><FileText size={18} color="#fff" /></div>
            <h4>Terms & Conditions</h4>
          </div>
          <div className="mod-terms-list">
            <div className="mod-terms-line"></div>
            <ol>
              {company.terms && company.terms.map((term, tIdx) => {
                const text = term.replace(/^\d+\.\s*/, ''); // remove existing numbering if any
                return <li key={tIdx}>{text}</li>
              })}
            </ol>
          </div>
        </div>
        
        <div className="mod-signature-area">
          <div className="mod-sig-for">{company.signatureForText || `FOR SWAMI KRUPA ROADLINES`}</div>
          <div className="mod-sig-space">
             {/* Signature placeholder line simulating pen stroke */}
             <div className="mod-sig-stroke"></div>
          </div>
          <div className="mod-sig-line"></div>
          <div className="mod-sig-proprietor">{company.proprietorText || 'Proprietor'}</div>
        </div>
      </div>

      {/* 10. Very Bottom Graphic */}
      <div className="mod-bottom-graphic">
        <div className="mod-bottom-left">
          <MapPin size={16} color="#f97316" />
          <div className="mod-bottom-text">
            <span>Navi Mumbai</span>
            <span className="mod-bottom-sub">MAHARASHTRA, INDIA</span>
          </div>
        </div>
        <div className="mod-bottom-center">
          <Globe size={16} color="#f97316" />
          <span>www.swamikruparoadlines.in</span>
        </div>
        <div className="mod-bottom-right">
          <span className="mod-cursive-text">More Than Transport</span>
          <span className="mod-stronger-text">A STRONGER TOMORROW</span>
        </div>
        <div className="mod-bottom-overlay"></div>
      </div>
    </div>
  );
};
