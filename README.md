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

1. UML Use Case
@startuml
left to right direction

actor Manager
actor Employee

rectangle "Duty Scheduling System" {

  Manager -- (Approve user)
  Manager -- (Assign duty)
  Manager -- (Manage zones)
  Manager -- (Generate report)

  Employee -- (Register)
  Employee -- (View duties)
  Employee -- (Submit results)

  (Assign duty) ..> (Create calendar event) : <<include>>
  (Submit results) ..> (Store plant data) : <<include>>
  (Generate report) ..> (Export to Google Docs) : <<include>>
}
@enduml
2. UML Class Diagram
@startuml

class User {
  id: String
  login: String
  passwordHash: String
  googleId: String
  displayName: String
  approvedAt: DateTime
}

class Role {
  id: String
  name: String
}

class Duty {
  id: String
  date: DateTime
  interval: DutyInterval
  googleEventId: String
}

class Zone {
  id: String
  name: String
  polygon: JSON
}

class PlantRecord {
  id: String
  species: String
  type: PlantType
  endangered: Boolean
  detectionTime: DateTime
  gpsLat: Decimal
  gpsLng: Decimal
}

User --> Role : has
User --> Duty : assigned
Duty --> Zone : located_in
Duty --> PlantRecord : contains
User --> PlantRecord : creates

@enduml
3.UML Sequence Diagram
@startuml

actor Employee
actor Manager

participant Frontend
participant Backend
database DB
participant GoogleAPI

Employee -> Frontend : Register / Login
Frontend -> Backend : POST /auth
Backend -> DB : Save user
DB --> Backend : OK
Backend --> Frontend : JWT

Manager -> Frontend : Create duty
Frontend -> Backend : POST /duties
Backend -> DB : Save duty
Backend -> GoogleAPI : Create calendar event
GoogleAPI --> Backend : Event ID
Backend --> Frontend : Success

Employee -> Frontend : Submit results
Frontend -> Backend : POST /records
Backend -> DB : Save records

Manager -> Frontend : Generate report
Frontend -> Backend : GET /report
Backend -> DB : Aggregate data
Backend -> GoogleAPI : Create document
Backend --> Frontend : Report link

@enduml
4. UML Deployment Diagram
@startuml

node "Client Browser" {
  component "React App"
}

node "Backend Server" {
  component "Node.js (Express)"
  component "Prisma ORM"
}

node "Database Server" {
  database "PostgreSQL"
}

node "External Services" {
  component "Google OAuth"
  component "Google Calendar"
  component "Google Sheets"
  component "Google Docs"
  component "OpenStreetMap"
}

"React App" --> "Node.js (Express)"
"Node.js (Express)" --> "PostgreSQL"

"Node.js (Express)" --> "Google OAuth"
"Node.js (Express)" --> "Google Calendar"
"Node.js (Express)" --> "Google Sheets"
"Node.js (Express)" --> "Google Docs"

"React App" --> "OpenStreetMap"

@enduml