# P2PHub

A comprehensive ecosystem for P2P trading and partner management, featuring a FastAPI backend and a React (Vite) frontend integrated with Telegram WebApps.

## 🏗 Project Structure

- `backend/`: FastAPI application, database migrations (Alembic), and background workers (TaskIQ).
- `frontend/`: React + Vite application tailored for Telegram Mini Apps.
- `shared/`: (Upcoming) Shared models and constants across frontend and backend.
- `.github/workflows/`: CI/CD configurations for automated testing and deployment.
- `scripts/`: Utility scripts for maintenance and diagnostics.

## 🚀 Quick Start

### Backend
1. `cd backend`
2. `python -m venv .venv`
3. `source .venv/bin/activate` # On Windows: .venv\Scripts\activate
4. `pip install -r requirements.txt`
5. `uvicorn app.main:app --reload`

### Frontend
1. `cd frontend`
2. `npm install`
3. `npm run dev`

## 🛠 Tech Stack

- **Backend**: Python 3.12, FastAPI, SQLModel, PostgreSQL, Redis, TaskIQ.
- **Frontend**: React 18, Vite, TypeScript, Tailwind CSS, Framer Motion.
- **Integration**: Telegram Apps SDK, TonConnect.

## 📜 Documentation

- [Audit Report](file:///Users/grandmaestro/Documents/P2PHub/AUDIT_REPORT.md): Historical audit of issues and fixes.
- [Deployment Guide](file:///Users/grandmaestro/Documents/P2PHub/DEPLOYMENT.md): Instructions for production deployment on Railway.
- [Contributing](file:///Users/grandmaestro/Documents/P2PHub/CONTRIBUTING.md): Guidelines for development.

## ⚖️ License
Proprietary. All rights reserved.
