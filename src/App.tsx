import React, { useState, useEffect } from 'react';
import type { InvoiceData, CustomerRecord, VehicleRecord, TripSlip, ConsignmentNote } from './types/invoice';
import {
  defaultInvoice,
  createNewInvoice,
  defaultCompanyProfile,
  defaultConsignmentNote,
  createNewConsignmentNote,
} from './utils/defaultData';
import { calculateNextBillNumber, recordBillSequenceNumber } from './utils/billNumberUtils';
import { HeaderBar } from './components/HeaderBar';
import { InvoiceDocument } from './components/InvoiceDocument';
import { InvoiceEditor } from './components/InvoiceEditor';
import { SavedInvoicesModal } from './components/SavedInvoicesModal';
import { DirectoryModal } from './components/DirectoryModal';
import { TripSlipModal } from './components/TripSlipModal';
import { PartyLedgerModal } from './components/PartyLedgerModal';
import { BackupRestoreModal } from './components/BackupRestoreModal';
import { type FullSystemBackup } from './utils/storageUtils';
import { ConsignmentNoteEditor } from './components/ConsignmentNoteEditor';
import { ConsignmentNoteDocument } from './components/ConsignmentNoteDocument';
import { SavedConsignmentNotesModal } from './components/SavedConsignmentNotesModal';
import {
  downloadInvoicePDF,
  openWhatsAppShare,
  downloadConsignmentNotePDF,
  openConsignmentWhatsAppShare,
} from './utils/exportUtils';
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
  },
];

const defaultCustomersList: CustomerRecord[] = [
  { id: 'c-1', name: 'ADNISHA TRANSPORT', phone: '9987010013', address: 'Navi Mumbai' },
  { id: 'c-2', name: 'M/s Alembic Pharmaceuticals LTD', phone: '9820011223', address: 'Nhava Sheva Mumbai Allcargo CFS' },
  { id: 'c-3', name: 'CONTINENTAL LOGISTICS', phone: '9820011223', address: 'Nhava Sheva' },
  { id: 'c-4', name: 'SHREE BALAJI ROADWAYS', phone: '9888522803', address: 'Kalamboli' },
];

const defaultVehiclesList: VehicleRecord[] = [
  { id: 'v-1', vehicleNo: 'MH46CL8146', type: '40ft Trailer' },
  { id: 'v-2', vehicleNo: 'MH46DL7778', type: '40ft Trailer' },
  { id: 'v-3', vehicleNo: 'MH46BB1234', type: '20ft Truck' },
];

export const App: React.FC = () => {
  // Document mode: Tax Invoice vs e-LR (Goods Consignment Note)
  const [activeDocType, setActiveDocType] = useState<'invoice' | 'lr'>('invoice');

  // Current active invoice
  const [currentInvoice, setCurrentInvoice] = useState<InvoiceData>(() => defaultInvoice);

  // Current active e-LR Note
  const [currentConsignmentNote, setCurrentConsignmentNote] = useState<ConsignmentNote>(
    () => defaultConsignmentNote
  );

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

  // Saved LR Notes list
  const [consignmentNotes, setConsignmentNotes] = useState<ConsignmentNote[]>(() => {
    try {
      const stored = localStorage.getItem(LOCAL_STORAGE_KEY_LR_NOTES);
      if (stored) return JSON.parse(stored);
    } catch (e) {
      console.error('Error loading LR notes', e);
    }
    return [defaultConsignmentNote];
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

  // UI modals & view states
  const [isSavedModalOpen, setIsSavedModalOpen] = useState(false);
  const [isSavedLRModalOpen, setIsSavedLRModalOpen] = useState(false);
  const [isDirectoryModalOpen, setIsDirectoryModalOpen] = useState(false);
  const [isTripSlipModalOpen, setIsTripSlipModalOpen] = useState(false);
  const [isLedgerModalOpen, setIsLedgerModalOpen] = useState(false);
  const [isBackupModalOpen, setIsBackupModalOpen] = useState(false);
  const [viewMode, setViewMode] = useState<'split' | 'preview' | 'editor'>('split');
  const [zoom, setZoom] = useState<number>(0.92);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isDownloadingPDF, setIsDownloadingPDF] = useState(false);

  // Sync state to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(savedInvoices));
    } catch (e) {}
  }, [savedInvoices]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_LR_NOTES, JSON.stringify(consignmentNotes));
    } catch (e) {}
  }, [consignmentNotes]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers));
    } catch (e) {}
  }, [customers]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLES, JSON.stringify(vehicles));
    } catch (e) {}
  }, [vehicles]);

  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_TRIP_SLIPS, JSON.stringify(tripSlips));
    } catch (e) {}
  }, [tripSlips]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => {
      setToastMessage(null);
    }, 2800);
  };

  // --- INVOICE ACTIONS ---
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

    const nextBillNo = calculateNextBillNumber(updatedList, updated);
    recordBillSequenceNumber(nextBillNo);

    const newInv = createNewInvoice(nextBillNo);
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

  // --- CONSIGNMENT NOTE (e-LR) ACTIONS ---
  const handleSaveLR = () => {
    const updated = { ...currentConsignmentNote, updatedAt: new Date().toISOString() };
    const existingIndex = consignmentNotes.findIndex((n) => n.id === updated.id);

    if (existingIndex >= 0) {
      const copy = [...consignmentNotes];
      copy[existingIndex] = updated;
      setConsignmentNotes(copy);
      showToast(`Updated e-LR #${updated.lrNo} successfully!`);
    } else {
      setConsignmentNotes([updated, ...consignmentNotes]);
      showToast(`Saved e-LR #${updated.lrNo} to records!`);
    }
  };

  const handleNewLR = () => {
    const fresh = createNewConsignmentNote();
    setCurrentConsignmentNote(fresh);
    showToast(`Created new e-LR #${fresh.lrNo}`);
  };

  const handleDuplicateLR = (note: ConsignmentNote) => {
    const randomDigits = Math.floor(10000 + Math.random() * 90000);
    const duplicated: ConsignmentNote = {
      ...note,
      id: 'lr-' + Date.now(),
      lrNo: `0${randomDigits}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setConsignmentNotes([duplicated, ...consignmentNotes]);
    setCurrentConsignmentNote(duplicated);
    showToast(`Duplicated into e-LR #${duplicated.lrNo}`);
  };

  const handleDeleteLR = (id: string) => {
    if (window.confirm('Are you sure you want to delete this e-LR note?')) {
      const filtered = consignmentNotes.filter((n) => n.id !== id);
      setConsignmentNotes(filtered);
      if (currentConsignmentNote.id === id) {
        setCurrentConsignmentNote(filtered.length > 0 ? filtered[0] : createNewConsignmentNote());
      }
      showToast('Deleted e-LR note');
    }
  };

  const handleConvertLRToInvoice = (lr: ConsignmentNote) => {
    const newBillNo = calculateNextBillNumber(savedInvoices, currentInvoice);
    const newInv = createNewInvoice(newBillNo);

    newInv.clientName = lr.consigneeName || lr.consignorName || 'CLIENT TRANSPORT';
    newInv.beNo = lr.lrNo;
    newInv.beDate = lr.date;
    newInv.refDocType = 'LR NO';

    const routeParticular =
      lr.fromLocation && lr.toLocation
        ? `${lr.fromLocation} TO ${lr.toLocation}`
        : lr.description || 'FREIGHT CHARGES';
    const containerStr = lr.containerNo
      ? lr.packagesCount
        ? `${lr.containerNo} ${lr.packagesCount}`
        : lr.containerNo
      : lr.packagesCount || '';

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
        amount: lr.totalFreightAmount || lr.freightAmount || '',
      },
    ];

    setCurrentInvoice(newInv);
    setActiveDocType('invoice');
    showToast(`Created Bill #${newBillNo} from LR #${lr.lrNo}`);
  };

  const handleConvertMultipleLRsToInvoice = (selectedNotes: ConsignmentNote[]) => {
    if (selectedNotes.length === 0) return;
    const nextBillNo = calculateNextBillNumber(savedInvoices);
    const primaryParty =
      selectedNotes[0]?.consigneeName || selectedNotes[0]?.consignorName || 'CONSOLIDATED CLIENT';

    const items = selectedNotes.map((n, idx) => {
      const containerStr = n.containerNo
        ? `${n.containerNo}\n${n.packagesCount || ''}`.trim()
        : n.packagesCount || '';
      const routeText =
        n.fromLocation && n.toLocation
          ? `${n.fromLocation} TO ${n.toLocation}`
          : n.description || 'FREIGHT CHARGES';

      return {
        id: `batch-item-${Date.now()}-${idx}`,
        sn: String(idx + 1),
        date: n.date || currentInvoice.date,
        vehicleNo: n.vehicleNo || '',
        containerNo: containerStr,
        particulars: `LR: ${n.lrNo || '-'} • ${routeText}`.toUpperCase(),
        weight: n.senderWeight || 'FIXED',
        advance: '',
        amount: n.totalFreightAmount || n.freightAmount || ('' as any),
      };
    });

    const lrNumbers = selectedNotes
      .map((n) => n.lrNo)
      .filter(Boolean)
      .join(', ');

    const newInv: InvoiceData = {
      ...createNewInvoice(nextBillNo, currentInvoice.company, currentInvoice.bank),
      clientName: primaryParty,
      beNo: lrNumbers,
      beDate: selectedNotes[0]?.date || new Date().toISOString().slice(0, 10),
      refDocType: 'LR NOS',
      items,
      advanceDeduction: 0,
    };

    setCurrentInvoice(newInv);
    setActiveDocType('invoice');
    showToast(`Created Consolidated Bill with ${selectedNotes.length} LRs!`);
  };

  const handleRestoreFullBackup = (backup: FullSystemBackup, mode: 'replace' | 'merge') => {
    if (mode === 'replace') {
      if (backup.invoices && backup.invoices.length > 0) {
        setSavedInvoices(backup.invoices);
        setCurrentInvoice(backup.invoices[0]);
      }
      if (backup.consignmentNotes && backup.consignmentNotes.length > 0) {
        setConsignmentNotes(backup.consignmentNotes);
        setCurrentConsignmentNote(backup.consignmentNotes[0]);
      }
      if (backup.customers) setCustomers(backup.customers);
      if (backup.vehicles) setVehicles(backup.vehicles);
      if (backup.tripSlips) setTripSlips(backup.tripSlips);
      if (backup.companyProfile) {
        handleSaveAsDefaultProfile(backup.companyProfile);
      }
    } else {
      // Merge unique by ID
      const existingInvIds = new Set(savedInvoices.map((i) => i.id));
      const newInvoices = backup.invoices.filter((i) => !existingInvIds.has(i.id));
      setSavedInvoices([...newInvoices, ...savedInvoices]);

      const existingLRIds = new Set(consignmentNotes.map((l) => l.id));
      const newLRs = backup.consignmentNotes.filter((l) => !existingLRIds.has(l.id));
      setConsignmentNotes([...newLRs, ...consignmentNotes]);

      const existingCustIds = new Set(customers.map((c) => c.id));
      const newCusts = backup.customers.filter((c) => !existingCustIds.has(c.id));
      setCustomers([...newCusts, ...customers]);

      const existingVehIds = new Set(vehicles.map((v) => v.id));
      const newVehs = backup.vehicles.filter((v) => !existingVehIds.has(v.id));
      setVehicles([...newVehs, ...vehicles]);

      const existingSlipIds = new Set(tripSlips.map((s) => s.id));
      const newSlips = backup.tripSlips.filter((s) => !existingSlipIds.has(s.id));
      setTripSlips([...newSlips, ...tripSlips]);
    }
    showToast('Restored backup data successfully!');
  };

  const handleResetToDemo = () => {
    setSavedInvoices([defaultInvoice]);
    setCurrentInvoice(defaultInvoice);
    setConsignmentNotes([defaultConsignmentNote]);
    setCurrentConsignmentNote(defaultConsignmentNote);
    setCustomers(defaultCustomersList);
    setVehicles(defaultVehiclesList);
    setTripSlips(defaultTripSlipsList);
    showToast('Reset to default demo data!');
  };

  // --- UNIFIED EXPORT & PRINT ACTIONS ---
  const handlePrint = () => {
    window.print();
  };

  const handleDownloadPDF = async () => {
    try {
      setIsDownloadingPDF(true);
      showToast(`Generating high-res ${activeDocType === 'lr' ? 'e-LR' : 'Bill'} PDF...`);
      if (activeDocType === 'lr') {
        await downloadConsignmentNotePDF(currentConsignmentNote);
        showToast('e-LR PDF downloaded successfully!');
      } else {
        await downloadInvoicePDF(currentInvoice);
        showToast('Invoice PDF downloaded successfully!');
      }
    } catch (err) {
      console.error(err);
      alert('Could not generate PDF. You can also use the Print button to Save as PDF.');
    } finally {
      setIsDownloadingPDF(false);
    }
  };

  const handleWhatsAppShare = () => {
    if (activeDocType === 'lr') {
      openConsignmentWhatsAppShare(currentConsignmentNote);
    } else {
      openWhatsAppShare(currentInvoice);
    }
  };

  const handleSelectInvoice = (inv: InvoiceData) => {
    setCurrentInvoice(inv);
    showToast(`Loaded Bill #${inv.billNo}`);
  };

  const handleDuplicateInvoice = (inv: InvoiceData) => {
    const newBillNo = calculateNextBillNumber(savedInvoices, inv);
    recordBillSequenceNumber(newBillNo);

    const duplicated: InvoiceData = {
      ...inv,
      id: 'inv-' + Date.now(),
      billNo: newBillNo,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    setSavedInvoices([duplicated, ...savedInvoices]);
    setCurrentInvoice(duplicated);
    showToast(`Duplicated to new Bill #${newBillNo}`);
  };

  const handleDeleteInvoice = (id: string) => {
    const filtered = savedInvoices.filter((inv) => inv.id !== id);
    setSavedInvoices(filtered);
    if (currentInvoice.id === id) {
      setCurrentInvoice(filtered.length > 0 ? filtered[0] : createNewInvoice());
    }
    showToast('Deleted invoice from records');
  };

  const handleUpdateInvoicePayment = (
    id: string,
    status: 'PAID' | 'UNPAID' | 'PARTIAL',
    amountReceived?: number,
    paymentDate?: string,
    paymentMode?: string,
    paymentNotes?: string
  ) => {
    const updates: Partial<InvoiceData> = {
      paymentStatus: status,
      amountReceived,
      paymentDate,
      paymentMode,
      paymentNotes,
    };
    const updatedList = savedInvoices.map((inv) => {
      if (inv.id === id) {
        return { ...inv, ...updates, updatedAt: new Date().toISOString() };
      }
      return inv;
    });
    setSavedInvoices(updatedList);
    if (currentInvoice.id === id) {
      setCurrentInvoice({ ...currentInvoice, ...updates, updatedAt: new Date().toISOString() });
    }
    showToast('Updated payment status!');
  };

  const handleSaveAsDefaultProfile = (comp: any) => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_COMPANY, JSON.stringify(comp));
      showToast('Saved company profile as default template!');
    } catch (e) {}
  };

  const handleLoadOriginalSample = () => {
    if (window.confirm('Reset current template to Swami Krupa Roadlines demo sample?')) {
      if (activeDocType === 'lr') {
        setCurrentConsignmentNote(defaultConsignmentNote);
      } else {
        setCurrentInvoice(defaultInvoice);
      }
      showToast('Loaded demo sample!');
    }
  };

  // Directory handlers
  const handleAddCustomer = (c: Omit<CustomerRecord, 'id'>) => {
    const newCust: CustomerRecord = { ...c, id: 'cust-' + Date.now() };
    setCustomers([...customers, newCust]);
    showToast(`Added ${c.name} to directory!`);
  };

  const handleUpdateCustomer = (c: CustomerRecord) => {
    setCustomers(customers.map((cust) => (cust.id === c.id ? c : cust)));
    showToast(`Updated ${c.name}`);
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(customers.filter((cust) => cust.id !== id));
    showToast('Removed customer from directory');
  };

  const handleAddVehicle = (v: Omit<VehicleRecord, 'id'>) => {
    const newVeh: VehicleRecord = { ...v, id: 'veh-' + Date.now() };
    setVehicles([...vehicles, newVeh]);
    showToast(`Added vehicle ${v.vehicleNo} to fleet!`);
  };

  const handleUpdateVehicle = (v: VehicleRecord) => {
    setVehicles(vehicles.map((veh) => (veh.id === v.id ? v : veh)));
    showToast(`Updated ${v.vehicleNo}`);
  };

  const handleDeleteVehicle = (id: string) => {
    setVehicles(vehicles.filter((veh) => veh.id !== id));
    showToast('Removed vehicle from fleet');
  };

  const handleQuickSaveCustomer = (name: string, phone?: string) => {
    if (!name.trim()) return;
    const exists = customers.some((c) => c.name.toLowerCase() === name.trim().toLowerCase());
    if (!exists) {
      handleAddCustomer({ name: name.trim(), phone: phone?.trim() });
    }
  };

  const handleQuickSaveVehicle = (vehicleNo: string) => {
    if (!vehicleNo.trim()) return;
    const cleanNo = vehicleNo.trim().toUpperCase();
    const exists = vehicles.some((v) => v.vehicleNo.toUpperCase() === cleanNo);
    if (!exists) {
      handleAddVehicle({ vehicleNo: cleanNo, type: 'Transport Fleet' });
    }
  };

  const handleSelectCustomerFromDir = (cust: CustomerRecord) => {
    if (activeDocType === 'lr') {
      setCurrentConsignmentNote((prev) => ({
        ...prev,
        consigneeName: cust.name,
        consigneeGst: cust.gstin || prev.consigneeGst,
        consigneeAddress: cust.address || prev.consigneeAddress,
      }));
    } else {
      setCurrentInvoice((prev) => ({
        ...prev,
        clientName: cust.name,
        clientPhone: cust.phone || prev.clientPhone,
      }));
    }
    setIsDirectoryModalOpen(false);
    showToast(`Applied ${cust.name}`);
  };

  // Trip slips handlers
  const handleSaveTripSlip = (slip: TripSlip) => {
    const existingIndex = tripSlips.findIndex((s) => s.id === slip.id);
    if (existingIndex >= 0) {
      const copy = [...tripSlips];
      copy[existingIndex] = slip;
      setTripSlips(copy);
      showToast(`Updated Trip Slip #${slip.slipNo}`);
    } else {
      setTripSlips([slip, ...tripSlips]);
      showToast(`Saved Trip Slip #${slip.slipNo}`);
    }
  };

  const handleDeleteTripSlip = (id: string) => {
    if (window.confirm('Are you sure you want to delete this trip slip?')) {
      setTripSlips(tripSlips.filter((s) => s.id !== id));
      showToast('Deleted trip slip');
    }
  };

  // Direct canvas edits
  const handleDirectInvoiceFieldUpdate = (field: string, val: any) => {
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

  const handleDirectLRFieldUpdate = (field: string, val: any) => {
    const copy = { ...currentConsignmentNote };
    if (field.startsWith('company.')) {
      const sub = field.replace('company.', '');
      copy.company = { ...copy.company, [sub]: val };
    } else {
      (copy as any)[field] = val;
    }
    setCurrentConsignmentNote(copy);
  };

  return (
    <div className="app-viewport">
      {/* Top Application Header */}
      <HeaderBar
        activeDocType={activeDocType}
        onDocTypeChange={setActiveDocType}
        onNewInvoice={activeDocType === 'lr' ? handleNewLR : handleNewInvoice}
        onSaveInvoice={activeDocType === 'lr' ? handleSaveLR : handleSaveInvoice}
        onSaveAndNextInvoice={activeDocType === 'invoice' ? handleSaveAndNextInvoice : undefined}
        onPrint={handlePrint}
        onDownloadPDF={handleDownloadPDF}
        onWhatsAppShare={handleWhatsAppShare}
        onOpenSavedModal={() => {
          if (activeDocType === 'lr') {
            setIsSavedLRModalOpen(true);
          } else {
            setIsSavedModalOpen(true);
          }
        }}
        onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
        onOpenTripSlipModal={() => setIsTripSlipModalOpen(true)}
        onOpenLedgerModal={() => setIsLedgerModalOpen(true)}
        onOpenBackupModal={() => setIsBackupModalOpen(true)}
        savedCount={savedInvoices.length}
        savedLRCount={consignmentNotes.length}
        zoom={zoom}
        onZoomIn={() => setZoom((z) => Math.min(1.4, z + 0.08))}
        onZoomOut={() => setZoom((z) => Math.max(0.5, z - 0.08))}
        onZoomReset={() => setZoom(0.92)}
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
            {activeDocType === 'lr' ? (
              <ConsignmentNoteEditor
                note={currentConsignmentNote}
                onChange={setCurrentConsignmentNote}
                customers={customers}
                vehicles={vehicles}
                onSaveAsDefaultProfile={handleSaveAsDefaultProfile}
                onConvertToInvoice={handleConvertLRToInvoice}
                onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
              />
            ) : (
              <InvoiceEditor
                invoice={currentInvoice}
                onChange={setCurrentInvoice}
                onSaveAsDefaultProfile={() => handleSaveAsDefaultProfile(currentInvoice.company)}
                customers={customers}
                vehicles={vehicles}
                savedInvoices={savedInvoices}
                onSaveAndNext={handleSaveAndNextInvoice}
                onQuickSaveCustomer={handleQuickSaveCustomer}
                onQuickSaveVehicle={handleQuickSaveVehicle}
                onOpenDirectoryModal={() => setIsDirectoryModalOpen(true)}
              />
            )}
          </aside>
        )}

        {/* Live A4 Document Preview */}
        {viewMode !== 'editor' && (
          <section className="preview-pane-container">
            <div
              className="preview-scaler"
              style={{ transform: `scale(${zoom})`, transformOrigin: 'top center' }}
            >
              {activeDocType === 'lr' ? (
                <ConsignmentNoteDocument
                  note={currentConsignmentNote}
                  isEditableInline={true}
                  onUpdateField={handleDirectLRFieldUpdate}
                />
              ) : (
                <InvoiceDocument
                  invoice={currentInvoice}
                  isEditableInline={true}
                  onUpdateField={handleDirectInvoiceFieldUpdate}
                />
              )}
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
        onExportAll={() => {
          const dataStr =
            'data:text/json;charset=utf-8,' +
            encodeURIComponent(JSON.stringify(savedInvoices, null, 2));
          const anchor = document.createElement('a');
          anchor.href = dataStr;
          anchor.download = `roadlines_invoices_backup_${new Date().toISOString().slice(0, 10)}.json`;
          anchor.click();
          anchor.remove();
        }}
        onImportBackup={(imported) => setSavedInvoices([...imported, ...savedInvoices])}
        onUpdateInvoicePayment={handleUpdateInvoicePayment}
      />

      {/* Saved Consignment Notes (e-LR) Modal */}
      <SavedConsignmentNotesModal
        isOpen={isSavedLRModalOpen}
        onClose={() => setIsSavedLRModalOpen(false)}
        savedNotes={consignmentNotes}
        onSelectNote={(n) => {
          setCurrentConsignmentNote(n);
          setActiveDocType('lr');
          showToast(`Loaded e-LR #${n.lrNo}`);
        }}
        onDuplicateNote={handleDuplicateLR}
        onDeleteNote={handleDeleteLR}
        onConvertToInvoice={handleConvertLRToInvoice}
        onConvertMultipleLRsToInvoice={handleConvertMultipleLRsToInvoice}
        onNewNote={handleNewLR}
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

      {/* Party Ledger & Khata Modal */}
      <PartyLedgerModal
        isOpen={isLedgerModalOpen}
        onClose={() => setIsLedgerModalOpen(false)}
        invoices={savedInvoices}
        customers={customers}
        onUpdatePayment={handleUpdateInvoicePayment}
        onSelectInvoice={(inv) => {
          handleSelectInvoice(inv);
          setActiveDocType('invoice');
        }}
      />

      {/* Backup & Restore Modal */}
      <BackupRestoreModal
        isOpen={isBackupModalOpen}
        onClose={() => setIsBackupModalOpen(false)}
        data={{
          invoices: savedInvoices,
          consignmentNotes: consignmentNotes,
          customers: customers,
          vehicles: vehicles,
          tripSlips: tripSlips,
          companyProfile: currentInvoice.company,
        }}
        onRestoreBackup={handleRestoreFullBackup}
        onResetToDemo={handleResetToDemo}
      />
    </div>
  );
};

export default App;
