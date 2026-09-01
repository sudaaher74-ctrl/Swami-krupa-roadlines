import { supabase } from './supabase';
import type { InvoiceData, ConsignmentNote, CustomerRecord, VehicleRecord, TripSlip } from '../types/invoice';

// -------------------------
// INVOICES
// -------------------------
export const fetchInvoices = async (): Promise<InvoiceData[]> => {
  const { data, error } = await supabase.from('invoices').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching invoices:', error);
    return [];
  }
  return data.map((d: any) => ({
    ...d,
    id: d.local_id,
    amountReceived: d.amount_received,
    paymentDate: d.payment_date,
    paymentMode: d.payment_mode,
    paymentNotes: d.payment_notes,
    paymentStatus: d.payment_status,
    refDocType: d.ref_doc_type,
    billNo: d.bill_no,
    beNo: d.be_no,
    beDate: d.be_date,
    clientName: d.client_name,
    clientPhone: d.client_phone,
    clientAddress: d.client_address,
    advanceDeduction: d.advance_deduction,
    customAmountInWords: d.custom_amount_in_words,
    customGstPayableBy: d.custom_gst_payable_by,
  }));
};

export const saveInvoice = async (invoice: InvoiceData) => {
  const payload = {
    local_id: invoice.id,
    title: invoice.title,
    client_name: invoice.clientName,
    client_phone: invoice.clientPhone,
    client_address: invoice.clientAddress,
    bill_no: invoice.billNo,
    date: invoice.date,
    be_no: invoice.beNo,
    be_date: invoice.beDate,
    ref_doc_type: invoice.refDocType,
    items: invoice.items,
    company: invoice.company,
    bank: invoice.bank,
    advance_deduction: invoice.advanceDeduction,
    custom_amount_in_words: invoice.customAmountInWords,
    custom_gst_payable_by: invoice.customGstPayableBy,
    payment_status: invoice.paymentStatus,
    amount_received: invoice.amountReceived,
    payment_date: invoice.paymentDate,
    payment_mode: invoice.paymentMode,
    payment_notes: invoice.paymentNotes,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('invoices').upsert(payload, { onConflict: 'local_id' });
  if (error) console.error('Error saving invoice:', error);
  return !error;
};

export const deleteInvoice = async (id: string) => {
  const { error } = await supabase.from('invoices').delete().eq('local_id', id);
  if (error) console.error('Error deleting invoice:', error);
  return !error;
};

// -------------------------
// CONSIGNMENT NOTES
// -------------------------
export const fetchConsignmentNotes = async (): Promise<ConsignmentNote[]> => {
  const { data, error } = await supabase.from('consignment_notes').select('*').order('created_at', { ascending: false });
  if (error) {
    console.error('Error fetching consignment notes:', error);
    return [];
  }
  return data.map((d: any) => ({
    ...d,
    id: d.local_id,
    lrNo: d.lr_no,
    vehicleNo: d.vehicle_no,
    branchName: d.branch_name,
    consignorName: d.consignor_name,
    consignorAddress: d.consignor_address,
    consignorGst: d.consignor_gst,
    fromLocation: d.from_location,
    consigneeName: d.consignee_name,
    consigneeAddress: d.consignee_address,
    consigneeGst: d.consignee_gst,
    toLocation: d.to_location,
    packagesCount: d.packages_count,
    containerNo: d.container_no,
    poNumber: d.po_number,
    senderWeight: d.sender_weight,
    weightCharges: d.weight_charges,
    freightType: d.freight_type,
    freightAmount: d.freight_amount,
    collectionCharges: d.collection_charges,
    doorDeliveryCharges: d.door_delivery_charges,
    biltyCharges: d.bilty_charges,
    insuranceCharges: d.insurance_charges,
    labourCharges: d.labour_charges,
    gstAmount: d.gst_amount,
    totalFreightAmount: d.total_freight_amount,
    freightRemark: d.freight_remark,
    ewayBillNo: d.eway_bill_no,
    invoiceNo: d.invoice_no,
    invoiceDate: d.invoice_date,
    invoiceValue: d.invoice_value,
    deliveryType: d.delivery_type,
    gstPayableBy: d.gst_payable_by,
    copyType: d.copy_type,
  }));
};

export const saveConsignmentNote = async (note: ConsignmentNote) => {
  const payload = {
    local_id: note.id,
    lr_no: note.lrNo,
    date: note.date,
    vehicle_no: note.vehicleNo,
    branch_name: note.branchName,
    consignor_name: note.consignorName,
    consignor_address: note.consignorAddress,
    consignor_gst: note.consignorGst,
    from_location: note.fromLocation,
    consignee_name: note.consigneeName,
    consignee_address: note.consigneeAddress,
    consignee_gst: note.consigneeGst,
    to_location: note.toLocation,
    packages_count: note.packagesCount,
    description: note.description,
    container_no: note.containerNo,
    po_number: note.poNumber,
    sender_weight: note.senderWeight,
    weight_charges: note.weightCharges,
    freight_type: note.freightType,
    freight_amount: note.freightAmount,
    collection_charges: note.collectionCharges,
    door_delivery_charges: note.doorDeliveryCharges,
    bilty_charges: note.biltyCharges,
    insurance_charges: note.insuranceCharges,
    labour_charges: note.labourCharges,
    gst_amount: note.gstAmount,
    total_freight_amount: note.totalFreightAmount,
    freight_remark: note.freightRemark,
    eway_bill_no: note.ewayBillNo,
    invoice_no: note.invoiceNo,
    invoice_date: note.invoiceDate,
    invoice_value: note.invoiceValue,
    delivery_type: note.deliveryType,
    gst_payable_by: note.gstPayableBy,
    copy_type: note.copyType,
    company: note.company,
    updated_at: new Date().toISOString()
  };

  const { error } = await supabase.from('consignment_notes').upsert(payload, { onConflict: 'local_id' });
  if (error) console.error('Error saving LR note:', error);
  return !error;
};

export const deleteConsignmentNote = async (id: string) => {
  const { error } = await supabase.from('consignment_notes').delete().eq('local_id', id);
  if (error) console.error('Error deleting LR note:', error);
  return !error;
};

// -------------------------
// CUSTOMERS
// -------------------------
export const fetchCustomers = async (): Promise<CustomerRecord[]> => {
  const { data, error } = await supabase.from('customers').select('*');
  if (error) return [];
  return data.map((d: any) => ({ ...d, id: d.local_id }));
};

export const saveCustomer = async (c: CustomerRecord) => {
  const { error } = await supabase.from('customers').upsert({ local_id: c.id, name: c.name, phone: c.phone, gstin: c.gstin, address: c.address }, { onConflict: 'local_id' });
  return !error;
};

export const deleteCustomer = async (id: string) => {
  const { error } = await supabase.from('customers').delete().eq('local_id', id);
  return !error;
};

// -------------------------
// VEHICLES
// -------------------------
export const fetchVehicles = async (): Promise<VehicleRecord[]> => {
  const { data, error } = await supabase.from('vehicles').select('*');
  if (error) return [];
  return data.map((d: any) => ({ ...d, id: d.local_id, vehicleNo: d.vehicle_no, driverName: d.driver_name, driverPhone: d.driver_phone }));
};

export const saveVehicle = async (v: VehicleRecord) => {
  const { error } = await supabase.from('vehicles').upsert({ local_id: v.id, vehicle_no: v.vehicleNo, driver_name: v.driverName, driver_phone: v.driverPhone, type: v.type }, { onConflict: 'local_id' });
  return !error;
};

export const deleteVehicle = async (id: string) => {
  const { error } = await supabase.from('vehicles').delete().eq('local_id', id);
  return !error;
};

// -------------------------
// TRIP SLIPS
// -------------------------
export const fetchTripSlips = async (): Promise<TripSlip[]> => {
  const { data, error } = await supabase.from('trip_slips').select('*').order('created_at', { ascending: false });
  if (error) return [];
  return data.map((d: any) => ({
    ...d,
    id: d.local_id,
    slipNo: d.slip_no,
    vehicleNo: d.vehicle_no,
    driverName: d.driver_name,
    driverPhone: d.driver_phone,
    fromLocation: d.from_location,
    toLocation: d.to_location,
    containerNo: d.container_no,
    dieselLiters: d.diesel_liters,
    dieselRate: d.diesel_rate,
    dieselAmount: d.diesel_amount,
    dieselPumpName: d.diesel_pump_name,
    driverAdvance: d.driver_advance,
    tollCharges: d.toll_charges,
    otherExpenses: d.other_expenses,
    totalExpense: d.total_expense,
  }));
};

export const saveTripSlip = async (s: TripSlip) => {
  const payload = {
    local_id: s.id,
    slip_no: s.slipNo,
    date: s.date,
    vehicle_no: s.vehicleNo,
    driver_name: s.driverName,
    driver_phone: s.driverPhone,
    from_location: s.fromLocation,
    to_location: s.toLocation,
    container_no: s.containerNo,
    diesel_liters: s.dieselLiters,
    diesel_rate: s.dieselRate,
    diesel_amount: s.dieselAmount,
    diesel_pump_name: s.dieselPumpName,
    driver_advance: s.driverAdvance,
    toll_charges: s.tollCharges,
    other_expenses: s.otherExpenses,
    remarks: s.remarks,
    total_expense: s.totalExpense,
    company: s.company
  };
  const { error } = await supabase.from('trip_slips').upsert(payload, { onConflict: 'local_id' });
  return !error;
};

export const deleteTripSlip = async (id: string) => {
  const { error } = await supabase.from('trip_slips').delete().eq('local_id', id);
  return !error;
};
