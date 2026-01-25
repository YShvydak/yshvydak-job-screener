# Documentation Update Rules (for AI)

Rules for AI assistants in vibe coding sessions. Be helpful, not annoying.

---

## Core Principle

**Vibe coding = AI handles everything.** Update docs silently when obvious, ask only when uncertain.

---

## When to Update (Just Do It)

Update these docs **without asking** when changes are obvious:

| Change             | Update                      | Example                     |
| ------------------ | --------------------------- | --------------------------- |
| New API endpoint   | `docs/API_REFERENCE.md`     | Added `POST /api/jobs/bulk` |
| File moved/renamed | `docs/ai/FILE_LOCATIONS.md` | Renamed service file        |
| New env variable   | `docs/CONFIGURATION.md`     | Added `NEW_API_KEY` to .env |
| Schema change      | `docs/ARCHITECTURE.md`      | Added column to table       |

---

## When to Ask First

Ask user **before updating** for these:

| Change                      | Why Ask                                 |
| --------------------------- | --------------------------------------- |
| **CLAUDE.md** changes       | Core reference, user should approve     |
| **Breaking changes**        | May need migration guide                |
| **New ADR in DECISIONS.md** | Architectural decision needs user input |
| **Removing documentation**  | Might be intentional                    |

**Template:**

```
📝 Should I update CLAUDE.md to add [change]? (yes/no)
```

---

## When NOT to Update

**Skip documentation updates for:**

- Bug fixes (internal)
- CSS/styling changes
- Refactoring (same public API)
- Dependency updates (minor)
- Typo fixes in code

---

## Dependency Changes (MANDATORY)

**ALWAYS check Context7-MCP before:**

- `npm install <package>`
- `npm update`
- Modifying `package.json` dependencies
- Using new library APIs

**Response:**

```
📚 Checking Context7-MCP for <package>...
✅ Ready to proceed.
```

---

## Project-Specific Triggers

### Always Update When:

- SerpAPI integration changes → `CONCEPT_MAP.md`
- Gemini AI changes → `CONCEPT_MAP.md`
- Job deduplication logic → `ANTI_PATTERNS.md`
- New search profile fields → `API_REFERENCE.md`
- Location handling changes → `DECISIONS.md` (ADR-004)

### Never Update When:

- Tailwind CSS tweaks
- Log message changes
- Comment updates
- Internal refactoring

---

## Quick Reference

| Doc                         | Update When                            |
| --------------------------- | -------------------------------------- |
| `CLAUDE.md`                 | Critical concepts only (ask first)     |
| `docs/ai/FILE_LOCATIONS.md` | Files moved, new key components        |
| `docs/ai/CONCEPT_MAP.md`    | Data flow changed                      |
| `docs/ai/ANTI_PATTERNS.md`  | New pattern found 2+ times             |
| `docs/ai/DECISIONS.md`      | New architectural decision (ask first) |
| `docs/API_REFERENCE.md`     | API changes                            |
| `docs/ARCHITECTURE.md`      | Schema or architecture changes         |
| `docs/QUICKSTART.md`        | Setup process changes                  |

---

## Vibe Coding Summary

```
Obvious change? → Update silently
Core docs (CLAUDE.md, DECISIONS.md)? → Ask first
Trivial change? → Don't update
Dependency change? → Check Context7-MCP first
```

---

**Last Updated:** January 2026
