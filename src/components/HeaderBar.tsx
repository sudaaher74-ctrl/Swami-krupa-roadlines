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
  Users
} from 'lucide-react';

interface HeaderBarProps {
  onNewInvoice: () => void;
  onSaveInvoice: () => void;
  onPrint: () => void;
  onDownloadPDF: () => void;
  onWhatsAppShare: () => void;
  onOpenSavedModal: () => void;
  onOpenDirectoryModal: () => void;
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
  onPrint,
  onDownloadPDF,
  onWhatsAppShare,
  onOpenSavedModal,
  onOpenDirectoryModal,
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
      <div className="header-left">
        <div className="brand-logo-badge">
          <span className="brand-dot"></span>
          <span className="brand-title">ROADLINES BILL GENERATOR</span>
          <span className="brand-tag">PRO</span>
        </div>
      </div>

      {/* Center View Controls & Zoom */}
      <div className="header-center">
        <div className="view-mode-selector">
          <button
            type="button"
            className={`view-btn ${viewMode === 'split' ? 'active' : ''}`}
            onClick={() => onViewModeChange('split')}
            title="Split Editor & Preview"
          >
            <Layout size={14} /> Split View
          </button>
          <button
            type="button"
            className={`view-btn ${viewMode === 'preview' ? 'active' : ''}`}
            onClick={() => onViewModeChange('preview')}
            title="Print Preview Only"
          >
            <Maximize2 size={14} /> Preview
          </button>
        </div>

        <div className="zoom-controls">
          <button type="button" className="btn-zoom" onClick={onZoomOut} title="Zoom Out">
            <ZoomOut size={14} />
          </button>
          <span className="zoom-level" onClick={onZoomReset} title="Click to reset zoom">
            {Math.round(zoom * 100)}%
          </span>
          <button type="button" className="btn-zoom" onClick={onZoomIn} title="Zoom In">
            <ZoomIn size={14} />
          </button>
          <button type="button" className="btn-zoom" onClick={onZoomReset} title="Reset 100%">
            <RotateCcw size={13} />
          </button>
        </div>
      </div>

      {/* Right Action Buttons */}
      <div className="header-right">
        <button
          type="button"
          className="btn-sample-loader"
          onClick={onLoadOriginalSample}
          title="Load the exact original Swami Krupa Roadlines bill sample"
        >
          <Sparkles size={14} className="text-amber" /> Load Sample Bill
        </button>

        <button
          type="button"
          className="btn-header-secondary"
          onClick={onOpenDirectoryModal}
          title="Manage Parties & Vehicles Directory"
        >
          <Users size={15} /> Directory
        </button>

        <button
          type="button"
          className="btn-header-secondary"
          onClick={onOpenSavedModal}
          title="View all saved bills"
        >
          <FolderOpen size={15} /> Bills ({savedCount})
        </button>

        <button
          type="button"
          className="btn-header-secondary"
          onClick={onNewInvoice}
          title="Start fresh new bill"
        >
          <PlusCircle size={15} /> New Bill
        </button>

        <button
          type="button"
          className="btn-header-whatsapp"
          onClick={onWhatsAppShare}
          title="Share bill breakdown on WhatsApp"
        >
          <Share2 size={15} /> WhatsApp
        </button>

        <button
          type="button"
          className="btn-header-pdf"
          onClick={onDownloadPDF}
          disabled={isDownloadingPDF}
          title="Download high-resolution PDF file"
        >
          <Download size={15} /> {isDownloadingPDF ? 'Generating...' : 'Download PDF'}
        </button>

        <button
          type="button"
          className="btn-header-save"
          onClick={onSaveInvoice}
          title="Save bill locally"
        >
          <Save size={15} /> Save
        </button>

        <button
          type="button"
          className="btn-header-primary"
          onClick={onPrint}
          title="Print or Save as PDF"
        >
          <Printer size={16} /> Print
        </button>
      </div>
    </header>
  );
};
