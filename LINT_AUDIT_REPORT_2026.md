# Codebase Lint Audit Report - February 2026

## 1. Executive Summary
**Date**: February 13, 2026  
**Status**: ⚠️ **ACTION REQUIRED**  
**Findings**: 22 Backend Errors (Critical), 32 Frontend Warnings (Medium)

The codebase currently has several critical linting errors in the backend that could lead to runtime crashes due to undefined names and improper imports. The frontend is in better shape but has numerous warnings related to React hooks and unused code that should be addressed to maintain code quality and prevent stale closure bugs.

---

## 2. Detailed Findings

### A. Backend (Python/Ruff & Bandit)
The backend uses `Ruff` for linting and `Bandit` for security analysis.

#### Critical Errors (Ruff)
| Category | Issues | Impact |
| :--- | :--- | :--- |
| **Undefined Names** | `text`, `datetime`, `timedelta`, `asyncio` | **CRITICAL**: Will cause `NameError` at runtime in affected paths. |
| **Redefinitions** | `logging`, `asyncio`, `sys`, `os` | **MEDIUM**: Confuses the interpreter and developers; can lead to subtle bugs. |
| **Logic/Style** | `== None` vs `is None`, `== True` | **LOW**: Violates PEP 8; minor performance/correctness impact. |
| **Unused Code** | Unused variables (`e`, `viral_formulas`) | **LOW**: Visual clutter; potential leftover logic. |

#### Security Findings (Bandit)
- **Error Masking**: Extensive use of `try: ... except: pass`. This is dangerous as it silences potential database or network failures without logging.
- **Weak Randomness**: Usage of `random` for IDs and engagement metrics. (Low severity for this specific use case).

### B. Frontend (TypeScript/ESLint)
The frontend uses `ESLint` with React-specific plugins.

#### Warnings (ESLint)
| Category | Issues | Impact |
| :--- | :--- | :--- |
| **React Hooks** | Missing dependencies in `useEffect` (mostly `t`) | **MEDIUM**: Can lead to stale closures or unexpected behavior during re-renders. |
| **Unused Imports** | 15+ unused components and icons | **LOW**: Increases bundle size and clutter. |
| **Fast Refresh** | Combined exports in Context files | **LOW**: Slows down development by triggering full page reloads. |
| **Unnecessary Deps** | Extra deps in `useMemo` | **LOW**: Causes unnecessary recalculations. |

---

## 3. Implementation Plan

### Phase 1: Stability & Runtime Fixes (Immediate)
*Goal: Eliminate all CRITICAL errors that cause runtime failures.*
1. **Fix Backend Imports**: 
   - Add `from sqlalchemy import text` where missing.
   - Add `import datetime` or `from datetime import datetime, timedelta`.
   - Ensure `import asyncio` is present in all files using `asyncio.gather`.
2. **Resolve Redefinitions**: 
   - Remove duplicate imports of `sys`, `os`, `asyncio`, and `logging`.

### Phase 2: Code Quality & Security Hardening (Short-term)
*Goal: Improve reliability and follow best practices.*
1. **Refactor Error Handling**: Replace `except: pass` with proper logging: `logger.error(f"Error in [Function]: {e}")`.
2. **Standardize Styles**: 
   - Run `ruff check . --fix` to automate `is None` and `is True` fixes.
   - Remove unused variables and f-string prefixes.
3. **Frontend Cleanup**:
   - Manually review and remove unused imports/variables listed in the ESLint report.

### Phase 3: Logic Integrity & DX (Mid-term)
*Goal: Fix hook behavior and developer experience.*
1. **Hook Dependency Audit**: Add missing dependencies (like `t`) to `useEffect` and `useCallback` arrays.
2. **Context Refactoring**: Split Context Providers and Hooks into separate files or use `/* eslint-disable react-refresh/only-export-components */` where appropriate.

---

## 4. Roadmap

| Phase | Duration | Priority | Focus |
| :--- | :--- | :--- | :--- |
| **Phase 1** | 1 Day | 🔥 Critical | Backend Runtime Errors & Imports |
| **Phase 2** | 2 Days | 🛡️ High | Security (Error Masking) & Style Standardization |
| **Phase 3** | 3 Days | 🧹 Medium | Frontend Dependency Arrays & Unused Code |
| **Phase 4** | Ongoing | ⚙️ Low | Linter Rule Expansion (e.g., adding more Ruff rules) |

---

## 5. Progress Checklist

### Backend Stability [ ]
- [ ] Fix `text` undefined in `partner.py`
- [ ] Fix `datetime`/`timedelta` undefined in `partner_service.py`
- [ ] Fix `asyncio` undefined in `referral_service.py`
- [ ] Remove duplicate imports in `diagnose_photos.py`
- [ ] Fix comparison operators (`is None`) codebase-wide

### Backend Quality [ ]
- [ ] Replace `except: pass` with `logger.exception()` in `api/endpoints/`
- [ ] Clean up unused variables in `viral_service.py` and `warmup_service.py`

### Frontend Reliability [ ]
- [ ] Fix `useEffect` dependencies in `App.tsx`
- [ ] Fix `useEffect` dependencies in `SupportChat.tsx`
- [ ] Fix `useEffect` dependencies in `Subscription.tsx`
- [ ] Remove unused Lucide icons across components

### Frontend DX [ ]
- [ ] Resolve Fast Refresh warnings in `Context` files
- [ ] Clean up `useMemo` in `BlogPage.tsx`
