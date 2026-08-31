import React from 'react';
import type { ConsignmentNote } from '../types/invoice';
import { formatCurrency } from '../utils/numberToWords';

interface ConsignmentNoteDocumentProps {
  note: ConsignmentNote;
  isEditableInline?: boolean;
  onUpdateField?: (field: string, value: any) => void;
}

export const ConsignmentNoteDocument: React.FC<ConsignmentNoteDocumentProps> = ({
  note,
  isEditableInline = false,
  onUpdateField,
}) => {
  const { company } = note;

  const handleTextChange = (field: string, val: string) => {
    if (onUpdateField) {
      onUpdateField(field, val);
    }
  };

  return (
    <div className="consignment-note-paper" id="consignment-printable-doc">
      <div className="consignment-frame">
        {/* Top Jurisdiction & Document Title */}
        <div className="cn-top-bar">
          <div className="cn-jurisdiction">
            {company.jurisdiction || 'Subject to Navi Mumbai Jurisdiction'}
          </div>
          <div className="cn-doc-main-title">GOODS CONSIGNMENT NOTE</div>
        </div>

        {/* Company Header Block */}
        <div className="cn-header-grid">
          <div className="cn-brand-section">
            <div className="cn-brand-logo-title-wrap">
              <div className="cn-logo-icon">🚛</div>
              <div className="cn-brand-text">
                <h1
                  className="cn-company-name"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('company.companyName', e.currentTarget.innerText)}
                >
                  {company.companyName}
                </h1>
                <div
                  className="cn-tagline"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('company.tagline', e.currentTarget.innerText)}
                >
                  {company.tagline}
                </div>
              </div>
            </div>
          </div>

          <div className="cn-branch-box">
            <div className="cn-branch-title">
              BRANCH :- {note.branchName || 'NAVI MUMBAI (PANVEL) BRANCH'}
            </div>
            <div className="cn-branch-address">
              Shop No 5, Ground Floor, Maheshwar Villa, Plot No 30, Sector 5A,
              <br />
              New Panvel, Navi Mumbai (Maharashtra) - 410206
              <br />
              Phone : {company.mobiles}
            </div>
          </div>
        </div>

        {/* ID, PAN, GC Note No, Date, Vehicle No Row */}
        <div className="cn-meta-bar-grid">
          <div className="cn-meta-id-pan">
            <div className="cn-meta-line">
              <span className="cn-meta-lbl">ID / GSTIN : </span>
              <span className="cn-meta-val">27AAAP... (TRANSPORT)</span>
            </div>
            <div className="cn-meta-line">
              <span className="cn-meta-lbl">PAN : </span>
              <span className="cn-meta-val">{company.panNo}</span>
            </div>
          </div>

          <div className="cn-meta-gc-no">
            <span className="cn-meta-lbl">G. C. Note No : </span>
            <div className="cn-lr-badge">
              <span className="cn-lr-symbol">№</span>
              <span
                className="cn-lr-num"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('lrNo', e.currentTarget.innerText)}
              >
                {note.lrNo || '025992'}
              </span>
            </div>
          </div>

          <div className="cn-meta-date">
            <span className="cn-meta-lbl">Date : </span>
            <span
              className="cn-meta-val-date"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('date', e.currentTarget.innerText)}
            >
              {note.date || '24/08/2026'}
            </span>
          </div>

          <div className="cn-meta-vehicle">
            <span className="cn-meta-lbl">Vehicle No. : </span>
            <span
              className="cn-meta-val-vehicle"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('vehicleNo', e.currentTarget.innerText)}
            >
              {note.vehicleNo || 'MH46CL8146'}
            </span>
          </div>
        </div>

        {/* Consignor Details Row */}
        <div className="cn-party-row">
          <div className="cn-party-left">
            <span className="cn-field-lbl">Consignor : </span>
            <div className="cn-party-name-addr">
              <span
                className="cn-party-name"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('consignorName', e.currentTarget.innerText)}
              >
                {note.consignorName || 'M/s Alembic Pharmaceuticals LTD'}
              </span>
              <span
                className="cn-party-addr"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('consignorAddress', e.currentTarget.innerText)}
              >
                {note.consignorAddress || 'Nhava Sheva Mumbai Allcargo CFS'}
              </span>
            </div>
          </div>
          <div className="cn-party-mid">
            <span className="cn-field-lbl">Consignor GST No.: </span>
            <span
              className="cn-gst-val"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('consignorGst', e.currentTarget.innerText)}
            >
              {note.consignorGst || '-'}
            </span>
          </div>
          <div className="cn-party-right">
            <span className="cn-field-lbl">From : </span>
            <span
              className="cn-route-val"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('fromLocation', e.currentTarget.innerText)}
            >
              {note.fromLocation || 'N/Shiva'}
            </span>
          </div>
        </div>

        {/* Consignee Details Row */}
        <div className="cn-party-row">
          <div className="cn-party-left">
            <span className="cn-field-lbl">Consignee : </span>
            <div className="cn-party-name-addr">
              <span
                className="cn-party-name"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('consigneeName', e.currentTarget.innerText)}
              >
                {note.consigneeName || 'M/s Alembic Pharmaceuticals LTD'}
              </span>
              <span
                className="cn-party-addr"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('consigneeAddress', e.currentTarget.innerText)}
              >
                {note.consigneeAddress || 'F4 Jarod, Vadodara, Gujarat'}
              </span>
            </div>
          </div>
          <div className="cn-party-mid">
            <span className="cn-field-lbl">Consignee GST No.: </span>
            <span
              className="cn-gst-val"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('consigneeGst', e.currentTarget.innerText)}
            >
              {note.consigneeGst || '24AAATCA5591M1Z9'}
            </span>
          </div>
          <div className="cn-party-right">
            <span className="cn-field-lbl">To : </span>
            <span
              className="cn-route-val"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('toLocation', e.currentTarget.innerText)}
            >
              {note.toLocation || 'Jarod'}
            </span>
          </div>
        </div>

        {/* Main Body Grid: Items, Freight & Documents */}
        <div className="cn-main-grid">
          {/* Col 1: Pkgs */}
          <div className="cn-col-pkgs">
            <div className="cn-col-header">
              No.
              <br />
              of
              <br />
              Pkgs.
            </div>
            <div
              className="cn-cell-body text-center"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('packagesCount', e.currentTarget.innerText)}
            >
              {note.packagesCount || '1X20'}
            </div>
          </div>

          {/* Col 2: Description (Said to Contain) */}
          <div className="cn-col-desc">
            <div className="cn-col-header">
              Description
              <br />
              (Said to Contain)
            </div>
            <div className="cn-cell-body cn-desc-body">
              <div
                className="cn-desc-main"
                contentEditable={isEditableInline}
                suppressContentEditableWarning
                onBlur={(e) => handleTextChange('description', e.currentTarget.innerText)}
              >
                {note.description || 'Flowlac-100 Lactose'}
              </div>
              {note.containerNo && (
                <div
                  className="cn-desc-container"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('containerNo', e.currentTarget.innerText)}
                >
                  Contnr. {note.containerNo}
                </div>
              )}
              {note.poNumber && (
                <div
                  className="cn-desc-po"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('poNumber', e.currentTarget.innerText)}
                >
                  {note.poNumber}
                </div>
              )}
            </div>
          </div>

          {/* Col 3: Sender Weight */}
          <div className="cn-col-sender-wt">
            <div className="cn-col-header">
              Sender
              <br />
              Weight
            </div>
            <div
              className="cn-cell-body text-center"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('senderWeight', e.currentTarget.innerText)}
            >
              {note.senderWeight || '1X20\nContainer\nLoad'}
            </div>
          </div>

          {/* Col 4: Weight Charges */}
          <div className="cn-col-wt-charges">
            <div className="cn-col-header">
              Weight
              <br />
              Charges
            </div>
            <div
              className="cn-cell-body text-center"
              contentEditable={isEditableInline}
              suppressContentEditableWarning
              onBlur={(e) => handleTextChange('weightCharges', e.currentTarget.innerText)}
            >
              {note.weightCharges || ''}
            </div>
          </div>

          {/* Col 5: Freight & Breakdown Table */}
          <div className="cn-col-freight-table">
            <div className="cn-freight-type-header">
              <span className="cn-ft-title">Freight Type</span>
              <div className="cn-ft-checkboxes">
                <span className={`cn-chk ${note.freightType === 'TO PAY' ? 'active' : ''}`}>
                  {note.freightType === 'TO PAY' ? '☑' : '☐'} TO PAY
                </span>
                <span className={`cn-chk ${note.freightType === 'PAID' ? 'active' : ''}`}>
                  {note.freightType === 'PAID' ? '☑' : '☐'} PAID
                </span>
                <span className={`cn-chk ${note.freightType === 'TBB' ? 'active' : ''}`}>
                  {note.freightType === 'TBB' ? '☑' : '☐'} TBB
                </span>
              </div>
            </div>

            <table className="cn-mini-freight-table">
              <tbody>
                <tr>
                  <td>Freight</td>
                  <td className="text-right">
                    {note.freightAmount !== '' && note.freightAmount !== undefined
                      ? formatCurrency(note.freightAmount)
                      : ''}
                  </td>
                </tr>
                <tr>
                  <td>Collection</td>
                  <td className="text-right">
                    {note.collectionCharges !== '' && note.collectionCharges !== undefined
                      ? formatCurrency(note.collectionCharges)
                      : ''}
                  </td>
                </tr>
                <tr>
                  <td>Door Delivery</td>
                  <td className="text-right">
                    {note.doorDeliveryCharges !== '' && note.doorDeliveryCharges !== undefined
                      ? formatCurrency(note.doorDeliveryCharges)
                      : ''}
                  </td>
                </tr>
                <tr>
                  <td>Bilty Charge</td>
                  <td className="text-right">
                    {note.biltyCharges !== '' && note.biltyCharges !== undefined
                      ? formatCurrency(note.biltyCharges)
                      : note.freightRemark || 'ABB'}
                  </td>
                </tr>
                <tr>
                  <td>Insurance</td>
                  <td className="text-right">
                    {note.insuranceCharges !== '' && note.insuranceCharges !== undefined
                      ? formatCurrency(note.insuranceCharges)
                      : ''}
                  </td>
                </tr>
                <tr>
                  <td>Labour</td>
                  <td className="text-right">
                    {note.labourCharges !== '' && note.labourCharges !== undefined
                      ? formatCurrency(note.labourCharges)
                      : ''}
                  </td>
                </tr>
                <tr>
                  <td>GST</td>
                  <td className="text-right">
                    {note.gstAmount !== '' && note.gstAmount !== undefined
                      ? formatCurrency(note.gstAmount)
                      : ''}
                  </td>
                </tr>
                <tr className="cn-total-freight-row">
                  <td>Total</td>
                  <td className="text-right">
                    {note.totalFreightAmount !== '' && note.totalFreightAmount !== undefined
                      ? formatCurrency(note.totalFreightAmount)
                      : ''}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Col 6: Documents Attached & Delivery Type */}
          <div className="cn-col-docs">
            <div className="cn-docs-header">Documents Attached</div>
            <div className="cn-docs-content">
              <div className="cn-doc-field">
                <span className="cn-doc-lbl">E-Waybill No.</span>
                <span
                  className="cn-doc-val"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('ewayBillNo', e.currentTarget.innerText)}
                >
                  {note.ewayBillNo || '612169013377'}
                </span>
              </div>
              <div className="cn-doc-field">
                <span className="cn-doc-lbl">Invoice No.</span>
                <span
                  className="cn-doc-val"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('invoiceNo', e.currentTarget.innerText)}
                >
                  {note.invoiceNo || '3081744'}
                </span>
              </div>
              <div className="cn-doc-field">
                <span className="cn-doc-lbl">Invoice Dt.</span>
                <span
                  className="cn-doc-val"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('invoiceDate', e.currentTarget.innerText)}
                >
                  {note.invoiceDate || '11/08/2026'}
                </span>
              </div>
              <div className="cn-doc-field">
                <span className="cn-doc-lbl">Invoice Value ₹</span>
                <span
                  className="cn-doc-val"
                  contentEditable={isEditableInline}
                  suppressContentEditableWarning
                  onBlur={(e) => handleTextChange('invoiceValue', e.currentTarget.innerText)}
                >
                  {note.invoiceValue || 'As per Invoice'}
                </span>
              </div>

              <div className="cn-delivery-type-box">
                <div className="cn-dt-title">Delivery Type:</div>
                <div className="cn-dt-option">
                  <span>{note.deliveryType === 'Godown' ? '☑' : '☐'} Godown</span>
                </div>
                <div className="cn-dt-option">
                  <span>{note.deliveryType === 'Door Delivery' ? '☑' : '☐'} Door Delivery</span>
                </div>
                <div className="cn-dt-option">
                  <span>
                    {note.deliveryType === 'Unloading By Consignee' ? '☑' : '☐'} Unloading By
                    Consignee
                  </span>
                </div>
                <div className="cn-dt-option">
                  <span>
                    {note.deliveryType === 'Unloading By Transport' ? '☑' : '☐'} Unloading By
                    Transport
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Copy Badge, Owner's Risk & GST Payable Row */}
        <div className="cn-risk-gst-row">
          <div className="cn-copy-badge-area">
            <div className="cn-watermark-copy-badge">{note.copyType || 'CONSIGNEE COPY'}</div>
          </div>

          <div className="cn-owner-risk-area">
            <div className="cn-risk-text">AT OWNER'S RISK</div>
          </div>

          <div className="cn-gst-payable-area">
            <span className="cn-gst-p-title">GST PAYABLE BY:</span>
            <div className="cn-gst-p-checks">
              <span className={`cn-gst-chk ${note.gstPayableBy === 'CONSIGNOR' ? 'active' : ''}`}>
                <span>{note.gstPayableBy === 'CONSIGNOR' ? '☑' : '☐'}</span>
                <span>CONSIGNOR</span>
              </span>
              <span className={`cn-gst-chk ${note.gstPayableBy === 'CONSIGNEE' ? 'active' : ''}`}>
                <span>{note.gstPayableBy === 'CONSIGNEE' ? '☑' : '☐'}</span>
                <span>CONSIGNEE</span>
              </span>
              <span className={`cn-gst-chk ${note.gstPayableBy === 'CARRIER' ? 'active' : ''}`}>
                <span>{note.gstPayableBy === 'CARRIER' ? '☑' : '☐'}</span>
                <span>CARRIER</span>
              </span>
            </div>
          </div>
        </div>

        {/* Footer Details: Head Office, Branches & Signatures */}
        <div className="cn-footer-grid">
          <div className="cn-footer-headoffice">
            <div className="cn-foot-heading">HEAD OFFICE</div>
            <div className="cn-foot-content">
              Shop No 5, Ground Floor, Maheshwar Villa, Plot No 30, Sector 5A,
              <br />
              New Panvel, Navi Mumbai - 410206 (Maharashtra)
              <br />
              Ph.: +91 9987010013 / 8888522803 • Email: {company.email}
              <br />
              Fleet Owners & All India Transport Contractors
            </div>
          </div>

          <div className="cn-footer-branches">
            <div className="cn-foot-heading">BRANCH DETAILS</div>
            <div className="cn-foot-content">
              <strong>PANVEL / NAVI MUMBAI :</strong> 9987010013
              <br />
              <strong>NHAVA SHEVA / JNPT :</strong> 8888522803
              <br />
              <strong>BHIWANDI / KALAMBOLI :</strong> 9987010013
              <br />
              <strong>PAN NO :</strong> {company.panNo}
            </div>
          </div>

          <div className="cn-footer-sign">
            <div className="cn-sign-for">For {company.companyName}</div>
            <div className="cn-sign-box">
              <div className="cn-sign-placeholder">✍️ Authorized Stamp & Sign</div>
            </div>
          </div>
        </div>

        {/* Consignor Declaration Bar */}
        <div className="cn-declaration-bar">
          Consignor Declaration: "We are fully aware of and accept the conditions of carriage given
          on the back side of the Goods Consignment Note"
        </div>
      </div>
    </div>
  );
};
