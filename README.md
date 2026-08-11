# Campus Event & Registration Management System

> **Discover. Register. Participate. Track. Analyze.**

A production-quality, full-stack web application for colleges and universities to plan, approve, publish, manage, and analyze academic and extracurricular events — from initial proposal through attendance, certificates, and reporting.

---

## Table of Contents

1. [Abstract](#abstract)
2. [Problem Statement](#problem-statement)
3. [Proposed Solution](#proposed-solution)
4. [Tech Stack](#tech-stack)
5. [Features](#features)
6. [User Roles](#user-roles)
7. [System Architecture](#system-architecture)
8. [Database Schema](#database-schema)
9. [API Reference](#api-reference)
10. [Project Structure](#project-structure)
11. [Getting Started — Local Development](#getting-started--local-development)
12. [Docker Deployment](#docker-deployment)
13. [Environment Variables](#environment-variables)
14. [Running Tests](#running-tests)
15. [Demo Credentials](#demo-credentials)
16. [Module Descriptions](#module-descriptions)
17. [Security](#security)
18. [Future Enhancements](#future-enhancements)

---

## Abstract

The Campus Event & Registration Management System is a centralized SaaS-style platform that replaces fragmented, manual event management processes in educational institutions. It provides an end-to-end digital workflow covering event creation, multi-stage approval, participant registration with capacity management, QR-based attendance tracking, automated certificate generation, feedback collection, and rich analytics — all accessible through a responsive, role-aware web interface.

---

## Problem Statement

Colleges and universities manage dozens of events annually — hackathons, workshops, placements, cultural festivals, sports meets, and guest lectures — yet most institutions still rely on spreadsheets, paper forms, WhatsApp groups, and manual processes. This leads to:

- No central discovery point for students to find events
- Manual, error-prone registration lists
- No real-time capacity or waitlist management
- Attendance tracked on paper, lost after the event
- Certificates issued weeks late (or not at all)
- Zero analytics for organizers and administrators
- No approval workflow — events published without review

---

## Proposed Solution

A unified platform that handles the **complete event lifecycle**:

```
Draft → Approval → Publication → Registration → Capacity Management
     → Attendance (QR) → Feedback → Certificates → Analytics → Reports
```

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | React 19, TypeScript, Vite, Tailwind CSS |
| State / Fetching | TanStack Query v5, React Hook Form, Zod |
| Charts | Recharts |
| Backend | Node.js, Express 5, TypeScript |
| Database | PostgreSQL 15 via Prisma ORM |
| Auth | JWT access tokens + rotating refresh tokens |
| QR Codes | `qrcode` library + `html5-qrcode` scanner |
| PDF Certificates | PDFKit |
| Email | Nodemailer (SMTP) |
| Container | Docker + Docker Compose |
| Testing | Jest + ts-jest + Supertest |

---

## Features

### Core Platform
- Multi-role authentication (7 roles) with JWT + refresh token rotation
- Email verification, forgot/reset password flows
- Session management — view and revoke active devices
- Role-based access control enforced at API level

### Event Management
- Full event lifecycle: Draft → Pending → Approved → Published → Open → Ongoing → Completed
- Rich event fields: banners, categories, tags, venues, online URLs, eligibility rules
- Multi-stage approval workflow (Faculty → Admin)
- Approval history with reviewer, date, decision, and comments
- Venue conflict detection (overlapping time slots)
- Speaker/organizer conflict detection

### Registration & Capacity
- Smart registration with eligibility validation (department, year, deadline, capacity)
- Database-level transactions preventing race conditions on the final seat
- Automatic waitlist when capacity is full
- Automatic waitlist promotion on cancellation with notification
- Unique QR code generated per registration

### Attendance
- QR code scanner interface (camera-based via `html5-qrcode`)
- Manual check-in by registration ID
- Check-in / check-out time tracking
- Attendance correction with full audit trail
- Real-time attendance statistics (present / absent / rate)

### Certificates
- Automatic PDF certificate generation (PDFKit)
- QR code embedded in certificate linking to public verification page
- Bulk generation for all attendees
- Certificate ID format: `CERT-YYYY-NNNNN`
- Public verification page — no login required

### Analytics & Dashboards
- **Super Admin**: total users, events, registrations, attendance, certificates; category distribution pie chart; monthly registration/event bar and line charts; department participation
- **Organizer**: per-event registration, attendance rates, feedback scores, waitlist counts
- **Event Performance Score**: composite metric (registration fill × 0.3 + attendance rate × 0.4 + feedback rating × 0.3), scaled 0–5

### Notifications
- In-app notification center with unread badge count
- Event-triggered notifications: approval, rejection, registration confirmed/cancelled, waitlist promotion, reminders, venue change, cancellation, certificate available
- Automated reminder scheduler (7 days / 1 day / 1 hour before event)

### Reports
- CSV export: registrations with participant details and attendance status
- Event summary statistics cards
- Per-event attendance, feedback, and certificate data

### Additional
- Wishlist / favourites with one-click registration
- Rule-based event recommendation engine (category history + department + academic year)
- Calendar export (`.ics` file download)
- Volunteer recruitment, approval, task assignment, shift management
- Speaker management with expertise tags
- Session/agenda builder with speaker and room assignment
- Audit log (every important action recorded with user, timestamp, old/new values, IP)
- Global search across events, users, departments, categories
- Server-side pagination on all list endpoints

---

## User Roles

| Role | Key Capabilities |
|---|---|
| **Super Admin** | Full platform control, user management, global analytics, audit logs, system config |
| **Event Admin** | Create/approve/publish events, manage registrations, generate bulk certificates |
| **Faculty Coordinator** | Create department events, approve student-organized events, monitor attendance |
| **Student Organizer** | Propose events, manage volunteers, view registrations, view analytics |
| **Student / Participant** | Browse, register, cancel, wishlist, QR code, certificates, feedback |
| **Volunteer** | View assigned tasks, assist with attendance, scan QR codes |
| **Speaker / Guest** | View assigned events and sessions, upload profile |

---

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Client Browser                        │
│              React SPA (Vite + TypeScript)                   │
│    TanStack Query ← → Axios ← → JWT interceptor              │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS / REST
┌──────────────────────────▼──────────────────────────────────┐
│                     Express API Server                        │
│  Helmet · CORS · Rate Limiting · Multer uploads              │
│                                                               │
│  Routes → Middleware → Controllers → Services                 │
│  (auth, events, registrations, attendance, certificates,      │
│   feedback, notifications, analytics, volunteers, reports)    │
│                                                               │
│  Scheduler (setInterval) — reminder notifications             │
└──────────┬───────────────────────────────────────────────────┘
           │ Prisma ORM
┌──────────▼──────────────┐     ┌─────────────────────────────┐
│     PostgreSQL 15        │     │       File Storage           │
│  Fully normalised schema │     │  /uploads/images             │
│  Foreign keys + indexes  │     │  /uploads/certificates       │
└─────────────────────────┘     └─────────────────────────────┘
```

---

## Database Schema

Key tables (30+ total):

```
users                   — accounts, roles, email verification
user_sessions           — refresh tokens per device
departments             — organisational units
event_categories        — hackathon, workshop, seminar …
venues                  — building / floor / room / capacity / facilities
events                  — full event record with status + approval_status
event_tag_mapping       — many-to-many events ↔ tags
event_approvals         — stage, reviewer, decision, rejection reason
event_sessions          — schedule/agenda per event
speakers                — profile, expertise, photo
event_speakers          — many-to-many events ↔ speakers
registrations           — confirmed / cancelled / waitlisted, QR code
waitlists               — position, promotion timestamp
attendance              — check-in/out time, method (QR / MANUAL)
feedback                — per-event ratings (1–5) + comments
certificates            — PDF URL, verify token, issued date
certificate_verifications — public verification audit trail
notifications           — type, read status, linked event
volunteers              — application, approval, shift
volunteer_tasks         — title, shift, status
wishlists               — user ↔ event saved events
audit_logs              — action, module, old/new value, IP
```

---

## API Reference

### Authentication
```
POST   /api/auth/register          Register new user
POST   /api/auth/login             Login → access + refresh token
POST   /api/auth/refresh-token     Rotate refresh token
POST   /api/auth/logout            Invalidate current session
POST   /api/auth/logout-all        Invalidate all sessions
GET    /api/auth/verify-email      Verify email via token
POST   /api/auth/forgot-password   Send reset email
POST   /api/auth/reset-password    Reset password with token
PUT    /api/auth/change-password   Change password (authenticated)
GET    /api/auth/sessions          List active sessions
```

### Events
```
GET    /api/events                 List events (search, filter, paginate)
GET    /api/events/:id             Get event detail
POST   /api/events                 Create event (multipart/form-data)
PUT    /api/events/:id             Update event
POST   /api/events/:id/submit      Submit for approval
POST   /api/events/:id/review      Approve or reject (reviewer role)
POST   /api/events/:id/publish     Publish approved event
POST   /api/events/:id/cancel      Cancel event
GET    /api/events/:id/stats       Capacity, attendance, feedback stats
GET    /api/events/:id/approval-history  Full approval trail
GET    /api/events/:id/performance Event performance score (0–5)
GET    /api/events/:id/sessions    Agenda / schedule
GET    /api/events/:id/participants Registered participants
GET    /api/events/:id/attendance  Attendance records + stats
GET    /api/events/:id/feedback    Feedback + aggregate ratings
GET    /api/events/:id/volunteers  Volunteer list
```

### Registrations
```
POST   /api/events/:id/register    Register (or join waitlist)
DELETE /api/events/:id/register    Cancel registration
GET    /api/registrations/me       My registrations
GET    /api/registrations/:id/qr   Get QR code (base64 PNG)
```

### Attendance
```
POST   /api/attendance/qr-checkin  Scan QR → mark attendance
POST   /api/attendance/manual-checkin  Manual check-in by ID
POST   /api/attendance/checkout    Record check-out time
PUT    /api/attendance/:id         Correct attendance record
```

### Certificates
```
POST   /api/events/:id/certificates/generate       Generate for self
POST   /api/events/:id/certificates/generate-bulk  Generate for all attendees
GET    /api/certificates/me        My certificates
GET    /api/certificates/verify/:token  Public verification
```

### Dashboard & Analytics
```
GET    /api/dashboard/admin        Super admin overview
GET    /api/dashboard/organizer    Organizer event stats
GET    /api/events/:id/performance Performance score breakdown
```

### Other
```
GET    /api/notifications          Paginated notifications
GET    /api/notifications/unread-count
PUT    /api/notifications/:id/read
PUT    /api/notifications/mark-all-read
GET    /api/users/me               Own profile
PUT    /api/users/me               Update profile
GET    /api/users                  List users (admin)
PUT    /api/users/:id/toggle-status  Activate/deactivate user
GET/POST/PUT  /api/venues
GET/POST      /api/categories
GET/POST      /api/departments
GET/POST      /api/speakers
POST   /api/events/:id/speakers    Assign speaker
GET/POST/PUT/DELETE /api/events/:id/sessions
POST   /api/events/:id/volunteers/apply
PUT    /api/volunteers/:id/approve
POST   /api/volunteers/:id/tasks
PUT    /api/volunteers/tasks/:id
POST/DELETE/GET /api/wishlist/:eventId
GET    /api/recommendations
GET    /api/reports/events/:id/registrations  CSV export
GET    /api/audit-logs             Admin only
```

---

## Project Structure

```
campus-event-management/
├── backend/
│   ├── prisma/
│   │   └── schema.prisma          Complete DB schema (30+ models)
│   ├── src/
│   │   ├── __tests__/
│   │   │   └── api.test.ts        35+ integration tests
│   │   ├── config/
│   │   │   ├── index.ts           Environment config
│   │   │   └── prisma.ts          Prisma client singleton
│   │   ├── controllers/           Request → response layer
│   │   ├── middleware/
│   │   │   ├── auth.ts            JWT authenticate + authorize
│   │   │   ├── errorHandler.ts    Centralised error handler
│   │   │   ├── upload.ts          Multer file upload
│   │   │   └── validate.ts        express-validator wrapper
│   │   ├── routes/
│   │   │   ├── auth.routes.ts
│   │   │   └── index.ts           All API routes
│   │   ├── services/              Business logic layer
│   │   │   ├── auth.service.ts
│   │   │   ├── event.service.ts
│   │   │   ├── registration.service.ts
│   │   │   ├── attendance.service.ts
│   │   │   ├── certificate.service.ts
│   │   │   ├── feedback.service.ts
│   │   │   ├── notification.service.ts
│   │   │   └── analytics.service.ts
│   │   ├── types/index.ts         TypeScript interfaces
│   │   ├── utils/
│   │   │   ├── audit.ts           Audit log helper
│   │   │   ├── email.ts           Nodemailer wrapper
│   │   │   ├── errors.ts          Custom error classes
│   │   │   ├── helpers.ts         Slug, token, sanitize
│   │   │   ├── jwt.ts             Sign / verify tokens
│   │   │   ├── qrcode.ts          QR generation
│   │   │   ├── response.ts        Unified response + pagination
│   │   │   └── scheduler.ts       Reminder cron scheduler
│   │   ├── validators/            express-validator rules
│   │   ├── app.ts                 Express app setup
│   │   └── server.ts              Entry point
│   ├── .env.example
│   ├── Dockerfile
│   ├── jest.config.json
│   ├── package.json
│   └── tsconfig.json
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── components/
│   │   │   ├── events/
│   │   │   │   ├── EventCard.tsx
│   │   │   │   └── EventForm.tsx
│   │   │   ├── layout/
│   │   │   │   ├── AppLayout.tsx  Sidebar + topbar layout
│   │   │   │   └── NotificationBell.tsx
│   │   │   └── ui/
│   │   │       └── index.tsx      Button, Input, Modal, Badge …
│   │   ├── hooks/                 Custom React hooks
│   │   ├── pages/
│   │   │   ├── admin/             ManageEvents, Attendance, Users …
│   │   │   ├── analytics/         AnalyticsPage
│   │   │   ├── auth/              Login, Register, ForgotPwd …
│   │   │   ├── certificates/
│   │   │   ├── dashboard/         Role-aware DashboardPage
│   │   │   ├── events/            EventsPage, EventDetailPage …
│   │   │   ├── profile/           MyRegistrations, Certificates …
│   │   │   └── wishlist/
│   │   ├── routes/index.tsx       Protected + public routes
│   │   ├── services/
│   │   │   ├── api.ts             Axios instance + token refresh
│   │   │   └── index.ts           All API call functions
│   │   ├── store/auth.tsx         AuthContext + AuthProvider
│   │   ├── types/index.ts         TypeScript types
│   │   └── utils/index.ts         cn, formatDate, helpers …
│   ├── .env
│   ├── Dockerfile
│   ├── nginx.conf
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   └── vite.config.ts
│
├── .env.example                   Root env template
├── docker-compose.yml             Full stack compose
└── README.md
```

---

## Getting Started — Local Development

### Prerequisites

- Node.js 20+
- PostgreSQL 15+ (or run via Docker)
- npm

### 1. Clone the repository

```bash
git clone <repo-url>
cd campus-event-management
```

### 2. Start PostgreSQL (Docker — quickest)

```bash
docker run -d \
  --name campus_db \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=campus_events_db \
  -p 5432:5432 \
  postgres:15-alpine
```

### 3. Configure the backend

```bash
cd backend
cp .env.example .env
# Edit .env — set DATABASE_URL and JWT secrets at minimum
```

Minimum `.env` for local development:

```env
DATABASE_URL="postgresql://postgres:password@localhost:5432/campus_events_db"
JWT_SECRET=dev-jwt-secret-at-least-32-chars-long
REFRESH_TOKEN_SECRET=dev-refresh-secret-at-least-32-chars
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
```

### 4. Install dependencies and run migrations

```bash
cd backend
npm install
npx prisma migrate dev --name init
npx prisma generate
```

### 5. Seed the database

```bash
npm run seed
```

This creates:
- 6 departments, 8 event categories, 5 venues
- Super Admin, Event Admin, Faculty, Organizer, and 10 student accounts
- 10 realistic events (upcoming + 1 completed with attendance, feedback, certificates)
- Notifications, registrations, and seed certificates for demo

### 6. Start the backend

```bash
npm run dev
# API running at http://localhost:5000
```

### 7. Configure and start the frontend

```bash
cd ../frontend
# .env already has VITE_API_URL=http://localhost:5000/api
npm install
npm run dev
# App running at http://localhost:5173
```

---

## Docker Deployment

### Quick start (full stack)

```bash
# 1. Copy and fill in the environment file
cp .env.example .env
# Edit .env — set JWT_SECRET, REFRESH_TOKEN_SECRET at minimum

# 2. Start all services
docker compose up -d

# 3. Seed the database (first run only)
docker compose exec backend npm run seed

# 4. Open the app
open http://localhost:5173
```

### Production deployment notes

- Set strong, unique `JWT_SECRET` and `REFRESH_TOKEN_SECRET` (use `openssl rand -hex 64`)
- Configure real SMTP credentials for email delivery
- Mount a persistent volume for `/app/uploads` (already done in `docker-compose.yml`)
- Put an Nginx reverse proxy or a load balancer in front for TLS termination
- The backend runs `prisma migrate deploy` automatically on container start

---

## Environment Variables

### Backend (`backend/.env`)

| Variable | Required | Description |
|---|---|---|
| `DATABASE_URL` | ✅ | PostgreSQL connection string |
| `JWT_SECRET` | ✅ | Access token signing secret |
| `REFRESH_TOKEN_SECRET` | ✅ | Refresh token signing secret |
| `JWT_EXPIRES_IN` | — | Access token TTL (default `15m`) |
| `REFRESH_TOKEN_EXPIRES_IN` | — | Refresh token TTL (default `7d`) |
| `PORT` | — | HTTP port (default `5000`) |
| `NODE_ENV` | — | `development` / `production` / `test` |
| `FRONTEND_URL` | — | CORS origin for the React app |
| `APP_URL` | — | Backend public URL (used in emails) |
| `SMTP_HOST` | — | SMTP server hostname |
| `SMTP_PORT` | — | SMTP port (587 for TLS) |
| `SMTP_USER` | — | SMTP username / email |
| `SMTP_PASS` | — | SMTP password / app password |
| `EMAIL_FROM` | — | From address in sent emails |
| `UPLOAD_DIR` | — | Directory for uploaded files (default `uploads`) |
| `MAX_FILE_SIZE` | — | Max upload bytes (default `5242880` = 5 MB) |

### Frontend (`frontend/.env`)

| Variable | Description |
|---|---|
| `VITE_API_URL` | Backend API base URL (default `http://localhost:5000/api`) |

---

## Running Tests

```bash
cd backend
npm test
```

The test suite (`src/__tests__/api.test.ts`) contains **35+ integration tests** covering:

- Health check
- Auth: registration, login, token refresh, logout, duplicate prevention, validation
- Authorization: role-based route protection
- Events: CRUD, filtering, pagination, stats, 404 handling
- Event approval workflow: draft → submit → review → approval history
- Registration: register, duplicate prevention, participant list, QR code
- Notifications: list, unread count, mark as read
- Dashboard: admin + organizer data shape validation
- Metadata: venues, categories, departments (list + create)
- User profile: get own profile, admin user list, student blocked from admin routes
- Wishlist: add, get, remove
- Certificates: list, public verification
- Speakers and sessions: create + list
- Volunteers: apply + list
- Audit logs: admin access + pagination
- Recommendations: authenticated access
- Attendance: event attendance stats, invalid QR rejection
- Venue conflict detection

```bash
# Run with coverage
npm test -- --coverage
```

---

## Demo Credentials

| Role | Email | Password |
|---|---|---|
| Super Admin | `admin@campus.edu` | `Password@123` |
| Event Admin | `eventadmin@campus.edu` | `Password@123` |
| Faculty Coordinator | `faculty.cse@campus.edu` | `Password@123` |
| Student Organizer | `organizer1@campus.edu` | `Password@123` |
| Student | `student1@campus.edu` | `Password@123` |

All credentials are visible on the login page for demonstration purposes.

---

## Module Descriptions

### Authentication Module
JWT-based stateless auth with rotating refresh tokens. Each refresh generates a new token pair and invalidates the old one. Sessions are stored in `user_sessions` — admins can revoke individual sessions or all sessions at once. Passwords are hashed with bcrypt (12 rounds). Email verification tokens and password reset tokens are single-use UUIDs.

### Event Approval Workflow
Events begin in `DRAFT` status. The organizer submits for approval, moving the status to `PENDING_APPROVAL`. Faculty Coordinators review first (`FACULTY_REVIEW` stage); then Event Admins or Super Admins perform the final `ADMIN_REVIEW`. Any rejection returns the event to `DRAFT` with a recorded reason. Approved events must be explicitly published, opening registration. The full approval history is immutable.

### Registration & Capacity Module
Registration uses a Prisma `$transaction` to prevent race conditions. The confirmed count is read and compared to `maxCapacity` inside the same transaction. If full, the user is automatically added to the waitlist at the next available position. On cancellation, `promoteFromWaitlist` runs in the same transaction — the next eligible person gets a registration record and receives a `WAITLIST_PROMOTED` notification.

### QR Attendance Module
Each registration generates a unique JSON-encoded QR code containing a type discriminator, a registration-specific ID, and a timestamp. Volunteers or organizers use the browser-based camera scanner (`html5-qrcode`) to decode the QR and submit to `POST /api/attendance/qr-checkin`. The API validates the code, checks for duplicates, and records the check-in timestamp with the scanner's user ID for the audit trail.

### Certificate Module
After an event is completed, participants who attended can generate a PDF certificate. PDFKit renders a styled landscape A4 document with the institution name, participant name, event name, date, organizer, certificate ID, and a QR code linking to the public verification page. The `verifyToken` is a UUID stored in the database; the verification endpoint is fully public and logs each verification with IP and timestamp.

### Analytics Module
The analytics service runs parallel Prisma aggregate queries. The event performance score uses weighted factors: registration fill rate (30%), attendance rate (40%), and average feedback rating (30%), producing a 0–5 score with one decimal place. Dashboard data is flattened before sending to the frontend to keep the API response shape simple.

### Reminder Scheduler
A `setInterval` running every 30 minutes checks for events starting in approximately 7 days, 1 day, or 1 hour (with a tolerance window to avoid missed or double triggers). For each window, it looks up confirmed registrations and calls `notificationService.createBulk`. A guard query prevents re-sending the same window's reminder for the same event.

---

## Security

- **Passwords**: bcrypt hash, 12 rounds. Never stored or returned as plain text.
- **JWT**: Short-lived access tokens (15 min). Refresh tokens are rotated on every use and stored server-side for revocation.
- **Input validation**: `express-validator` on all mutation endpoints; Zod on all frontend forms. Frontend validation is supplementary — backend always re-validates.
- **SQL injection**: Prisma parameterises all queries. No raw SQL is used except where explicitly noted.
- **XSS**: `helmet` sets `X-Content-Type-Options`, `X-Frame-Options`, and other protective headers. React escapes all interpolated values by default.
- **CORS**: Restricted to the configured `FRONTEND_URL`.
- **Rate limiting**: `express-rate-limit` applies 200 req/15 min globally and 20 req/15 min on auth routes.
- **File uploads**: MIME type and extension validated; size limited to 5 MB.
- **Sensitive fields**: `passwordHash`, `emailVerifyToken`, and `passwordResetToken` are stripped from every API response via `sanitizeUser()`.
- **Error responses**: Operational errors return user-facing messages. Unhandled errors return a generic 500 message — no stack traces exposed.
- **Audit trail**: Every sensitive action (login, event changes, attendance corrections) writes an immutable audit log record.

---

## Future Enhancements

| Feature | Notes |
|---|---|
| Online payment integration | Payment service layer is already abstracted; connect Razorpay or Stripe |
| Real-time notifications | Replace polling with WebSocket or Server-Sent Events |
| ML-based recommendations | Upgrade rule engine to collaborative filtering |
| Push notifications | PWA service worker + Web Push API |
| Multi-tenant (institution) support | Add `institution` table; scope all queries |
| Mobile app | React Native sharing the same REST API |
| Redis caching | Cache event lists and dashboard aggregates |
| S3 / cloud storage | Replace local `uploads/` with AWS S3 or Cloudflare R2 |
| OAuth login | Google / Microsoft SSO via Passport.js |
| Bulk email campaigns | Event reminders sent as rich HTML emails |
| Advanced reporting | PDF report generation with charts (pdfkit + recharts) |
| International i18n | react-i18next for multilingual support |
