# Version Control Flow & Best Practices

This project follows [Semantic Versioning (SemVer)](https://semver.org/) and uses `git` tags to mark specific releases.

## Workflow for Updates

1.  **Code Modifications**: Make your changes in the codebase.
2.  **Test**: Ensure changes are stable (verify locally).
4.  **Update Changelog & Section History**:
    -   **Global Changes**: Edit `CHANGELOG.md` under the `[Unreleased]` section.
    -   **Detailed Section Changes**: Edit `SECTION_HISTORY.md` under the specific component header (e.g., "Income Potential"). Add detailed comments about design decisions, bug fixes, and specific lines of code if necessary.
5.  **Bump Version**:
    -   Update `version` in `frontend/package.json`.
    -   Update `version` in `backend/pyproject.toml`.
5.  **Commit**:
    -   Use conventional commits (e.g., `feat: Add new modal`, `fix: Resolve layout bug`).
    -   Include the version bump and changelog update in a release commit if applicable (e.g., `chore: release v1.2.0`).
6.  **Tag**:
    -   Create a git tag for the release: `git tag -a v1.2.0 -m "Release v1.2.0"`.
    -   Push tags: `git push origin v1.2.0`.

## Versioning Scheme (Major.Minor.Patch)

-   **Major (v2.0.0)**: Breaking changes (e.g., API redesign).
-   **Minor (v1.2.0)**: New features (e.g., New earn module).
-   **Patch (v1.1.1)**: Bug fixes (e.g., Fix typo, color adjustment).

## Current Version
**v1.1.0** (Feb 8, 2026) - UI Refinements & Bug Fixes
