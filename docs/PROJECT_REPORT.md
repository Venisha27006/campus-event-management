# Campus Event & Registration Management System
## Technical Project Report

---

### 1. Abstract

This project presents the design and implementation of a Campus Event & Registration Management System — a centralized web platform for colleges and universities to manage the complete lifecycle of academic and extracurricular events. The system replaces manual, fragmented processes with a unified digital workflow covering event planning, multi-stage approval, participant registration, capacity management, QR-based attendance, automated certificate generation, feedback collection, analytics, and reporting. The platform is built using a modern full-stack architecture: React with TypeScript on the frontend, Node.js/Express on the backend, and PostgreSQL as the relational database. Role-based access control governs the seven user roles, ensuring each stakeholder interacts only with the functionality appropriate to their position.

---

### 2. Introduction

Educational institutions conduct hundreds of events each academic year spanning technical workshops, cultural festivals, sports meets, placement drives, and guest lectures. Managing these events efficiently presents a persistent challenge: registration is often handled through Google Forms with no capacity control; attendance is taken manually on paper; certificates are issued weeks late; organisers have no analytics; and administrators have no visibility into what is happening across departments.

This project addresses these pain points by providing a single platform where events are proposed, reviewed, published, registered for, attended, evaluated, and archived — with data flowing seamlessly from one stage to the next and every action recorded for accountability.

---

### 3. Problem Statement

**Existing problems in campus event management:**

1. No central repository of events — students miss opportunities
2. Registration via forms with no duplicate checking or capacity enforcement
3. Waitlists managed manually in spreadsheets
4. Attendance marked on paper, frequently lost
5. Certificates issued manually weeks after the event (or not at all)
6. No analytics for organisers or administrators
7. No approval workflow — events published without institutional review
8. No audit trail — no record of who did what, when
9. No notification system — participants unaware of changes

---

### 4. Proposed System

The proposed system provides an end-to-end solution:

- **Centralised event discovery** with search, filter, and recommendation
- **Role-based workflows** from draft through approval to publication
- **Smart registration** with eligibility checks, capacity locks, and automatic waitlisting
- **QR-based attendance** using the device camera, requiring no special hardware
- **Automated certificates** generated as PDFs with public verification
- **Real-time notifications** for all event lifecycle events
- **Analytics dashboards** for administrators and organizers
- **Audit logs** recording every action on the platform

---

### 5. Objectives

1. Build a scalable, multi-role web platform for campus event management
2. Implement a multi-stage event approval workflow
3. Provide real-time capacity management with automatic waitlist promotion
4. Generate unique QR codes per registration for contactless attendance
5. Automate PDF certificate generation and provide public verification
6. Deliver analytics dashboards with charts and performance scoring
7. Implement a notification system with automated event reminders
8. Ensure security through JWT authentication, RBAC, input validation, and audit logging
9. Deploy the application with Docker for portability

---

### 6. Scope

**In scope:**

- Web application (responsive, mobile-friendly)
- Seven user roles with distinct capabilities
- Event CRUD with full lifecycle management
- Multi-stage approval workflow
- Registration with capacity management and waitlisting
- QR code generation and camera-based scanning
- PDF certificate generation and public verification
- In-app notifications and automated reminders
- Analytics dashboards with Recharts visualisations
- CSV report exports
- Audit logging
- Docker-based deployment

**Out of scope:**

- Native mobile application
- Payment gateway integration (abstraction layer provided)
- Real-time messaging between users
- Video streaming for online events

---

### 7. Functional Requirements

| ID | Requirement |
|---|---|
| FR-01 | The system shall allow users to register with email, password, and role |
| FR-02 | The system shall verify user email before allowing login |
| FR-03 | The system shall issue JWT access tokens (15 min) and rotating refresh tokens |
| FR-04 | The system shall enforce role-based access on every API endpoint |
| FR-05 | Authorised users shall be able to create, edit, and delete events |
| FR-06 | Events shall go through a Draft → Pending → Approved → Published workflow |
| FR-07 | Faculty Coordinators shall perform first-stage event review |
| FR-08 | Event Admins shall perform second-stage event review |
| FR-09 | The system shall store all approval decisions with reviewer, date, and reason |
| FR-10 | Students shall be able to register for open events |
| FR-11 | The system shall enforce maximum capacity and prevent duplicate registration |
| FR-12 | The system shall add participants to a waitlist when capacity is full |
| FR-13 | The system shall automatically promote the next waitlisted participant on cancellation |
| FR-14 | The system shall generate a unique QR code per registration |
| FR-15 | Authorised users shall be able to scan QR codes to mark attendance |
| FR-16 | The system shall support manual attendance entry by registration ID |
| FR-17 | The system shall record check-in and check-out timestamps |
| FR-18 | The system shall generate PDF certificates for attendees |
| FR-19 | Certificates shall include a QR code linking to a public verification page |
| FR-20 | Anyone with a certificate token shall be able to verify its authenticity |
| FR-21 | Participants shall be able to submit event feedback with 1–5 star ratings |
| FR-22 | The system shall prevent multiple feedback submissions per user per event |
| FR-23 | The system shall deliver in-app notifications for all lifecycle events |
| FR-24 | The scheduler shall send automated reminders at 7 days, 1 day, and 1 hour |
| FR-25 | Administrators shall have access to a dashboard with platform-wide statistics |
| FR-26 | Organisers shall have access to per-event analytics and performance scores |
| FR-27 | The system shall provide CSV export for registrations and attendance |
| FR-28 | The system shall record an audit log entry for every sensitive action |
| FR-29 | Students shall be able to save events to a wishlist |
| FR-30 | The system shall provide rule-based event recommendations per user |

---

### 8. Non-Functional Requirements

| Category | Requirement |
|---|---|
| **Security** | Passwords hashed with bcrypt (12 rounds); JWT tokens; HTTPS in production; helmet security headers; CORS restricted to frontend URL; rate limiting |
| **Performance** | Paginated API responses; database indexes on frequently queried columns; parallel Prisma queries in analytics; lazy-loaded frontend code |
| **Scalability** | Stateless API — horizontal scaling possible; database connection pooling via Prisma |
| **Reliability** | Audit log failures do not break main flows; email failures are caught and logged; scheduler errors are isolated |
| **Usability** | Responsive layout (mobile ↔ desktop); loading / error / empty states on all pages; toast notifications for all feedback; accessible form labels |
| **Maintainability** | Separation of concerns (controllers / services / utils); TypeScript strict mode; modular Prisma schema; environment-based config |
| **Portability** | Docker Compose deployment; environment variables for all secrets; no hard-coded credentials |
| **Testability** | Integration test suite with 35+ tests; Jest + Supertest; isolated test user cleanup |

---

### 9. System Architecture

The system follows a classic three-tier architecture:

**Presentation Tier** — React SPA served by Nginx (production) or Vite dev server. TanStack Query manages server state and caching. Axios intercepts all outbound requests to attach the JWT access token, and transparently refreshes the token on 401 responses before retrying.

**Application Tier** — Express.js REST API. Middleware chain: Helmet → CORS → Rate Limiter → Body Parser → Route → Auth Guard → Validator → Controller → Service → Prisma. The scheduler runs as a `setInterval` process within the same Node.js process.

**Data Tier** — PostgreSQL 15 with Prisma ORM. All queries are parameterised. Cascade deletes and foreign key constraints maintain referential integrity. Strategic indexes on `status`, `startDate`, `organizerId`, `userId`, and `qrCode` columns.

---

### 10. Entity-Relationship Summary

Core relationships:

```
User ──< UserSession          (1 user, many sessions)
User ──< Registration         (1 user, many registrations)
User ──< Waitlist             (1 user, many waitlist entries)
User ──< Attendance           (1 user, many attendance records)
User ──< Notification         (1 user, many notifications)
User ──< Certificate          (1 user, many certificates)
User ──< Volunteer            (1 user, many volunteer roles)
User ──< Feedback             (1 user, 1 feedback per event)
User ──< Wishlist             (1 user, many wishlisted events)
User ──< AuditLog             (1 user, many log entries)
User ──< EventApproval        (reviewer, many approvals)

Event ──< Registration        (1 event, many registrations)
Event ──< Waitlist            (1 event, many waitlist entries)
Event ──< Attendance          (1 event, many attendance records)
Event ──< EventSession        (1 event, many sessions)
Event >──< Speaker            (many-to-many via EventSpeaker)
Event >──< Tag                (many-to-many via EventTagMapping)
Event ──< Feedback            (1 event, many feedbacks)
Event ──< Certificate         (1 event, many certificates)
Event ──< Notification        (1 event, many notifications)
Event ──< EventApproval       (1 event, approval history)
Event ──< Volunteer           (1 event, many volunteers)

Registration ──── Attendance  (1:1 optional)
Registration ──── Certificate (1:1 optional)

Certificate ──< CertificateVerification (1 cert, many verifications)
Volunteer ──< VolunteerTask   (1 volunteer, many tasks)
```

---

### 11. Key Algorithms and Business Logic

#### Concurrent Registration (Race Condition Prevention)

```typescript
// All reads and writes inside a single Prisma $transaction
// Two users simultaneously claiming the last seat:
// - Both read confirmedCount = 99 (max 100)
// - First transaction commits → count becomes 100
// - Second transaction re-reads inside the same tx → count is 100
// - Second user is placed on waitlist instead
prisma.$transaction(async (tx) => {
  const confirmedCount = await tx.registration.count({ where: { eventId, status: 'CONFIRMED' } });
  if (confirmedCount >= event.maxCapacity) {
    // Add to waitlist
  } else {
    // Create registration
  }
});
```

#### Event Performance Score

```
Score = (registrationFill × 0.30) + (attendanceRate × 0.40) + (feedbackNorm × 0.30)

Where:
  registrationFill = min(registrations / maxCapacity, 1.0) × 100
  attendanceRate   = (checked-in / confirmed) × 100
  feedbackNorm     = (avgRating / 5) × 100

Final score scaled to 0–5:  score / 20
```

#### Waitlist Promotion

When a registration is cancelled:
1. Update registration status to `CANCELLED`
2. Query `waitlist` WHERE `eventId = X` AND `isActive = true` ORDER BY `position ASC` LIMIT 1
3. Create new `Registration` record for that user
4. Update waitlist entry `isActive = false`, `notifiedAt = now()`
5. Send `WAITLIST_PROMOTED` notification
All steps run in a single transaction.

#### Reminder Scheduler

Every 30 minutes, the scheduler checks three time windows:

```
Window  | Target ahead | Tolerance
7 DAYS  | 168 hours    | ±30 min
1 DAY   | 24 hours     | ±30 min
1 HOUR  | 1 hour       | ±15 min
```

For each matching event, it queries confirmed registrations and bulk-creates notifications. A deduplication guard checks whether a notification for that window and event was already created, preventing duplicate sends across scheduler runs.

---

### 12. Security Design

**Authentication flow:**

```
Login → validate credentials → issue accessToken (15m) + refreshToken (7d)
      → store refreshToken in user_sessions with device info and expiry

Request → extract Bearer token → verifyAccessToken → attach user to req
       → 401 if missing or expired

401 response → frontend interceptor → POST /auth/refresh-token
            → rotate: delete old session, create new session
            → retry original request with new accessToken
            → if refresh fails → clear storage → redirect to /login
```

**Role enforcement:**

```typescript
// Middleware chain example for a protected admin route:
router.get('/audit-logs',
  authenticate,           // verifies JWT
  authorize('SUPER_ADMIN'), // checks role
  auditController.getAll
);
```

**Never trust frontend role claims** — the role is read from the JWT payload (signed by the server), not from the request body.

---

### 13. Testing Strategy

The test suite is an integration test — it runs the actual Express app against a real (seeded) PostgreSQL database. This tests the full request-response cycle including middleware, validation, business logic, and database queries.

Test categories:
- **Positive tests**: confirm correct behaviour for valid input
- **Negative tests**: confirm rejection of invalid input, unauthorised access, duplicate data
- **Workflow tests**: simulate multi-step sequences (register → duplicate → approval flow)
- **Business logic tests**: capacity limits, waitlist promotion, venue conflicts

Test isolation: the `afterAll` hook deletes the test user. Seed data created during tests uses time-based unique names/emails to avoid conflicts between test runs.

---

### 14. Deployment Guide

#### Cloud deployment (example: DigitalOcean)

1. Create a Droplet (Ubuntu 22.04, minimum 2 vCPU / 4 GB RAM)
2. Install Docker and Docker Compose
3. Clone the repository
4. Copy `.env.example` to `.env` and fill in production values
5. Run `docker compose up -d`
6. Set up a managed PostgreSQL database (optional — replace Docker postgres service)
7. Point your domain to the Droplet IP
8. Install Certbot for TLS and configure Nginx as a reverse proxy

#### Environment checklist before production

- [ ] `JWT_SECRET` and `REFRESH_TOKEN_SECRET` are 64+ char random strings
- [ ] `DATABASE_URL` points to a managed database with SSL
- [ ] `NODE_ENV=production`
- [ ] `SMTP_*` credentials are configured for email delivery
- [ ] `FRONTEND_URL` and `APP_URL` use `https://` URLs
- [ ] Uploads volume is backed up regularly

---

### 15. Results

The system successfully demonstrates:

| Metric | Value |
|---|---|
| API endpoints | 60+ |
| Database tables | 30+ |
| User roles | 7 |
| Integration tests | 35+ |
| Frontend pages | 25+ |
| Event statuses | 10 |
| Notification types | 11 |
| Charts on dashboards | 4 per admin dashboard |
| Seed events | 10 (varied types, statuses) |
| Seed users | 15 (all roles covered) |

---

### 16. Conclusion

The Campus Event & Registration Management System successfully addresses the identified problems in institutional event management. By providing a unified, role-aware, and workflow-driven platform, it eliminates the need for manual spreadsheets, paper-based processes, and disconnected tools. The system is production-ready, containerised, and designed for extensibility — the payment abstraction layer, ML-ready recommendation engine, and modular service architecture all support future growth without architectural rewrites.

---

### 17. Future Enhancements

1. **Payment integration** — Razorpay/Stripe via the existing payment service abstraction layer
2. **Real-time notifications** — WebSocket channel (Socket.io) replacing the polling interval
3. **ML recommendations** — collaborative filtering model replacing the rule-based engine
4. **PWA support** — offline caching and push notifications via service worker
5. **Multi-institution tenancy** — add `Institution` table; scope all queries by tenant
6. **Redis caching** — cache event lists, dashboard aggregates, and certificate lookups
7. **Cloud storage** — migrate file uploads to S3 or Cloudflare R2
8. **OAuth SSO** — Google/Microsoft sign-in via Passport.js
9. **Advanced PDF reports** — full PDF reports with embedded charts via headless Chrome
10. **Internationalisation** — react-i18next for Tamil, Hindi, and other regional languages
