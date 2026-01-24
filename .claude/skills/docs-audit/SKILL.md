---
name: docs-audit
description: Audit documentation quality for vibe coding. Use when checking if docs are up-to-date, verifying documentation accuracy, or before starting new development session. Checks CLAUDE.md, docs/ai/, and code alignment.
disable-model-invocation: true
allowed-tools: Read, Glob, Grep, Bash(wc:*), Bash(find:*)
context: fork
agent: Explore
---

# Documentation Audit for Vibe Coding

Perform comprehensive documentation audit to ensure optimal Claude Code CLI experience.

## Audit Checklist

### 1. Token Budget Analysis
Check each documentation file:
- `CLAUDE.md` - Target: <300 lines, <2500 tokens
- `docs/ai/*.md` - Target: <200 lines each
- Total docs/ai/ - Target: <1500 lines total

**Action:** Count lines in each file, calculate approximate tokens (lines × 8).

### 2. Code-Documentation Alignment

**Check FILE_LOCATIONS.md against actual structure:**
```
Compare documented paths with:
- packages/server/src/**/*.ts
- packages/web/src/**/*.tsx
- shared/src/**/*.ts
```

**Check CONCEPT_MAP.md flows against actual code:**
- SerpAPI parameters in search.service.ts
- Gemini integration in ai.service.ts
- Repository methods match documented patterns

### 3. Outdated References Detection

Search for potentially outdated references:
- `features/` folder references (we use `pages/`)
- Wrong port numbers (should be 3000, 3001)
- `NOT NULL` for location (now optional)
- Missing `hl: 'en'` parameter documentation

### 4. Missing Documentation

Check if documented:
- All API endpoints in API_REFERENCE.md
- All environment variables in CONFIGURATION.md
- Recent architectural decisions in DECISIONS.md

### 5. Vibe Coding Readiness

Verify new chat can quickly understand:
- [ ] CLAUDE.md has critical context in first 50 lines
- [ ] Anti-patterns are specific with code examples
- [ ] File locations match actual structure
- [ ] Concept flows are accurate

## Output Format

Generate report:

```markdown
# Documentation Audit Report

## Summary
- Total lines: X
- Estimated tokens: X
- Status: ✅ Good / ⚠️ Needs attention / ❌ Critical issues

## Token Budget
| File | Lines | Tokens | Status |
|------|-------|--------|--------|
| CLAUDE.md | X | X | ✅/⚠️/❌ |
| ... | ... | ... | ... |

## Alignment Issues
- [ ] Issue 1: description
- [ ] Issue 2: description

## Outdated References
- File:Line - "outdated text" → should be "correct text"

## Missing Documentation
- Missing: X

## Recommendations
1. Priority 1: ...
2. Priority 2: ...

## Vibe Coding Score: X/10
```

## Execution Steps

1. Read all documentation files
2. Count lines and estimate tokens
3. Compare FILE_LOCATIONS.md with actual file structure
4. Search for known outdated patterns
5. Check API_REFERENCE.md completeness
6. Generate actionable report
7. Provide specific fix recommendations

**Important:** Focus on what matters for vibe coding - can a new Claude Code session quickly understand the project?
