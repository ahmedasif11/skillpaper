# Cursor setup for SkillPaper

This folder explains how Cursor is configured so new chats use project context instead of re-exploring the repo (which burns quota).

## What was added

| Kind | Path | When it loads |
|------|------|----------------|
| Agent index | `AGENTS.md` (repo root) | Often included automatically |
| Always-on rule | `.cursor/rules/skillpaper-core.mdc` | Every chat |
| Backend rule | `.cursor/rules/backend.mdc` | When editing `backend/**` |
| Frontend rule | `.cursor/rules/frontend.mdc` | When editing `frontend/**` |
| Docs rule | `.cursor/rules/docs.mdc` | When editing `docs/**` |
| Skill | `.cursor/skills/implement-resume-import/` | Resume import / LLM / auto-fill work |
| Skill | `.cursor/skills/fix-backend-audit/` | Backend bugs, tests, hardening |
| Skill | `.cursor/skills/ports-and-adapters/` | New LLM/storage/scanner/queue integrations |
| Skill | `.cursor/skills/write-feature-docs/` | New or updated feature specs |

Rules are short on purpose. Long specs stay in `docs/features/` and are read only when needed.

## How to start a cheap, accurate chat

1. Open the files you will change (rules with `globs` attach from open files).
2. Name the skill or task in the first message, e.g. “Follow implement-resume-import and build Phase 1 only.”
3. Point at the spec: “Use `docs/features/resume-upload-llm-autofill/api-design.md`. Do not re-audit the repo.”
4. Keep one goal per chat (import API **or** audit fixes **or** UI). New chat for a new goal.

## Quota habits

**Do**

- Reuse this repo’s docs instead of asking the agent to “understand the whole project”
- Ask for a small slice: “SEC-02 and SEC-03 only”
- Attach / `@` the one spec file that matters
- Stop the agent if it starts a full-tree explore for a question already answered in docs

**Don’t**

- Start with “analyze the entire codebase”
- Paste the same 10 docs into every chat
- Mix “redesign templates” with backend security in one session
- Leave `alwaysApply` rules long — they cost tokens on every message

## Suggested next chats (in order)

1. **Audit fixes:** “Use skill `fix-backend-audit`. Implement SEC-02, SEC-03, SEC-04, SEC-05, SEC-06 only.”
2. **Tests:** “Add Jest + the tests listed in backend-audit.md section 9.”
3. **Import Phase 1:** “Use skill `implement-resume-import`. Infrastructure only (MinIO, Redis, ClamAV, UploadedResume model, upload endpoint). No Gemini yet.”

## Optional later (not added yet)

| Item | Why wait |
|------|----------|
| User rules in Cursor Settings → Rules | Personal tone (“be brief”) — keep out of the repo |
| Bugbot / Security Review skills | Only when you run PR reviews |
| More always-on rules | Each one is paid on every prompt |

## If a skill does not auto-trigger

Type `@` and pick the skill, or say: “Read `.cursor/skills/implement-resume-import/SKILL.md` and follow it.”
