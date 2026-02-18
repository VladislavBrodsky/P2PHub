# Contributing to P2PHub

Welcome! This guide outlines the standards and workflows for developing the P2PHub project.

## 🌿 Branching Strategy

- `main`: Production-ready code.
- `feature/*`: New features and enhancements.
- `fix/*`: Bug fixes and hotfixes.

## 📝 Commit Messages

We follow [Conventional Commits](https://www.conventionalcommits.org/):
- `feat:` for new features.
- `fix:` for bug fixes.
- `docs:` for documentation updates.
- `chore:` for maintenance tasks.

## 🛠 Development Standards

### Backend (Python)
- Use **Ruff** for linting and formatting.
- Ensure all new services and endpoints have type hints.
- Run `python scripts/verify_imports.py` before pushing.

### Frontend (React/TS)
- Use **ESLint** and **Prettier** (via Vite config).
- Prefer functional components and hooks.
- Use `lucide-react` for icons and `framer-motion` for animations.

## 🧪 CI/CD

Every Pull Request triggers:
- **Backend CI**: Linting and import verification.
- **Frontend CI**: Linting and type checking.

Please ensure all checks pass before requesting a review.
