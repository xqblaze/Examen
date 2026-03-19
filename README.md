# Employee Duty Scheduling & Reporting System

## Stack
- Backend: Node.js + Express + Prisma
- Frontend: React (Vite) + Axios + Leaflet
- DB: PostgreSQL
- Docker Compose for local setup

## Quick start (Docker)
1. Copy env:
   - `cp .env.example .env`
2. Start:
   - `docker compose up --build`
3. Open:
   - Frontend: `http://localhost:5173`
   - Backend: `http://localhost:4000/api/health`

## Default manager
- login: `manager`
- password: `12345`

## Local (no Docker)
1. Start Postgres and set `DATABASE_URL`
2. Backend:
   - `cd backend`
   - `npm i`
   - `npm run prisma:dev`
   - `npm run seed`
   - `npm run dev`
3. Frontend:
   - `cd frontend`
   - `npm i`
   - `npm run dev`

## Google integrations (optional)
System runs without Google credentials. When configured via `.env`, it will:
- Google OAuth login
- Create duty events in Google Calendar with reminders (1 day + 1 hour)
- Fetch plant results from Google Sheets
- Generate reports in Google Docs and return a link

