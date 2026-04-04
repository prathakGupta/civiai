# CiviAI

![CiviAI Banner](./client/public/civiai_banner.png)

CiviAI is a state-of-the-art **AI-assisted civic engagement platform**. It bridges the gap between citizens and local authorities by providing a seamless, intelligence-driven workflow for reporting, tracking, and resolving public issues.

---

## 🌟 Key Features

- **🤖 AI-Powered Classification**: Automatic issue categorization and urgency detection using Google Gemini.
- **🛡️ Multi-Portal Access**: Dedicated interfaces for **Citizens**, **Admins**, and **On-Ground Workers**.
- **📈 Impact Intelligence**: Real-time analytics on resolution velocity, community hotspots, and operational efficiency.
- **🔄 Distributed Sync**: Robust data consistency with CRDT-based synchronization for high-availability operations.
- **🖼️ Verification Engine**: Before-and-after visual verification with AI-assisted audit trails.
- **🎨 Premium UI**: A modern, responsive dashboard built with a professional design system.

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React, Vite, Tailwind CSS, Heroicons |
| **Backend** | Node.js, Express, Prisma ORM |
| **Database** | PostgreSQL |
| **AI/ML** | Google Gemini Generative AI (`@google/genai`) |
| **Media** | Cloudinary (Secure Image Hosting) |
| **Security** | RBAC, Armed Response Headers, Rate Limiting |

---

## 📁 Project Structure

```bash
civiai/
├── client/           # React + Vite Frontend
│   ├── src/          # Source code, components, hooks
│   └── public/       # Static assets and icons
├── server/           # Express + Prisma Backend
│   ├── prisma/       # Database schema and migrations
│   └── src/          # API routes, controllers, services
└── docs/             # Technical documentation and guides
```

---

## 🚀 Quick Start

### 1. Prerequisites
- Node.js (v18+)
- PostgreSQL instance
- API Keys: Gemini AI, Cloudinary

### 2. Installation
Run the root install script to set up both client and server:
```bash
npm run install:all
```

### 3. Environment Setup
Create a `.env` file in the `server/` directory based on the deployment guide.

### 4. Direct Start
```bash
npm run start
```
This will concurrently start the backend (Port 5000) and frontend (Port 5173).

---

## 📚 Documentation Index

- 📖 [Setup Guide](./docs/SETUP_GUIDE.md) - Step-by-step local development setup.
- 🏗️ [Architecture](./docs/ARCHITECTURE.md) - Deep dive into systems and patterns.
- 🔌 [API Contract](./docs/API_CONTRACT.md) - RESTful endpoint documentation.
- 🗄️ [Database Schema](./docs/DB_SCHEMA.md) - ER diagrams and model definitions.
- 🧪 [Testing](./docs/TESTING.md) - CI/CD and manual test suites.
- 🚀 [Deployment](./docs/DEPLOYMENT.md) - Production rollout instructions.

---

## 🔐 Security & Access Control

CiviAI implements a strict **Role-Based Access Control (RBAC)** system:
- **Citizens**: Report issues, view public impact, track personal reports.
- **Workers**: Receive tasks, update on-ground progress, submit resolution evidence.
- **Admins**: Full operational control, audit verification, and intelligence oversight.

---

*Built with ❤️ for a better, more connected city.*
