---
description: Automate local environment setup for P2PHub
---

1. **Initialize Backend**
   - `cd backend`
   - Create virtual environment: `python -m venv .venv`
   - Install dependencies: `pip install -r requirements.txt`
   - Copy `.env.example` to `.env` (if it exists).

2. **Initialize Frontend**
   - `cd frontend`
   - Install dependencies: `npm install`

3. **Validate Setup**
   - Run `npm run build` in frontend.
   - Run `python scripts/verify_imports.py` in backend.
