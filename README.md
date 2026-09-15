# Campus Chaos — Your Unified College Operating System

Batch C8 — NIE Mysuru. Centralized hub for Lost & Found, real-time messaging,
Room & Lab availability, polls/CR elections, with role-based access
(Admin, Teacher, CR, Student).

## Stack
- Frontend: React 19 via Vite + Tailwind CSS (`client/`)
- Backend: Node + Express REST API + Socket.io (`server/`)
- DB: MongoDB via Mongoose (local now, Atlas when you connect)
- Auth: JWT + bcryptjs, RBAC middleware

## Structure
```
Campus-Chaos/
├── client/   # Vite + React frontend
├── server/   # Express + Socket.io backend
```

## Quick start (2 terminals)

1) Backend:
```bash
cd server
copy .env.example .env   # Windows (or cp on mac/linux), then edit MONGO_URI + JWT_SECRET
npm install
npm run dev              # http://localhost:5000, health: GET /api/health
```

2) Frontend:
```bash
cd client
npm install
npm run dev              # http://localhost:5173 (proxies /api -> :5000)
```

3) Seed demo data (needs MongoDB running):
```bash
cd server
npm run seed
```
Seeds Saaim, Shivam, Shariq, Shreyas + 2 sample Lost & Found items (password: `password123`).

## Connecting GitHub
```bash
cd D:\Campus-Chaos
git init
git add .
git commit -m "chore: scaffold client (Vite+React) and server (Express+Socket.io)"
git branch -M main
git remote add origin https://github.com/<you>/campus-chaos.git
git push -u origin main
```

## Connecting MongoDB
- Local: install MongoDB Community + Compass, keep `MONGO_URI=mongodb://127.0.0.1:27017/campus-chaos`
- Atlas: create free cluster → Network Access allow your IP → get connection string →
  put it in `server/.env` as `MONGO_URI=mongodb+srv://...` → `npm run seed` → `npm run dev`

## API (v1 foundation)
- `GET /api/health`
- `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`
- `GET /api/lost-found?q=&type=&category=&status=`, `GET /api/lost-found/:id`,
  `POST /api/lost-found` (auth + multipart `image`), `POST /api/lost-found/:id/claim`,
  `PATCH /api/lost-found/:id/status`, `DELETE /api/lost-found/:id`
- `GET /api/messages/conversations`, `GET /api/messages/history/:otherUserId`
- Socket.io: `join`, `send_message` → `receive_message`/`message_saved`, `typing`/`stop_typing`, `mark_as_read`, `presence`
