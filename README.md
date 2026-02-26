# 🦈 Shark Credit

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![Recharts](https://img.shields.io/badge/Recharts-2.12-22d3ee?logo=react)
![License](https://img.shields.io/badge/License-MIT-green)

> **Merchant Portal** — The business-facing dashboard for merchants in the Shark Fintech Ecosystem to create payment links, track B2B invoices, view temporal sales analytics, and manage their store presence.

## ✨ Enhanced Features

- 💰 **Comprehensive Sales Dashboard:** A high-level view showing total revenue, transaction feeds decorated with mapped category icons, and responsive charts visualizing daily inflows.
- 🔗 **QR Payment Link Generator:** Merchants can securely generate trackable QR-based payment links. Consumers using `stare-wallet` scan these links, safely executing an atomic Firestore transaction granting the Merchant immediate funds.
- 📋 **6-State Invoice Management:** Track B2B obligations, specifically system-generated Pro/Enterprise upgrades mapped to the Centralized Treasury. Supports a complex lifecycle: `UNPAID` → `PAID` → `COMPLETED` / `CANCELED` / `SUSPENDED` / `REFUNDED`.
- 📊 **Temporal Analytics:** Visualized natively via Recharts. Supports AreaCharts scaling revenue over time and BarCharts stacking transaction frequencies to expose prime spending patterns.
- 🔔 **Real-Time Notification Feed:** Listens immediately to Firestore `onSnapshot` to trigger UI toasts and feed entries when a customer completes a QR payment or an Admin approves an invoice.
- 🏷️ **Consumer Category Tracking:** Uniquely breaks down incoming customer payments into predefined categories (`FOOD_DRINK`, `SHOPPING`, etc.) to understand customer intent.
- 🌙 **Dark Fintech Aesthetic:** Clean, glassy dark mode aligning consistently with the global ecosystem design language.

## 🚀 Detailed Setup Instructions

Follow these steps to run the `shark-credit` Merchant Portal locally. Note that this app connects to the shared Firebase ecosystem backend.

### 1. Install Dependencies

Ensure you are in the `shark-credit` directory, then install the Node packages:

```bash
cd shark-credit
npm install
```

### 2. Configure Environment Variables

Copy the provided template to create your local environment file:

```bash
cp .env.local.example .env.local
```

Open `.env.local` and configure the following blocks:

- **Firebase Client (`NEXT_PUBLIC_FIREBASE_*`)**: Get these from your Firebase Project Settings > Web App config. This initializes the client SDK.
- **Firebase Admin (`FIREBASE_ADMIN_*`)**: Generate a Service Account JSON from Firebase Project Settings > Service Accounts. Extract the `project_id`, `client_email`, and `private_key` (ensure the private key is properly formatted with `\n` newlines). This allows the server actions to bypass security rules securely.
- **Central Treasury (`TREASURY_UID`)**: Ensure this matches the exact UID of the Central Bank user in your Firebase Auth. This is required to process Pro/Enterprise merchant upgrades.

### 3. Run the Development Server

Once variables are set, boot the Next.js server:

```bash
npm run dev
```

The app will be available at [http://localhost:3001](http://localhost:3001).

## 📁 Repository Structure

```
app/(dashboard)/
├── analytics/       # Massive data aggregation and Recharts views
├── dashboard/       # High-level sales overview & recent transaction ticker
├── invoices/        # B2B Invoice lifecycle tracking & detailed [invoiceId] view
├── notifications/   # Global chronological merchant notification feed
└── layout.tsx       # Sidebar persistent layout
lib/
├── firebase.ts      # Client SDK entrypoint
├── firebase-admin.ts# Admin SDK executing elevated operations safely
├── actions/
│   ├── auth.ts      # Merchant session verification routines
│   └── payments.ts  # Payment link initialization & dynamic querying
└── utils.ts         # Formatting & JSON serialization across bridges
```

## 🔒 Security & Deployment

Security mapping is strictly defined in `vercel.json` enforcing explicit headers natively on edge boundaries:

- `X-Frame-Options: DENY`
- `X-Content-Type-Options: nosniff`
- `Referrer-Policy: strict-origin-when-cross-origin`

## 📄 License

[MIT](LICENSE) © 2026 Shark Fintech Inc.
