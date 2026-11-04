# 🎓 Campus Chaos — Unified College Operating System

> **Batch C8 — The National Institute of Engineering (NIE), Mysuru.**  
> A centralized, real-time operating system for campus life — unifying Lost & Found, live chat & peer messaging, room & lab availability tracking, transparent student polls & CR elections, and administrative governance with granular role-based access control (Admin, Teacher, CR, Student).

---

## 👥 Authors & Credits

Campus Chaos was designed and developed by:

- **Shivam Kumar** ([@shivamkumar1103](https://github.com/shivamkumar1103))
- **Saaim Khan** ([@saaimkhan2006](https://github.com/saaimkhan2006))

---

## ✨ Features

- 🔍 **Lost & Found Hub**: Post lost/found items with image attachments, categories, claiming workflow, and verification.
- 💬 **Real-time Messaging**: Instant peer-to-peer messaging, live presence indicators, typing status, conversation histories, and unread badges powered by Socket.io.
- 🏫 **Room & Lab Availability**: Live tracking of campus classrooms, laboratories, and dynamic timetable scheduling.
- 🗳️ **Polls & CR Elections**: Class representative nominations, real-time voting, and transparent election results.
- 🛡️ **Role-Based Access Control (RBAC)**: Distinct views and capabilities tailored for **Students**, **CRs**, **Faculty**, and **Admins**.
- ✉️ **Secure Authentication**: JWT with secure HTTP-only cookies, bcrypt password hashing, and email verification support.

---

## 🛠️ Tech Stack

### Frontend
- **Framework**: React 19 via Vite
- **Styling**: Tailwind CSS
- **Icons & UI**: Lucide React
- **Real-Time Client**: Socket.io-client

### Backend
- **Runtime**: Node.js & Express REST API
- **WebSockets**: Socket.io
- **Database**: MongoDB via Mongoose
- **Authentication**: JWT (JSON Web Tokens) with `httpOnly` cookies & bcryptjs
- **File Uploads**: Multer
- **Mailing**: Nodemailer (Mailtrap for development / Brevo for production)

---

## 📂 Project Structure

```text
Campus-Chaos/
├── client/                 # Frontend React 19 + Vite application
│   ├── src/
│   │   ├── features/       # Feature slices (admin, auth, lost-found, messaging, polls, rooms)
│   │   ├── components/     # Shared UI components
│   │   ├── context/        # React context providers (Auth, Socket)
│   │   └── ...
├── server/                 # Backend Node.js Express REST API & WebSockets
│   ├── controllers/        # Request handlers
│   ├── models/             # Mongoose schemas (User, LostFound, Room, Poll, Message, etc.)
│   ├── routes/             # Express API routes
│   ├── middleware/         # Auth, RBAC, and error handlers
│   ├── seed/               # Database seed scripts
│   └── socket/             # Socket.io event handlers
```

---

## 🚀 Quick Start

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+ recommended)
- [MongoDB](https://www.mongodb.com/) (local daemon or MongoDB Atlas cluster URI)

---

### 1. Backend Setup

```bash
cd server

# Copy environment template
cp .env.example .env    # On Windows: copy .env.example .env

# Install dependencies
npm install

# Seed demo data (users, rooms, timetable, sample items)
npm run seed

# Start development server (runs on http://localhost:5000)
npm run dev
```

> **Demo Credentials (after seeding):**
> - **Student (Shivam):** `2024cs_shivamkumar_c@nie.ac.in` / `password123`
> - **Student (Saaim):** `2024cs_saaimkhan_c@nie.ac.in` / `password123`
> - **Admin:** `admin@nie.ac.in` / `admin123`

---

### 2. Frontend Setup

```bash
# In a new terminal window
cd client

# Install dependencies
npm install

# Start Vite development server (runs on http://localhost:5173)
npm run dev
```

The frontend Vite server automatically proxies `/api` calls and WebSockets to `http://localhost:5000`.

---

## 🌐 API Overview

| Route | Method | Description |
|---|---|---|
| `/api/health` | `GET` | Health check probe |
| `/api/auth/register` | `POST` | Register a new user |
| `/api/auth/login` | `POST` | Authenticate user & issue cookie / JWT |
| `/api/auth/me` | `GET` | Fetch currently authenticated user session |
| `/api/lost-found` | `GET`, `POST` | Query items or submit new item (with image) |
| `/api/lost-found/:id/claim` | `POST` | Claim an item |
| `/api/messages/conversations` | `GET` | List active user message threads |
| `/api/messages/history/:id` | `GET` | Fetch chat history with specific user |
| `/api/rooms` | `GET` | Check room availability & timetables |
| `/api/polls` | `GET`, `POST` | View and create election / campus polls |
| `/api/admin/*` | `*` | Administrative management & analytics |
