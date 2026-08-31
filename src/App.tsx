import React, { useState, useEffect } from 'react';
import type { InvoiceData, CustomerRecord, VehicleRecord, TripSlip, ConsignmentNote } from './types/invoice';
import { defaultInvoice, createNewInvoice, defaultCompanyProfile, defaultConsignmentNote } from './utils/defaultData';
import { calculateNextBillNumber, recordBillSequenceNumber } from './utils/billNumberUtils';
import { HeaderBar } from './components/HeaderBar';
import { InvoiceDocument } from './components/InvoiceDocument';
import { InvoiceEditor } from './components/InvoiceEditor';
import { SavedInvoicesModal } from './components/SavedInvoicesModal';
import { DirectoryModal } from './components/DirectoryModal';
import { TripSlipModal } from './components/TripSlipModal';
import { ConsignmentNoteModal } from './components/ConsignmentNoteModal';
import { downloadInvoicePDF, openWhatsAppShare } from './utils/exportUtils';
import { CheckCircle2 } from 'lucide-react';
import './styles/app.css';

const LOCAL_STORAGE_KEY_INVOICES = 'swami_krupa_saved_invoices_v1';
const LOCAL_STORAGE_KEY_CUSTOMERS = 'swami_krupa_saved_customers_v1';
const LOCAL_STORAGE_KEY_VEHICLES = 'swami_krupa_saved_vehicles_v1';
const LOCAL_STORAGE_KEY_COMPANY = 'swami_krupa_company_profile_v1';
const LOCAL_STORAGE_KEY_BANK = 'swami_krupa_bank_details_v1';
const LOCAL_STORAGE_KEY_TRIP_SLIPS = 'swami_krupa_trip_slips_v1';
const LOCAL_STORAGE_KEY_LR_NOTES = 'swami_krupa_consignment_notes_v1';

const defaultTripSlipsList: TripSlip[] = [
  {
    id: 'slip-1',
    slipNo: 'SLIP-101',
    date: '28-08-2026',
    vehicleNo: 'MH46DL7778',
    driverName: 'RAMESH SINGH',
    driverPhone: '9876543210',
    fromLocation: 'NHAVA SHEVA',
    toLocation: 'VASAI',
    containerNo: 'BEAU5560140 (40FT)',
    dieselLiters: 65,
    dieselRate: 92.5,
    dieselAmount: 6012,
    dieselPumpName: 'HPCL PANVEL',
    driverAdvance: 2000,
    tollCharges: 650,
    otherExpenses: 0,
    remarks: 'Trip advance & diesel voucher',
    totalExpense: 8662,
    company: defaultCompanyProfile,
    createdAt: new Date().toISOString(),
  }
];

const defaultCustomersList: CustomerRecord[] = [
  { id: 'c-1', name: 'ADNISHA TRANSPORT', phone: '9987010013', address: 'Navi Mumbai' },
  { id: 'c-2', name: 'CONTINENTAL LOGISTICS', phone: '9820011223', address: 'Nhava Sheva' },
  { id: 'c-3', name: 'SHREE BALAJI ROADWAYS', phone: '9888522803', address: 'Kalamboli' },
];

const defaultVehiclesList: VehicleRecord[] = [
  { id: 'v-1', vehicleNo: 'MH46DL7778', type: '40ft Trailer' },
  { id: 'v-2', vehicleNo: 'MH46BB1234', type: '20ft Truck' },
  { id: 'v-3', vehicleNo: 'MH04GP5678', type: '40ft High Bed' },
];

export const App: React.FC = () => {
  // Current active invoice
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData>(() => {
    return defaultInvoice;
  });

  // Saved Invoices list
  const [savedInvoices, setSavedInvoices] = useState<InvoiceData[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_INVOICES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading saved invoices', e);
    }
    return [defaultInvoice];
  });

  // Saved Customers Master
  const [customers, setCustomers] = useState<CustomerRecord[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_CUSTOMERS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading customers', e);
    }
    return defaultCustomersList;
  });

  // Saved Vehicles Master
  const [vehicles, setVehicles] = useState<VehicleRecord[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_VEHICLES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading vehicles', e);
    }
    return defaultVehiclesList;
  });

  // Trip Slips Master
  const [tripSlips, setTripSlips] = useState<TripSlip[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_TRIP_SLIPS);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading trip slips', e);
    }
    return defaultTripSlipsList;
  });

  // Consignment Notes (e-LR) Master
  const [consignmentNotes, setConsignmentNotes] = useState<ConsignmentNote[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LR_NOTES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading LR notes', e);
    }
    return [defaultConsignmentNote];
  });

  // UI state
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isTripSlipModalOpen, setIsTripSlipModalOpen] = useState(false);
  const [isLRModalOpen, setIsLRModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>('split');
  const [zoom, setZoom] = useState<number>(0.92);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(savedInvoices));
    } catch (e) {
      console.error(e);
    }
  }, [savedInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {
      console.error(e);
    }
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
    } catch (e) {
      console.error(e);
    }
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRIP_SLIPS, JSON.stringify(tripSlips));
    } catch (e) {
      console.error(e);
    }
  }, [tripSlips]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LR_NOTES, JSON.stringify(consignmentNotes));
    } catch (e) {
      console.error(e);
    }
  }, [consignmentNotes]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  const handleSaveLRNote = (note: ConsignmentNote) => {
    const existingIndex = consignmentNotes.findIndex((n) => n.id === note.id);
    if (existingIndex >= 0) {
      const copy = [...consignmentNotes];
      copy[existingIndex] = note;
      setConsignmentNotes(copy);
    } else {
      setConsignmentNotes([note, ...consignmentNotes]);
    }
  };

  const handleDeleteLRNote = (id: string) => {
    if (window.confirm('Are you sure you want to delete this e-LR note?')) {
      setConsignmentNotes(consignmentNotes.filter((n) => n.id !== id));
      showToast('Deleted e-LR note');
    }
  };

  const handleCreateInvoiceFromLR = (lr: ConsignmentNote) => {
    const newBillNo = calculateNextBillNumber(savedInvoices, currentInvoice);
    const newInv = createNewInvoice(newBillNo);

    newInv.clientName = lr.consigneeName || lr.consignorName || 'CLIENT TRANSPORT';
    newInv.beNo = lr.lrNo;
    newInv.beDate = lr.date;
    newInv.refDocType = 'LR NO';

    const routeParticular = lr.fromLocation && lr.toLocation ? `${lr.fromLocation} TO ${lr.toLocation}` : (lr.description || 'FREIGHT CHARGES');
    const containerStr = lr.containerNo ? (lr.packagesCount ? `${lr.containerNo} ${lr.packagesCount}` : lr.containerNo) : (lr.packagesCount || '');

    newInv.items = [
      {
        id: 'row-' + Date.now(),
        sn: '1',
        date: lr.date || '',
        vehicleNo: lr.vehicleNo || '',
        containerNo: containerStr,
        particulars: routeParticular.toUpperCase(),
        weight: lr.senderWeight || 'FIXED',
        advance: '',
        amount: lr.totalFreightAmount || lr.freightAmount || ''
      }
    ];

    setCurrentInvoice(newInv);
    showToast(`Created Bill #${newBillNo} from LR #${lr.lrNo}`);
  };

  // Invoice Handlers
  const handleSaveInvoice = () => {
    const updated = { ...currentInvoice, updatedAt: new Date().toISOString() };
    recordBillSequenceNumber(updated.billNo);
    const existingIndex = savedInvoices.findIndex((inv) => inv.id === updated.id);

    if (existingIndex >= 0) {
      const copy = [...savedInvoices];
      copy[existingIndex] = updated;
      setSavedInvoices(copy);
      showToast(`Updated Bill #${updated.billNo} successfully!`);
    } else {
      setSavedInvoices([updated, ...savedInvoices]);
      showToast(`Saved Bill #${updated.billNo} to records!`);
    }
  };

  const handleSaveAndNextInvoice = () => {
    const updated = { ...currentInvoice, updatedAt: new Date().toISOString() };
    recordBillSequenceNumber(updated.billNo);
    
    let updatedList = [...savedInvoices];
    const existingIndex = savedInvoices.findIndex((inv) => inv.id === updated.id);
    if (existingIndex >= 0) {
      updatedList[existingIndex] = updated;
    } else {
      updatedList = [updated, ...savedInvoices];
    }
    setSavedInvoices(updatedList);

    // Calculate next sequential bill number
    const nextBillNo = calculateNextBillNumber(updatedList, updated);
    recordBillSequenceNumber(nextBillNo);

    const newInv = createNewInvoice(nextBillNo);
    try {
      const savedComp = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
      if (savedComp) newInv.company = JSON.parse(savedComp);

      const savedBank = localStorage.getItem(LOCAL_STORAGE_KEY_BANK);
      if (savedBank) newInv.bank = JSON.parse(savedBank);
    } catch (e) {}

    // Inherit the same reference document type (BE NO vs INVOICE NO) from current bill
    if (currentInvoice.refDocType) {
      newInv.refDocType = currentInvoice.refDocType;
    }

    setCurrentInvoice(newInv);
    showToast(`Saved #${updated.billNo}! Created Next Bill #${nextBillNo}`);
  };

  const handleNewInvoice = () => {
    const newBillNo = calculateNextBillNumber(savedInvoices, currentInvoice);
    recordBillSequenceNumber(newBillNo);

    const newInv = createNewInvoice(newBillNo);

    try {
      const savedComp = localStorage.getItem(LOCAL_STORAGE_KEY_COMPANY);
      if (savedComp) newInv.company = JSON.parse(savedComp);

      const savedBank = localStorage.getItem(LOCAL_STORAGE_KEY_BANK);
      if (savedBank) newInv.bank = JSON.parse(savedBank);
    } catch (e) {}

    if (currentInvoice.refDocType) {
      newInv.refDocType = currentInvoice.refDocType;
    }

    setCurrentInvoice(newInv);
    showToast(`Created new Bill #${newBillNo}`);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      showToast('Generating high-res A4 PDF...');
      await downloadInvoicePDF(currentInvoice);
      showToast('PDF downloaded successfully!');
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF. You can also use the Print button to Save as PDF.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    openWhatsAppShare(currentInvoice, currentInvoice.clientPhone);
    showToast('Opening WhatsApp with bill summary...');
  };

  const handleLoadOriginalSample = () => {
    setCurrentInvoice(defaultInvoice);
    showToast('Loaded original Swami Krupa Roadlines template!');
  };

  const handleSaveAsDefaultProfile = () => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_COMPANY, JSON.stringify(currentInvoice.company));
      localStorage.setItem(LOCAL_STORAGE_KEY_BANK, JSON.stringify(currentInvoice.bank));
      showToast('Saved company profile & bank details as default for future bills!');
    } catch (e) {
      console.error(e);
    }
  };

  // Customer & Vehicle Quick Savers
  const handleQuickSaveCustomer = (name: string, phone?: string) => {
    if (!name.trim()) return;
    const exists = customers.some((c) => c.name.toUpperCase() === name.toUpperCase());
    if (exists) {
      showToast(`Party '${name}' is already in Directory.`);
      return;
    }
    const newCust: CustomerRecord = {
      id: 'c-' + Date.now(),
      name: name.trim().toUpperCase(),
      phone: phone || '',
    };
    setCustomers([newCust, ...customers]);
    showToast(`Added '${name}' to Directory!`);
  };

  const handleQuickSaveVehicle = (vehicleNo: string) => {
    if (!vehicleNo.trim()) return;
    const exists = vehicles.some((v) => v.vehicleNo.toUpperCase() === vehicleNo.toUpperCase());
    if (exists) {
      showToast(`Vehicle '${vehicleNo}' is already in Directory.`);
      return;
    }
    const newVeh: VehicleRecord = {
      id: 'v-' + Date.now(),
      vehicleNo: vehicleNo.trim().toUpperCase(),
    };
    setVehicles([newVeh, ...vehicles]);
    showToast(`Added '${vehicleNo}' to Directory!`);
  };

  // Directory CRUD Handlers
  const handleAddCustomer = (c: Omit<CustomerRecord, 'id'>) => {
    setCustomers([{ ...c, id: 'c-' + Date.now() }, ...customers]);
    showToast(`Party '${c.name}' saved!`);
  };

  const handleUpdateCustomer = (c: CustomerRecord) => {
    setCustomers(customers.map((item) => (item.id === c.id ? c : item)));
    showToast(`Party '${c.name}' updated!`);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter((c) => c.id !== id));
    showToast('Party deleted from Directory.');
  };

  const handleAddVehicle = (v: Omit<VehicleRecord, 'id'>) => {
    setVehicles([{ ...v, id: 'v-' + Date.now() }, ...vehicles]);
    showToast(`Vehicle '${v.vehicleNo}' saved!`);
  };

  const handleUpdateVehicle = (v: VehicleRecord) => {
    setVehicles(vehicles.map((item) => (item.id === v.id ? v : item)));
    showToast(`Vehicle '${v.vehicleNo}' updated!`);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter((v) => v.id !== id));
    showToast('Vehicle deleted from Directory.');
  };

  const handleSelectCustomerFromDir = (c: CustomerRecord) => {
    const copy = { ...currentInvoice, clientName: c.name, clientPhone: c.phone || currentInvoice.clientPhone };
    setCurrentInvoice(copy);
    showToast(`Applied '${c.name}' to current bill.`);
  };

  // Saved Invoices handlers
  const handleSelectInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    setIsSavedModalOpen(false);
    showToast(`Loaded Bill #${inv.billNo}`);
  };

  const handleDuplicateInvoice = (inv: InvoiceData) => {
    const today = new Date();
    const dd = String(today.getDate()).padStart(2, '0');
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const yyyy = today.getFullYear();

    const cloned: InvoiceData = {
      ...inv,
      id: 'inv-' + Date.now(),
      billNo: `${inv.billNo} (COPY)`,
      date: `${dd}-${mm}-${yyyy}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setSavedInvoices([cloned, ...savedInvoices]);
    setCurrentInvoice(cloned);
    setIsSavedModalOpen(false);
    showToast(`Duplicated into new bill!`);
  };

  const handleDeleteInvoice = (id: string) => {
    setSavedInvoices(savedInvoices.filter((inv) => inv.id !== id));
    showToast('Invoice deleted from records');
  };

  const handleUpdateInvoicePayment = (
    invoiceId: string,
    status: 'PAID' | 'UNPAID' | 'PARTIAL',
    amountReceived?: number,
    paymentDate?: string,
    paymentMode?: string,
    paymentNotes?: string
  ) => {
    const updatedList = savedInvoices.map((inv) => {
      if (inv.id === invoiceId) {
        return {
          ...inv,
          paymentStatus: status,
          amountReceived: amountReceived !== undefined ? amountReceived : inv.amountReceived,
          paymentDate: paymentDate || inv.paymentDate,
          paymentMode: paymentMode || inv.paymentMode,
          paymentNotes: paymentNotes !== undefined ? paymentNotes : inv.paymentNotes,
          updatedAt: new Date().toISOString(),
        };
      }
      return inv;
    });

    setSavedInvoices(updatedList);

    if (currentInvoice.id === invoiceId) {
      setCurrentInvoice({
        ...currentInvoice,
        paymentStatus: status,
        amountReceived: amountReceived !== undefined ? amountReceived : currentInvoice.amountReceived,
        paymentDate: paymentDate || currentInvoice.paymentDate,
        paymentMode: paymentMode || currentInvoice.paymentMode,
        paymentNotes: paymentNotes !== undefined ? paymentNotes : currentInvoice.paymentNotes,
      });
    }

    showToast(`Payment updated: ${status}`);
  };

  // Trip Slips handlers
  const handleSaveTripSlip = (slip: TripSlip) => {
    const existingIndex = tripSlips.findIndex(s => s.id === slip.id);
    if (existingIndex >= 0) {
      const copy = [...tripSlips];
      copy[existingIndex] = slip;
      setTripSlips(copy);
      showToast(`Updated ${slip.slipNo} for ${slip.vehicleNo}`);
    } else {
      setTripSlips([slip, ...tripSlips]);
      showToast(`Saved ${slip.slipNo} for ${slip.vehicleNo}`);
    }
  };

  const handleDeleteTripSlip = (id: string) => {
    setTripSlips(tripSlips.filter(s => s.id !== id));
    showToast('Trip slip deleted from records');
  };

  const handleExportAll = () => {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(savedInvoices, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute('href', dataStr);
    downloadAnchor.setAttribute('download', `roadlines_invoices_backup_${new Date().toISOString().slice(0, 10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Exported backup file successfully!');
  };

  const handleImportBackup = (importedList: InvoiceData[]) => {
    setSavedInvoices([...importedList, ...savedInvoices]);
    if (importedList.length > 0) {
      setCurrentInvoice(importedList[0]);
    }
  };

  // Zoom handlers
  const handleZoomIn = () => setZoom((z) => Math.min(1.4, z + 0.08));
  const handleZoomOut = () => setZoom((z) => Math.max(0.5, z - 0.08));
  const handleZoomReset = () => setZoom(0.92);

  // Field change from document direct edit
  const handleDirectFieldUpdate = (field: string, val: any) => {
    const copy = { ...currentInvoice };
    if (field.startsWith('company.')) {
      const sub = field.replace('company.', '');
      copy.company = { ...copy.company, [sub]: val };
    } else if (field.startsWith('bank.')) {
      const sub = field.replace('bank.', '');
      copy.bank = { ...copy.bank, [sub]: val };
    } else {
      (copy as any)[field] = val;
    }
    setCurrentInvoice(copy);
  };

  return (
    <div className="app-viewport">
      {/* Top Application Header */}
      <HeaderBar
        onNewInvoice={handleNewInvoice}
        onSaveInvoice={handleSaveInvoice}
        onSaveAndNextInvoice={handleSaveAndNextInvoice}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onWhatsAppShare={handleWhatsAppShare}
        onOpenSavedModal={() => setIsSavedModalOpen(true)}
        onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
        onOpenTripSlipModal={() => setIsTripSlipModalOpen(true)}
        onOpenLRModal={() => setIsLRModalOpen(true)}
        savedCount={savedInvoices.length}
        zoom={zoom}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onZoomReset={handleZoomReset}
        onLoadOriginalSample={handleLoadOriginalSample}
        viewMode={viewMode}
        onViewModeChange={setViewMode}
        isDownloadingPDF={isDownloadingPDF}
      />

      {/* Main Split Content */}
      <main className="app-main-workspace">
        {/* Left Form Editor */}
        {viewMode !== 'preview' && (
          <aside className="editor-sidebar-container no-print">
            <InvoiceEditor
              invoice={currentInvoice}
              onChange={setCurrentInvoice}
              onSaveAsDefaultProfile={handleSaveAsDefaultProfile}
              customers={customers}
              vehicles={vehicles}
              savedInvoices={savedInvoices}
              onSaveAndNext={handleSaveAndNextInvoice}
              onQuickSaveCustomer={handleQuickSaveCustomer}
              onQuickSaveVehicle={handleQuickSaveVehicle}
              onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
            />
          </aside>
        )}

        {/* Live A4 Document Preview */}
        {viewMode !== 'editor' && (
          <section className="preview-pane-container">
            <div
              className="preview-scaler"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              <InvoiceDocument
                invoice={currentInvoice}
                isEditableInline={true}
                onUpdateField={handleDirectFieldUpdate}
              />
            </div>
          </section>
        )}
      </main>

      {/* Toast Notification */}
      {toastMessage && (
        <div className="toast-badge">
          <CheckCircle2 size={16} />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Saved Invoices Modal */}
      <SavedInvoicesModal
        isOpen={isSavedModalOpen}
        onClose={() => setIsSavedModalOpen(false)}
        savedInvoices={savedInvoices}
        onSelectInvoice={handleSelectInvoice}
        onDuplicateInvoice={handleDuplicateInvoice}
        onDeleteInvoice={handleDeleteInvoice}
        onExportAll={handleExportAll}
        onImportBackup={handleImportBackup}
        onUpdateInvoicePayment={handleUpdateInvoicePayment}
      />

      {/* Directory Modal */}
      <DirectoryModal
        isOpen={isDirectoryModalOpen}
        onClose={() => setIsDirectoryModalOpen(false)}
        customers={customers}
        vehicles={vehicles}
        onAddCustomer={handleAddCustomer}
        onUpdateCustomer={handleUpdateCustomer}
        onDeleteCustomer={handleDeleteCustomer}
        onAddVehicle={handleAddVehicle}
        onUpdateVehicle={handleUpdateVehicle}
        onDeleteVehicle={handleDeleteVehicle}
        onSelectCustomer={handleSelectCustomerFromDir}
      />

      {/* Trip Slip Modal */}
      <TripSlipModal
        isOpen={isTripSlipModalOpen}
        onClose={() => setIsTripSlipModalOpen(false)}
        tripSlips={tripSlips}
        onSaveTripSlip={handleSaveTripSlip}
        onDeleteTripSlip={handleDeleteTripSlip}
        vehicles={vehicles}
        company={currentInvoice.company}
      />

      {/* Consignment Note (e-LR / Bilty) Modal */}
      <ConsignmentNoteModal
        isOpen={isLRModalOpen}
        onClose={() => setIsLRModalOpen(false)}
        savedNotes={consignmentNotes}
        onSaveNote={handleSaveLRNote}
        onDeleteNote={handleDeleteLRNote}
        customers={customers}
        vehicles={vehicles}
        onCreateInvoiceFromLR={handleCreateInvoiceFromLR}
      />
    </div>
  );
};

export default App;
