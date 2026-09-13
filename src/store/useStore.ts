import { create } from 'zustand';
import type { InvoiceData, CustomerRecord, VehicleRecord, TripSlip, ConsignmentNote } from '../types/invoice';
import {
  fetchInvoices,
  fetchConsignmentNotes,
  fetchCustomers,
  fetchVehicles,
  fetchTripSlips
} from '../utils/supabaseService';
import {
  defaultInvoice,
  defaultConsignmentNote,
  defaultCompanyProfile
} from '../utils/defaultData';

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

const LOCAL_STORAGE_KEY_INVOICES = 'swami_krupa_saved_invoices_v1';
const LOCAL_STORAGE_KEY_CUSTOMERS = 'swami_krupa_saved_customers_v1';
const LOCAL_STORAGE_KEY_VEHICLES = 'swami_krupa_saved_vehicles_v1';
const LOCAL_STORAGE_KEY_TRIP_SLIPS = 'swami_krupa_trip_slips_v1';
const LOCAL_STORAGE_KEY_LR_NOTES = 'swami_krupa_consignment_notes_v1';

export interface AppState {
  savedInvoices: InvoiceData[];
  consignmentNotes: ConsignmentNote[];
  customers: CustomerRecord[];
  vehicles: VehicleRecord[];
  tripSlips: TripSlip[];

  // Setters
  setSavedInvoices: (invoices: InvoiceData[]) => void;
  setConsignmentNotes: (notes: ConsignmentNote[]) => void;
  setCustomers: (customers: CustomerRecord[]) => void;
  setVehicles: (vehicles: VehicleRecord[]) => void;
  setTripSlips: (slips: TripSlip[]) => void;

  // Actions
  fetchInitialData: () => Promise<{ invs: InvoiceData[], notes: ConsignmentNote[], custs: CustomerRecord[], vehs: VehicleRecord[], slips: TripSlip[] }>;
  resetToDemo: () => void;
}

const getLocalOrDefault = <T,>(key: string, defaultValue: T): T => {
  try {
    const stored = localStorage.getItem(key);
    if (stored) return JSON.parse(stored) as T;
  } catch (e) {
    console.error(`Error loading ${key}`, e);
  }
  return defaultValue;
};

export const useStore = create<AppState>((set, get) => ({
  savedInvoices: getLocalOrDefault<InvoiceData[]>(LOCAL_STORAGE_KEY_INVOICES, [defaultInvoice]),
  consignmentNotes: getLocalOrDefault<ConsignmentNote[]>(LOCAL_STORAGE_KEY_LR_NOTES, [defaultConsignmentNote]),
  customers: getLocalOrDefault<CustomerRecord[]>(LOCAL_STORAGE_KEY_CUSTOMERS, defaultCustomersList),
  vehicles: getLocalOrDefault<VehicleRecord[]>(LOCAL_STORAGE_KEY_VEHICLES, defaultVehiclesList),
  tripSlips: getLocalOrDefault<TripSlip[]>(LOCAL_STORAGE_KEY_TRIP_SLIPS, defaultTripSlipsList),

  setSavedInvoices: (invoices) => {
    set({ savedInvoices: invoices });
    try { localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(invoices)); } catch (e) {}
  },
  
  setConsignmentNotes: (notes) => {
    set({ consignmentNotes: notes });
    try { localStorage.setItem(LOCAL_STORAGE_KEY_LR_NOTES, JSON.stringify(notes)); } catch (e) {}
  },
  
  setCustomers: (customers) => {
    set({ customers });
    try { localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(customers)); } catch (e) {}
  },
  
  setVehicles: (vehicles) => {
    set({ vehicles });
    try { localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLES, JSON.stringify(vehicles)); } catch (e) {}
  },
  
  setTripSlips: (slips) => {
    set({ tripSlips: slips });
    try { localStorage.setItem(LOCAL_STORAGE_KEY_TRIP_SLIPS, JSON.stringify(slips)); } catch (e) {}
  },

  fetchInitialData: async () => {
    const [invs, notes, custs, vehs, slips] = await Promise.all([
      fetchInvoices(),
      fetchConsignmentNotes(),
      fetchCustomers(),
      fetchVehicles(),
      fetchTripSlips(),
    ]);

    const updates: Partial<AppState> = {};

    if (invs.length > 0) updates.savedInvoices = invs;
    if (notes.length > 0) updates.consignmentNotes = notes;
    if (custs.length > 0) updates.customers = custs;
    if (vehs.length > 0) updates.vehicles = vehs;
    if (slips.length > 0) updates.tripSlips = slips;

    if (Object.keys(updates).length > 0) {
      set(updates);
      // Persist to local storage after fetch
      const state = get();
      try {
        if (updates.savedInvoices) localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify(state.savedInvoices));
        if (updates.consignmentNotes) localStorage.setItem(LOCAL_STORAGE_KEY_LR_NOTES, JSON.stringify(state.consignmentNotes));
        if (updates.customers) localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(state.customers));
        if (updates.vehicles) localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLES, JSON.stringify(state.vehicles));
        if (updates.tripSlips) localStorage.setItem(LOCAL_STORAGE_KEY_TRIP_SLIPS, JSON.stringify(state.tripSlips));
      } catch (e) {}
    }
    
    return { invs, notes, custs, vehs, slips };
  },

  resetToDemo: () => {
    const defaultData = {
      savedInvoices: [defaultInvoice],
      consignmentNotes: [defaultConsignmentNote],
      customers: defaultCustomersList,
      vehicles: defaultVehiclesList,
      tripSlips: defaultTripSlipsList,
    };
    set(defaultData);
    
    // Clear local storage arrays
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY_INVOICES, JSON.stringify([defaultInvoice]));
      localStorage.setItem(LOCAL_STORAGE_KEY_LR_NOTES, JSON.stringify([defaultConsignmentNote]));
      localStorage.setItem(LOCAL_STORAGE_KEY_CUSTOMERS, JSON.stringify(defaultCustomersList));
      localStorage.setItem(LOCAL_STORAGE_KEY_VEHICLES, JSON.stringify(defaultVehiclesList));
      localStorage.setItem(LOCAL_STORAGE_KEY_TRIP_SLIPS, JSON.stringify(defaultTripSlipsList));
    } catch(e) {}
  }
}));
