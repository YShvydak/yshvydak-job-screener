# AI-Assisted Development Documentation

This directory contains AI-specific documentation optimized for Claude Code and other AI assistants.

## 🎯 Purpose

These documents provide **detailed technical context** that complements the quick reference in [CLAUDE.md](../../CLAUDE.md). They contain:

- Code examples (wrong vs. right patterns)
- Complete file structures with annotations
- Visual flow diagrams with detailed explanations
- Project-specific rules and conventions

## 📚 Documentation Index

### [FILE_LOCATIONS.md](FILE_LOCATIONS.md)

**When to read:** When searching for specific components or files

**Contents:**

- Complete backend file structure (Layered Architecture)
- Complete frontend file structure (Feature-Based)
- Quick find examples for common questions
- Architecture pattern examples

**Size:** ~300 lines | **Read time:** 10-15 minutes

**Quick preview:**

```
"Where is SerpAPI integration?" → services/search.service.ts
"Where is Gemini AI analysis?" → services/ai.service.ts
"Where is job deduplication?" → repositories/job.repository.ts
"Where are React pages?" → packages/web/src/pages/
```

---

### [ANTI_PATTERNS.md](ANTI_PATTERNS.md)

**When to read:** When implementing features or fixing bugs

**Contents:**

- Common anti-patterns with code examples
- Backend anti-patterns (repository bypass, duplicates, etc.)
- Frontend anti-patterns (hardcoded values, duplication, etc.)
- Wrong vs. Right comparisons
- Why each pattern matters

**Size:** ~200 lines (will grow) | **Read time:** 10 minutes

**Quick preview:**

```
❌ Bypassing Repository Layer
❌ Not Preventing Job Duplicates
❌ Hardcoding API Keys
❌ Skipping Context7-MCP
❌ Duplicating Constants
... more patterns will be added
```

---

### [CONCEPT_MAP.md](CONCEPT_MAP.md)

**When to read:** When understanding system flows and dependencies

**Contents:**

- Complete job search flow (manual trigger)
- AI analysis flow (optional)
- Key dependency relationships
- Visual diagrams with detailed explanations

**Size:** ~250 lines | **Read time:** 10-15 minutes

**Quick preview:**

```
Manual Search: User → SearchService → SerpAPI
  → JobRepository → Optional AIService
  → Frontend update

Dependencies:
- Job Deduplication ← serpapi_job_id uniqueness
- AI Analysis ← CV content from settings
```

---

### [DOCUMENTATION_UPDATE_RULES.md](DOCUMENTATION_UPDATE_RULES.md)

**When to read:** For AI assistants - when to suggest doc updates

**Contents:**

- Proactive suggestion triggers
- Detection patterns for changes
- Priority levels for updates
- Suggestion templates
- Workflow examples

**Size:** ~150 lines | **Purpose:** Guide AI to be helpful but not annoying

**For AI:** Use this to know when to proactively suggest documentation updates during development sessions.

---

### [DECISIONS.md](DECISIONS.md)

**When to read:** When understanding why architectural decisions were made

**Contents:**

- Architecture Decision Records (ADRs)
- Context and rationale for each decision
- Consequences and trade-offs
- Key decisions: SQLite, SerpAPI, Gemini AI, Location optional, Layered Architecture

**Size:** ~350 lines | **Read time:** 10-15 minutes

**Quick preview:**

```
ADR-001: SQLite for Data Storage → Self-hosted, single user
ADR-002: SerpAPI for Job Search → Google Jobs aggregation
ADR-003: Gemini AI for Analysis → Free tier available
ADR-004: Location Made Optional → Global search support
ADR-005: Layered Architecture → Clean separation
```

---

## 🚀 Quick Start for New Chats

### Step 1: Read CLAUDE.md (3 minutes)

```
Located at: ../../CLAUDE.md
Contains: 6 critical concepts + quick navigation + /feature-dev usage
```

### Step 2: Use `/feature-dev` skill

```
Primary skill for development:
/feature-dev add search profiles management
```

### Step 3: Check Project-Specific Rules

```
CLAUDE.md contains mandatory rules:
- Layered Architecture (NEVER bypass)
- Job Deduplication (ALWAYS check)
- Context7-MCP (ALWAYS check for dependencies)
```

### Step 4: Deep Dive When Needed

```
Need anti-patterns? → Read ANTI_PATTERNS.md
Need file location? → Read FILE_LOCATIONS.md
Need flow diagram? → Read CONCEPT_MAP.md
```

---

## 📊 Token Usage

| Document                           | Lines | Tokens (approx) | When to Read              |
| ---------------------------------- | ----- | --------------- | ------------------------- |
| **CLAUDE.md**                      | 250   | 2,000           | ✅ **Always (startup)**   |
| **FILE_LOCATIONS.md**              | 170   | 1,400           | When searching            |
| **ANTI_PATTERNS.md**               | 200   | 1,500           | When coding               |
| **CONCEPT_MAP.md**                 | 280   | 2,000           | When understanding flows  |
| **DECISIONS.md**                   | 350   | 2,500           | When understanding "why"  |
| **DOCUMENTATION_UPDATE_RULES.md**  | 150   | 1,200           | For AI assistants         |

**Total:** ~1,400 lines, ~10,600 tokens (split across 6 files)

**Strategy:** Load CLAUDE.md first (2,500 tokens), then read specific AI docs on demand.

---

## 🎯 Usage Patterns

### Pattern 1: New Feature Implementation

```
1. Read CLAUDE.md → Get critical context (3 min)
2. Use /feature-dev → Built-in skill for development
3. Follow project rules → Layered Architecture, Job Deduplication
4. Check ANTI_PATTERNS.md → Avoid common mistakes (5 min)
5. Start coding with confidence
```

### Pattern 2: Bug Fixing

```
1. Read CLAUDE.md → Understand architecture (3 min)
2. Read FILE_LOCATIONS.md → Find relevant files (5 min)
3. Read ANTI_PATTERNS.md → Check if bug matches known pattern (5 min)
4. Fix with proper approach
```

### Pattern 3: Understanding System Flow

```
1. Read CLAUDE.md → Quick concept flow (3 min)
2. Read CONCEPT_MAP.md → Detailed flows (10 min)
3. Read FILE_LOCATIONS.md → See implementation locations (5 min)
4. Complete understanding achieved
```

---

## 🔧 Maintenance

### When to Update

**FILE_LOCATIONS.md:**

- When adding new key components
- When moving files
- When restructuring features

**ANTI_PATTERNS.md:**

- After finding new anti-patterns in code reviews
- After fixing major bugs
- When discovering better approaches

**CONCEPT_MAP.md:**

- When changing system flows
- When adding feature dependencies
- When architectural patterns change

**DOCUMENTATION_UPDATE_RULES.md:**

- When documentation strategy changes
- Rarely (stable reference)

### Update Checklist

Before committing updates:

- [ ] Code examples tested and accurate
- [ ] File paths verified
- [ ] Cross-references valid
- [ ] CLAUDE.md links updated if needed
- [ ] Token counts updated
- [ ] "Last Updated" date changed

---

## 📖 Related Documentation

### Main Documentation

- [CLAUDE.md](../../CLAUDE.md) - Quick reference for AI development
- [README.md](../../README.md) - Project overview and setup
- [requirements.md](../../requirements.md) - Product specification

### Technical Documentation

- [ARCHITECTURE.md](../ARCHITECTURE.md) - Complete system architecture
- [DEVELOPMENT.md](../DEVELOPMENT.md) - Development guidelines
- [API_REFERENCE.md](../API_REFERENCE.md) - API endpoints reference
- [CONFIGURATION.md](../CONFIGURATION.md) - Environment configuration

### Feature Documentation

- [docs/features/](../features/) - Feature-specific deep dives (will be added)

---

## 💡 Tips for AI Assistants

### Best Practices

1. **Always read CLAUDE.md first** (3 min investment, saves hours)
2. **Use `/feature-dev` skill** for all development tasks
3. **Follow project-specific rules** (Layered Architecture, Job Deduplication)
4. **Check anti-patterns** before implementing solutions
5. **Reference concept maps** when explaining flows to users
6. **Keep file locations updated** as you discover changes

### Common Questions

**Q: Should I read all AI docs on startup?**
A: No. Read CLAUDE.md only. Load other docs when specifically needed.

**Q: What if I can't find a file in FILE_LOCATIONS.md?**
A: Use the project's Glob/Grep tools, then update FILE_LOCATIONS.md.

**Q: How do I know which anti-pattern applies?**
A: Read the "Why This Matters" sections - they explain when patterns apply.

**Q: Should I use custom agents?**
A: No. Use `/feature-dev` built-in skill. Follow project-specific rules in CLAUDE.md.

---

## 📈 Metrics

### Improvement Over Complex Custom Agents

| Metric                   | Custom Agents (old) | Modern Approach (new) | Improvement |
| ------------------------ | ------------------- | --------------------- | ----------- |
| **Initial context load** | 4,500 tokens        | 2,500 tokens          | **44% ↓**   |
| **Time to start**        | 5 minutes           | 3 minutes             | **40% ↓**   |
| **Maintenance**          | Complex agents      | Simple docs           | **+300%**   |
| **Built-in support**     | None                | /feature-dev skill    | **New!**    |

### Context Acquisition Time

- **Quick start:** 3 min (CLAUDE.md only)
- **Find file:** +2 min (FILE_LOCATIONS.md quick ref)
- **Avoid mistake:** +5 min (ANTI_PATTERNS.md spot check)
- **Understand flow:** +10 min (CONCEPT_MAP.md detailed)

**Average:** 3-5 minutes to productive coding

---

**Last Updated:** January 2026
**Maintained by:** Yurii Shvydak
**Documentation Quality:** Optimized for AI-assisted development with `/feature-dev` skill
