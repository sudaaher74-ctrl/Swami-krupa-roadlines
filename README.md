# SWAMI KRUPA ROADLINES - Transport Tax Invoice Generator

A fast, responsive, and pixel-perfect Transport Tax Invoice generation web application built with **React**, **TypeScript**, and **Vite**.

Designed specifically for roadlines & transport businesses to generate, manage, calculate, and print A4 tax invoices matching physical stationery.

---

## 🚛 Features

- **Pixel-Perfect A4 Format**: Replicates the exact layout, serif typography (Times New Roman), bold red header, and table grid.
- **Smart Auto-Calculations**:
  - Auto sums line item amounts into **Bill Total**.
  - Subtracts **Advance** payments to show **Net Balance**.
  - Automatic Indian Rupee Words converter (e.g. `TWENTY THREE THOUSAND EIGHT HUNDRED RUPEES ONLY`).
  - Auto-updates `GST TAX PAYABLE BY [Party Name]`.
- **Dual-Mode Editor**:
  - Interactive sidebar form editor.
  - Direct on-page click-to-edit for quick adjustments.
- **Invoice Management**:
  - Store and manage previous bills in local storage.
  - Search by Bill No, Client Name, Date, Vehicle No, or BE No.
  - 1-click bill duplication.
  - JSON backup Export and Import.
- **Print & PDF**:
  - One-click print-ready A4 layout with crisp borders and colors preserved.

---

## 🛠️ Setup & Development

### 1. Install dependencies
```bash
npm install
```

### 2. Run local development server
```bash
npm run dev
```

### 3. Build for production
```bash
npm run build
```

---

## 📄 License
MIT License
