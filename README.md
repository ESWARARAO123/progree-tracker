# Daily Work Tracker - Enterprise Work Update & Productivity Management System

[![Build Status](https://img.shields.io/badge/build-passing-brightgreen)](#)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-19.0-61dafb)](https://react.dev/)
[![FastAPI](https://img.shields.io/badge/FastAPI-0.110.0-009688)](https://fastapi.tiangolo.com/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-16.0-336791)](https://www.postgresql.org/)
[![License](https://img.shields.io/badge/License-MIT-green)](#)

An enterprise-grade, web-based employee status tracking, attendance management, and productivity monitoring platform built for hybrid and distributed organizations.

---

## 🌟 Key Features

1. **Twice-Daily Update Workflow:**
   - **Morning Update (9:00 AM – 12:00 PM):** Select project, task, set planned work deliverables, estimated hours, and flag blockers.
   - **Evening Update (4:00 PM – 10:00 PM):** Report actual completed work, remaining tasks, hours spent, challenges, and next-day preliminary plan.
2. **10:00 PM Auto-Lock & Missed Update Alerts:**
   - At **10:00 PM**, reports permanently lock.
   - Automated Celery background scan identifies delinquent employees and dispatches HTML email notifications (**To: Employee, CC: All System Admins**).
3. **Interactive Attendance & Working Day Calendar:**
   - Color-coded badges for Morning updates (Green), Evening updates (Blue), Leave (Orange), WFH (Purple), Weekend (Muted Grey), and Corporate Holidays (Teal).
   - Accurately computes net working days excluding Saturdays, Sundays, and corporate holidays.
4. **Project & Task Portfolio Management:**
   - Priority levels (`Low`, `Medium`, `High`, `Critical`), completion %, milestone tracking, and overdue task count.
5. **Leave & Work From Home (WFH) Approvals:**
   - Self-service employee requests; Admin review matrix with inline approval/rejection comments.
6. **Executive Dashboard & Reporting:**
   - Recharts productivity graphs, task distribution, submission compliance rate, and CSV/Excel data export.
7. **Security & Governance:**
   - Restricted to corporate email domains (`@company.com`), Role-Based Access Control (RBAC), and immutable JSON audit logging.

---

## 📁 Repository Directory Structure

```
tracker/
├── docs/
│   └── SRS.md                       # Complete Software Requirements Specification
├── database/
│   └── schema.sql                   # Legacy PostgreSQL DDL Script (used only for reference)
├── backend/
│   ├── alembic/                     # Alembic migration environment
│   │   └── versions/                # Versioned migrations (0001_initial)
│   ├── app/
│   │   ├── api/v1/                  # FastAPI Routers (Auth, Updates, Projects, Tasks, etc.)
│   │   ├── core/                    # Security, Password Hashing, JWT & Config Settings
│   │   ├── db/                      # SQLAlchemy Async Engine & init_database bootstrap
│   │   ├── models/                  # SQLAlchemy Data Models
│   │   ├── schemas/                 # Pydantic Request/Response Validation
│   │   ├── services/                # Business Logic & Missed Update Scanners
│   │   ├── tasks/                   # Celery Background Cron Tasks (10 PM Reminder)
│   │   └── main.py                  # FastAPI Entrypoint
│   ├── alembic.ini
│   ├── Dockerfile
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/              # Modals (Morning/Evening, New Project/Task, Leave) & Navbar/Sidebar
│   │   ├── context/                 # AppContext Interactive Mock Engine & State
│   │   ├── pages/                   # Dashboard, Projects, Tasks, Calendar, Leave, Reports, Audit
│   │   ├── types/                   # TypeScript Interfaces
│   │   ├── App.tsx                  # Root Routing & View Switcher
│   │   ├── main.tsx                 # React App Mount
│   │   └── index.css                # Tailwind CSS & Glassmorphism Design System
│   ├── package.json
│   └── vite.config.ts
├── docker-compose.yml               # Multi-container Docker Stack (PostgreSQL, Redis, FastAPI, Celery, React)
└── README.md                        # Master Documentation
```

---

## 🚀 Quick Start Guide

### Prerequisites
- Node.js v18+ and npm
- Python 3.10+
- Docker & Docker Compose (Optional for full stack containerized run)

### Running the Web Application (Frontend SPA)

```bash
cd frontend
npm install
npm run dev
```
Open your browser at `http://localhost:5111`. You can switch between **Admin** and **Employee** roles directly in the top Navbar role switcher to test both administrative and employee permissions!

---

### Running with Docker Compose (Full Stack with PostgreSQL, Redis & Celery)

```bash
docker-compose up --build
```
- **Frontend SPA:** `http://localhost`
- **FastAPI OpenAPI Swagger Docs:** `http://localhost:8000/docs`
- **PostgreSQL Database:** `localhost:5432`

---

## 🗄️ Database Migrations

The schema is managed with **Alembic**. On startup the backend automatically:

1. Creates the application database if it does not exist (`app/db/init_database.py`).
2. Runs `alembic upgrade head` to create/upgrade every table.

You do **not** need to run `database/schema.sql` — it is kept only as a reference for the
original hand-written schema. Migrations are idempotent and can also be applied on top of an
existing `schema.sql`-initialized database.

### Manual migration commands

```bash
cd backend
# Apply all pending migrations
alembic upgrade head

# Create a new migration after changing app/models/*
alembic revision --autogenerate -m "describe change"

# Revert the last migration
alembic downgrade -1
```

Environment variables (`POSTGRES_SERVER`, `POSTGRES_PORT`, `POSTGRES_USER`,
`POSTGRES_PASSWORD`, `POSTGRES_DB`) control which database the migrations target —
same settings the API uses at runtime.

> Note: on a fresh install the first startup seeds the default `ADMIN` / `EMPLOYEE`
> roles and the admin account `admin@sierraedge.ai` (password `admin123`).

---

## 🔐 Security & Domain Rule

- Authentication is locked to official company emails ending in `@company.com`.
- Personal emails (e.g. `@gmail.com`) are rejected at authorization gate.

---

## 📄 License

This software is proprietary enterprise software released under the MIT License.
