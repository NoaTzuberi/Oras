# Oras 💼

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
  <img width="1512" height="982" alt="image" src="https://github.com/user-attachments/assets/8e909410-fded-44af-a2c6-435808b6a8a8" />

- Add Shift page
  <img width="1512" height="982" alt="image" src="https://github.com/user-attachments/assets/fc3bbd7b-743e-408f-b25a-edb4f4f729f1" />

-Auth Page
<img width="1512" height="982" alt="image" src="https://github.com/user-attachments/assets/627a7509-966f-4a78-92d3-76a33a45acd0" />

-Setting Page

-Shifts Page
<img width="1512" height="982" alt="image" src="https://github.com/user-attachments/assets/2af1e6d9-4d1e-45a3-9c91-e6989babe11a" />

---

## 🚀 Getting Started

```bash
npm install
npm run dev
