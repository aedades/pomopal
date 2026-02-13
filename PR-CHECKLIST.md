# PR Checklist

Follow this for every feature/fix:

## Before Coding
- [ ] Understand the requirement clearly
- [ ] Write/update tests FIRST (TDD when practical)

## Implementation
- [ ] Implement the feature
- [ ] Run tests — all must pass
- [ ] Run build — must succeed
- [ ] Manual smoke test if UI change

## Before Commit
- [ ] Increment version in `VERSION` file (semver)
- [ ] Increment version in `frontend/src/version.ts` (displayed in app)
- [ ] Update `CHANGELOG.md` with what changed
- [ ] Run final `npm test && npm run build`

## Commit
- [ ] Commit with descriptive message
- [ ] Push to trigger CI/CD

## PR Policy
- [ ] Create PR with clear description
- [ ] **Wait for Amanda to approve/merge** — do NOT self-merge

---

## Version Bumping

- **Patch** (0.1.0 → 0.1.1): Bug fixes
- **Minor** (0.1.0 → 0.2.0): New features, backward compatible
- **Major** (0.1.0 → 1.0.0): Breaking changes
