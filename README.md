# Oras 💼

🔗 Live Demo: https://oras-o7w7.onrender.com

A full-stack shift management and salary tracking application designed to help users manage their working hours, income, and tax-related calculations in a simple and transparent way.

---

## 📌 About the Project

Oras allows users to log and manage their shifts in a flexible way — either by hourly tracking, manual entry, or by entering a full daily salary.

Based on the collected data, the system automatically calculates:
- Total monthly working hours
- Gross and net income
- Average hourly wage
- Tax deductions and credits based on personal data (e.g. Form 101 points)
- Salary changes based on tax brackets

The application provides a clear financial overview in a centralized dashboard, making it easier for users to understand their real earnings and tax impact.

---

## ✨ Key Features

- 🔐 User authentication and secure login (JWT-based)
- 🕒 Flexible shift tracking (hourly / manual / daily salary input)
- 💰 Automatic salary calculations (gross, net, hourly average)
- 📊 Interactive dashboard with financial insights
- 🧾 Tax credit and deduction calculations based on user profile
- 🌍 Multi-language support (i18n)
- 💻 Desktop-first responsive design
---

## 🧠 Core Functionality

- Users can create and edit shifts dynamically
- System calculates total work hours per month automatically
- Salary is computed based on user-defined wage or daily input
- Tax system adjusts net salary based on personal tax data
- Dashboard aggregates all financial data into one view

---

## 🛠 Tech Stack

- React
- TypeScript
- Vite
- Node.js
- Supabase (Auth + Database)
- Context API
- CSS Modules
- i18n (Internationalization)

---

## 📸 Preview

- Dashboard
<img width="1512" height="898" alt="image" src="https://github.com/user-attachments/assets/4c024f99-b7ec-4876-8b14-08d2c828b622" />

- Add Shift page
<img width="1512" height="896" alt="image" src="https://github.com/user-attachments/assets/81537d47-0d4d-445e-a969-a70b286b02d8" />

-Auth Page
<img width="1512" height="897" alt="image" src="https://github.com/user-attachments/assets/4b007e2a-6cfd-46bb-8058-14e878381179" />

-Setting Page
<img width="958" height="863" alt="image" src="https://github.com/user-attachments/assets/45f31412-07fe-4d46-9d64-100b48f8102b" />

-Shifts Page
<img width="1512" height="897" alt="image" src="https://github.com/user-attachments/assets/756b4576-9177-4c6c-b659-329c1fcd4487" />

---

## 🚀 Getting Started

```bash
npm install
npm run dev
