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
  Fuel
} from 'lucide-react';

interface HeaderBarProps {
  onNewInvoice: () => void;
  onSaveInvoice: () => void;
  onSaveAndNextInvoice?: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onWhatsAppShare: () => void;
  onOpenSavedModal: () => void;
  onOpenDirectoryModal: () => void;
  onOpenTripSlipModal?: () => void;
  onOpenLRModal?: () => void;
  savedCount: number;
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
  onNewInvoice,
  onSaveInvoice,
  onSaveAndNextInvoice,
  onPrint,
  onDownloadPDF,
  onWhatsAppShare,
  onOpenSavedModal,
  onOpenDirectoryModal,
  onOpenTripSlipModal,
  onOpenLRModal,
  savedCount,
  zoom,
  onZoomIn,
  onZoomOut,
  onZoomReset,
  onLoadOriginalSample,
  viewMode,
  onViewModeChange,
  isDownloadingPDF = false,
}) => {
  return (
    <header className="app-header no-print">
      {/* Brand & Studio Title */}
      <div className="header-left">
        <div className="brand-logo-badge">
          <div className="brand-dot-pulse">
            <div className="pulse"></div>
            <div className="core"></div>
          </div>
          <div className="brand-text-group">
            <span className="brand-title">SWAMI KRUPA ROADLINES</span>
            <span className="brand-subtitle">TAX INVOICE GENERATOR</span>
          </div>
          <span className="brand-pro-tag">PRO</span>
        </div>
      </div>

      {/* Center View Controls & Zoom Widget */}
      <div className="header-center">
        <div className="segmented-pill-selector">
          <button
            type="button"
            className={`pill-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => onViewModeChange('split')}
            title="Split Editor & Preview View"
          >
            <Layout size={14} /> Split View
          </button>
          <button
            type="button"
            className={`pill-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => onViewModeChange('preview')}
            title="Full A4 Preview Mode"
          >
            <Maximize2 size={14} /> Preview Only
          </button>
        </div>

        <div className="zoom-widget">
          <button type="button" className="zoom-btn" onClick={onZoomOut} title="Zoom Out">
            <ZoomOut size={13} />
          </button>
          <span className="zoom-value" onClick={onZoomReset} title="Click to Reset 100%">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" className="zoom-btn" onClick={onZoomIn} title="Zoom In">
            <ZoomIn size={13} />
          </button>
          <button type="button" className="zoom-btn" onClick={onZoomReset} title="Reset to Fit">
            <RotateCcw size={12} />
          </button>
        </div>
      </div>

      {/* Right Actions Bar */}
      <div className="header-right">
        <button
          type="button"
          className="btn-header btn-header-sample"
          onClick={onLoadOriginalSample}
          title="Restore original Swami Krupa Roadlines template"
        >
          <Sparkles size={14} /> Demo Sample
        </button>

        <button
          type="button"
          className="btn-header btn-header-ghost"
          onClick={onOpenDirectoryModal}
          title="Customer & Vehicle Directory"
        >
          <Users size={14} /> Directory
        </button>

        <button
          type="button"
          className="btn-header btn-header-ghost"
          onClick={onOpenSavedModal}
          title="Saved Bills History"
        >
          <FolderOpen size={14} /> Bills ({savedCount})
        </button>

        {onOpenLRModal && (
          <button
            type="button"
            className="btn-header btn-header-ghost"
            onClick={onOpenLRModal}
            title="Create and print Goods Consignment Note (e-LR / Bilty)"
            style={{ color: '#60a5fa', borderColor: '#3b82f6' }}
          >
            <Sparkles size={14} /> e-LR / Bilty
          </button>
        )}

        {onOpenTripSlipModal && (
          <button
            type="button"
            className="btn-header btn-header-ghost"
            onClick={onOpenTripSlipModal}
            title="Create and print Vehicle Trip & Driver Advance Slips"
            style={{ color: '#38bdf8' }}
          >
            <Fuel size={14} /> Trip Slips
          </button>
        )}

        <button
          type="button"
          className="btn-header btn-header-ghost"
          onClick={onNewInvoice}
          title="Create New Bill"
        >
          <PlusCircle size={14} /> New Bill
        </button>

        <button
          type="button"
          className="btn-header btn-header-whatsapp"
          onClick={onWhatsAppShare}
          title="Share Bill Breakdown on WhatsApp"
        >
          <Share2 size={14} /> WhatsApp
        </button>

        <button
          type="button"
          className="btn-header btn-header-pdf"
          onClick={onDownloadPDF}
          disabled={isDownloadingPDF}
          title="Export High-Res A4 PDF"
        >
          <Download size={14} /> {isDownloadingPDF ? 'Generating...' : 'PDF'}
        </button>

        <button
          type="button"
          className="btn-header btn-header-save"
          onClick={onSaveInvoice}
          title="Save Bill to Local Storage"
        >
          <Save size={14} /> Save
        </button>

        {onSaveAndNextInvoice && (
          <button
            type="button"
            className="btn-header btn-header-save-next"
            onClick={onSaveAndNextInvoice}
            title="Save this bill and immediately open next sequential bill"
          >
            <PlusCircle size={14} /> Save & Next
          </button>
        )}

        <button
          type="button"
          className="btn-header btn-header-print"
          onClick={onPrint}
          title="Print or Save via System Dialog"
        >
          <Printer size={15} /> Print
        </button>
      </div>
    </header>
  );
};
