# 🦈 Shark Credit

![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)
![Firebase](https://img.shields.io/badge/Firebase-Firestore-orange?logo=firebase)
![Tailwind](https://img.shields.io/badge/TailwindCSS-4-06B6D4?logo=tailwindcss)
![License](https://img.shields.io/badge/License-MIT-green)

> **Merchant Portal** — The business-facing dashboard for merchants to create payment links, track invoices, view sales analytics, and manage their account.

## ✨ Features

- 💰 **Sales Dashboard** — Revenue overview, transaction feed with category icons, and daily revenue charts
- 🔗 **Payment Links** — Generate QR-based payment links for customers
- 📋 **Invoice Management** — Track invoices with 6-state lifecycle (UNPAID → PAID → COMPLETED / CANCELED / SUSPENDED / REFUNDED)
- 📊 **Analytics** — AreaChart and BarChart for revenue trends and transaction counts
- 🔔 **Notifications** — Real-time merchant notification feed
- 🏷️ **Category Tracking** — See spending categories of incoming payments (Food, Shopping, etc.)
- 🌙 **Dark Fintech UI** — Consistent glassmorphism theme with the ecosystem

## 🚀 Quick Start

```bash
npm install
cp .env.example .env.local
# Fill in Firebase credentials
npm run dev
```

The app runs on [http://localhost:3001](http://localhost:3001).

## 📁 Project Structure

```
app/(dashboard)/
├── dashboard/       # Sales overview & recent transactions
├── analytics/       # Revenue & transaction charts
├── invoices/        # Invoice list & [id] detail (QR, status)
├── notifications/   # Merchant notification feed
└── layout.tsx       # Dashboard sidebar layout
lib/
├── firebase.ts      # Client SDK
├── firebase-admin.ts # Admin SDK
├── actions/
│   ├── auth.ts      # Merchant authentication
│   └── payments.ts  # Payment link & analytics actions
└── utils.ts         # formatCurrency, getCategoryLabel, etc.
```

## 🔒 Deployment (Vercel)

Security headers are pre-configured in `vercel.json`.

## 📄 License

[MIT](LICENSE) © 2026 Shark Fintech Inc.
