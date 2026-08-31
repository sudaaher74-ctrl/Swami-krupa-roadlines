import React from 'react';
import {
  Printer,
  Save,
  PlusCircle,
  FolderOpen,
  ZoomIn,
  ZoomOut,
  RotateCcw,
  Sparkles,
  Layout,
  Maximize2,
  Download,
  Share2,
  Users,
  Fuel,
  FileText,
  ClipboardList
} from 'lucide-react';

interface HeaderBarProps {
  activeDocType: 'invoice' | 'lr';
  onDocTypeChange: (type: 'invoice' | 'lr') => void;
  onNewInvoice: () => void;
  onSaveInvoice: () => void;
  onSaveAndNextInvoice?: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onWhatsAppShare: () => void;
  onOpenSavedModal: () => void;
  onOpenDirectoryModal: () => void;
  onOpenTripSlipModal?: () => void;
  savedCount: number;
  savedLRCount?: number;
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomReset: () => void;
  onLoadOriginalSample: () => void;
  viewMode: 'split' | 'preview' | 'editor';
  onViewModeChange: (mode: 'split' | 'preview' | 'editor') => void;
  isDownloadingPDF?: boolean;
}

export const HeaderBar: React.FC<HeaderBarProps> = ({
  activeDocType,
  onDocTypeChange,
  onNewInvoice,
  onSaveInvoice,
  onSaveAndNextInvoice,
  onPrint,
  onDownloadPDF,
  onWhatsAppShare,
  onOpenSavedModal,
  onOpenDirectoryModal,
  onOpenTripSlipModal,
  savedCount,
  savedLRCount = 0,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onLoadOriginalSample,
  viewMode,
  onViewModeChange,
  isDownloadingPDF = false,
}) => {
  const isLR = activeDocType === 'lr';

  return (
    <header className="app-header no-print">
      {/* 1. Left: Brand Badge & Document Type Switcher */}
      <div className="header-left">
        <div className="brand-logo-badge" title="Swami Krupa Roadlines Billing Studio">
          <div className="brand-dot-pulse">
            <div className="pulse"></div>
            <div className="core"></div>
          </div>
          <span className="brand-title">SWAMI KRUPA</span>
        </div>

        {/* Segmented Document Mode Selector */}
        <div className="doc-mode-switcher-pill">
          <button
            type="button"
            className={`doc-mode-btn ${!isLR ? 'active' : ''}`}
            onClick={() => onDocTypeChange('invoice')}
            title="Switch to Tax Invoice Generator"
          >
            <FileText size={13} />
            <span>Tax Invoice</span>
          </button>
          <button
            type="button"
            className={`doc-mode-btn ${isLR ? 'active' : ''}`}
            onClick={() => onDocTypeChange('lr')}
            title="Switch to Goods Consignment Note (e-LR / Bilty)"
          >
            <ClipboardList size={13} />
            <span>e-LR / Bilty</span>
          </button>
        </div>
      </div>

      {/* 2. Center: View Controls & Zoom */}
      <div className="header-center">
        <div className="segmented-pill-selector">
          <button
            type="button"
            className={`pill-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => onViewModeChange('split')}
            title="Split Editor & Preview"
          >
            <Layout size={13} />
            <span>Split</span>
          </button>
          <button
            type="button"
            className={`pill-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => onViewModeChange('preview')}
            title="Full A4 Preview"
          >
            <Maximize2 size={13} />
            <span>Preview</span>
          </button>
        </div>

        <div className="zoom-widget">
          <button type="button" className="zoom-btn" onClick={onZoomOut} title="Zoom Out">
            <ZoomOut size={12} />
          </button>
          <span className="zoom-value" onClick={onZoomReset} title="Reset Zoom">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" className="zoom-btn" onClick={onZoomIn} title="Zoom In">
            <ZoomIn size={12} />
          </button>
          <button type="button" className="zoom-btn" onClick={onZoomReset} title="Reset">
            <RotateCcw size={11} />
          </button>
        </div>
      </div>

      {/* 3. Right: Utility Tools & Primary Export Actions */}
      <div className="header-right">
        {/* Utilities Group */}
        <div className="header-actions-group">
          <button
            type="button"
            className="btn-header btn-header-ghost"
            onClick={onOpenDirectoryModal}
            title="Customer & Vehicle Directory"
          >
            <Users size={13} />
            <span>Directory</span>
          </button>

          <button
            type="button"
            className="btn-header btn-header-ghost"
            onClick={onOpenSavedModal}
            title={isLR ? `Saved e-LRs (${savedLRCount})` : `Saved Bills (${savedCount})`}
          >
            <FolderOpen size={13} />
            <span>{isLR ? `e-LRs (${savedLRCount})` : `Bills (${savedCount})`}</span>
          </button>

          {onOpenTripSlipModal && (
            <button
              type="button"
              className="btn-header btn-header-ghost"
              onClick={onOpenTripSlipModal}
              title="Trip Advance & Diesel Slips"
              style={{ color: '#38bdf8' }}
            >
              <Fuel size={13} />
              <span>Trip Slips</span>
            </button>
          )}

          <button
            type="button"
            className="btn-header btn-header-sample"
            onClick={onLoadOriginalSample}
            title="Load Demo Sample"
          >
            <Sparkles size={13} />
            <span>Demo</span>
          </button>
        </div>

        {/* Primary Action Buttons */}
        <div className="header-actions-group primary-actions">
          <button
            type="button"
            className="btn-header btn-header-ghost"
            onClick={onNewInvoice}
            title={isLR ? 'Create Blank e-LR' : 'Create Blank Bill'}
          >
            <PlusCircle size={13} />
            <span>{isLR ? 'New LR' : 'New Bill'}</span>
          </button>

          <button
            type="button"
            className="btn-header btn-header-whatsapp"
            onClick={onWhatsAppShare}
            title="Share on WhatsApp"
          >
            <Share2 size={13} />
            <span>WhatsApp</span>
          </button>

          <button
            type="button"
            className="btn-header btn-header-pdf"
            onClick={onDownloadPDF}
            disabled={isDownloadingPDF}
            title="Download Clean A4 PDF"
          >
            <Download size={13} />
            <span>{isDownloadingPDF ? 'Exporting...' : 'PDF'}</span>
          </button>

          <button
            type="button"
            className="btn-header btn-header-save"
            onClick={onSaveInvoice}
            title="Save Record"
          >
            <Save size={13} />
            <span>Save</span>
          </button>

          {!isLR && onSaveAndNextInvoice && (
            <button
              type="button"
              className="btn-header btn-header-save-next"
              onClick={onSaveAndNextInvoice}
              title="Save & Open Next Bill"
            >
              <PlusCircle size={13} />
              <span>Next</span>
            </button>
          )}

          <button
            type="button"
            className="btn-header btn-header-print"
            onClick={onPrint}
            title="Print Document"
          >
            <Printer size={13} />
            <span>Print</span>
          </button>
        </div>
      </div>
    </header>
  );
};
