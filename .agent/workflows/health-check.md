---
description: Perform a comprehensive project health check
---

1. **Verify Backend Imports**
   - Run `python backend/scripts/verify_imports.py` to ensure all core modules can be imported without errors.

2. **Check Production Availability**
   - Visit `https://p2phub-frontend-production.up.railway.app/`.
   - Check console for critical errors (excluding 401s if not logged in).
   - Verify the backend health endpoint: `https://p2phub-production.up.railway.app/`.

3. **Audit Frontend Assets**
   - Check the 'Network' tab for any failed (404/500) JS or CSS bundles.
   - Look for malformed SVG path errors in the console.

4. **Security Audit**
   - Run `npm audit` in the `frontend/` directory.
   - Run `safety check` (if installed) or check for outdated critical packages in `backend/`.
