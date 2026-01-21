# Documentation Update Rules (for AI)

Quick rules for AI assistants to know when to proactively suggest documentation updates.

---

## 🎯 Proactive Suggestion Triggers

When you see these changes in code, **proactively suggest** updating docs:

### ✅ ALWAYS Suggest (High Priority)

| Code Change                | Suggest Update                      | Example                               |
| -------------------------- | ----------------------------------- | ------------------------------------- |
| **New REST endpoint**      | docs/API_REFERENCE.md               | `router.post('/api/search/run')`      |
| **API contract change**    | docs/API_REFERENCE.md               | Changed request/response format       |
| **Files moved**            | docs/ai/FILE_LOCATIONS.md           | `mv controllers/ api/v2/controllers/` |
| **New architecture layer** | docs/ARCHITECTURE.md + CLAUDE.md    | New middleware layer added            |
| **Breaking change**        | All relevant docs + migration guide | serpapi_job_id format changed         |

### ⚠️ MAYBE Suggest (Medium Priority)

| Code Change           | Suggest Update               | When                                    |
| --------------------- | ---------------------------- | --------------------------------------- |
| **New feature**       | docs/features/NEW_FEATURE.md | Significant user-facing functionality   |
| **Repeated mistake**  | docs/ai/ANTI_PATTERNS.md     | Seen same bug/pattern 2+ times          |
| **New env variable**  | docs/CONFIGURATION.md        | Added to `.env.example`                 |
| **New key component** | docs/ai/FILE_LOCATIONS.md    | New important service/controller        |
| **New external API**  | docs/ARCHITECTURE.md         | Integrated new external service         |

### ❌ DON'T Suggest (Low Priority)

| Code Change                | Reason                             |
| -------------------------- | ---------------------------------- |
| **Bug fix (internal)**     | Doesn't change architecture or API |
| **UI styling**             | Not architectural                  |
| **Refactoring (internal)** | Public API unchanged               |
| **Dependency update**      | No functionality change            |
| **Typo fixes**             | Trivial                            |

---

## 📝 Suggestion Template

When suggesting documentation update, use this format:

```
✅ Changes complete!

📝 Documentation recommendation:
   Update: docs/API_REFERENCE.md
   Reason: New public endpoint POST /api/search/run

   Shall I update the documentation now? (yes/no/later)
```

**If user says "yes":**

- Update the document immediately
- Confirm: "✅ Updated docs/API_REFERENCE.md"

**If user says "no":**

- Acknowledge: "👍 Skipping documentation update"
- Don't ask again for this change

**If user says "later":**

- Acknowledge: "👍 I'll remind you before committing"
- Remind when user mentions "commit", "pr", or "push"

---

## 🔍 Detection Patterns

### REST Endpoint Detection

```typescript
// Pattern: router.{method}('/api/...')
router.get('/api/jobs');
router.post('/api/search/run');
router.patch('/api/jobs/:id/status');
```

→ **Suggest:** Update docs/API_REFERENCE.md

### File Movement Detection

```bash
# Pattern: mv, git mv, or file path changes
git mv src/controllers src/api/controllers
```

→ **Suggest:** Update docs/ai/FILE_LOCATIONS.md

### Breaking Change Detection

```typescript
// Pattern: Comments with "BREAKING", version bump, algorithm change
// BREAKING CHANGE: serpapi_job_id now includes timestamp
generateJobId(serpapi_id, timestamp) // was: generateJobId(serpapi_id)
```

→ **Suggest:** Update ALL relevant docs + migration guide

### New Feature Detection

```typescript
// Pattern: New feature directory, new route group, new settings
features: {
    aiAnalysis: true, // NEW feature
}
```

→ **Suggest:** Consider creating docs/features/AI_ANALYSIS.md

### Dependency Changes Detection

```bash
# Pattern: npm install, package.json changes, dependency updates
npm install @google/generative-ai
npm update serpapi
```

```json
// package.json changes
"dependencies": {
+   "@google/generative-ai": "^0.1.0"
}
```

→ **ACTION (MANDATORY):** Check Context7-MCP BEFORE proceeding

**Response template:**

```
⚠️ Dependency change detected!

📚 Checking Context7-MCP for latest documentation...
   Package: @google/generative-ai

   [AI fetches docs from Context7-MCP]

   ✅ Context7-MCP checked:
   - Latest version: X.Y.Z
   - Breaking changes: [summary]
   - Best practices: [key points]

   Ready to proceed with installation.
```

**When to trigger:**

- `npm install` command
- `npm update` command
- `package.json` modifications (dependencies, devDependencies)
- Config file changes (tsconfig.json, vite.config.ts, etc.)
- Using new dependency APIs in code

**Priority:** P0 (Critical) - ALWAYS check before proceeding

---

## 🎯 Priority Levels

**P0 (Critical):** Breaking changes, Dependency changes

- Dependency changes: Check Context7-MCP BEFORE proceeding (mandatory)
- Breaking changes: Suggest immediately, insist on update before commit

**P1 (High):** Public API changes

- Suggest immediately
- Allow "later" option

**P2 (Medium):** New features, file movements

- Suggest at end of session
- Easy to decline

**P3 (Low):** Nice to have

- Only suggest if user asks "should I update docs?"
- Don't suggest proactively

---

## 💡 Best Practices for AI

### DO:

- ✅ Suggest updates **at the end** of implementation (not during)
- ✅ Be specific: "Update docs/API_REFERENCE.md section 'Search Endpoints'"
- ✅ Offer to do it: "Shall I update now?"
- ✅ Respect user's choice (yes/no/later)

### DON'T:

- ❌ Interrupt during coding with doc suggestions
- ❌ Suggest for trivial changes
- ❌ Insist if user says "no" (unless P0 breaking change)
- ❌ Ask multiple times for same change

---

## 🔄 Workflow Example

```
User: "Add SerpAPI job search integration"
  ↓
[AI implements feature using /feature-dev]
  ↓
[Feature complete, tests pass]
  ↓
AI: "✅ SerpAPI integration complete!

     📝 Recommendation: Update docs/API_REFERENCE.md
     (new endpoint POST /api/search/run)

     Update now? (yes/no/later)"
  ↓
User: "yes"
  ↓
AI: [Updates docs/API_REFERENCE.md]
    "✅ Documentation updated"
```

---

## 📊 When to Update Which Doc

Quick reference:

| Doc                           | When                                | Example                     |
| ----------------------------- | ----------------------------------- | --------------------------- |
| **CLAUDE.md**                 | Rarely (critical concepts only)     | New top-3 anti-pattern      |
| **docs/ai/ANTI_PATTERNS.md**  | When pattern seen 2+ times          | Common mistake found        |
| **docs/ai/FILE_LOCATIONS.md** | Files moved or new key component    | Moved services/             |
| **docs/ai/CONCEPT_MAP.md**    | Data flow changed                   | New external API integrated |
| **docs/API_REFERENCE.md**     | API changes                         | New endpoint                |
| **docs/ARCHITECTURE.md**      | New architectural pattern           | Added caching layer         |
| **docs/CONFIGURATION.md**     | New env variable                    | Added SERPAPI_KEY           |
| **docs/features/**            | New significant feature             | AI job analysis             |
| **README.md**                 | Major project changes               | New tech stack              |

---

## 🚀 Job Screener Specific Rules

### Always Update When:

1. **New SerpAPI integration changes** → Update CONCEPT_MAP.md + ARCHITECTURE.md
2. **New Gemini AI features** → Update CONCEPT_MAP.md + features/AI_ANALYSIS.md
3. **Job deduplication logic changed** → Update ANTI_PATTERNS.md + ARCHITECTURE.md
4. **New search profile fields** → Update API_REFERENCE.md + CONFIGURATION.md
5. **CV upload/parsing changed** → Update CONCEPT_MAP.md + API_REFERENCE.md

### Never Update When:

1. **Styling changes** (Tailwind CSS tweaks)
2. **Internal refactoring** (same public API)
3. **Minor bug fixes** (doesn't affect architecture)
4. **Log message changes**
5. **Comment updates**

---

**For AI:** Use this guide to be helpful but not annoying. Suggest when it matters, stay quiet when it doesn't.

**Last Updated:** January 2026
