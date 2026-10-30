---
name: website-issues
description: Find, file, update, and close GitHub Issues for this website and its browser games when asked to track bugs, improvements, or follow-up work.
---

# Website issues

GitHub Issues is this project's source of truth for tracked work. Read root `AGENTS.md` and verify the repository from `origin`; the current repository is `2Bad-Ideas/website` (the API may resolve it as `2badideas/website`). Prefer connected GitHub tools; use `gh` if the tools lack the needed capability.

1. Read any referenced issue and relevant comments. Search existing open and closed issues before creating one; update the matching issue rather than duplicating it. Distinguish a recurrence from an already-resolved report.
2. For a requested new issue, write a concrete title and a short body covering the problem or desired outcome, relevant route/game, evidence or reproduction steps, expected versus actual behavior, and acceptance criteria. Include only applicable details; separate confirmed facts from hypotheses.
3. Reuse existing labels when useful. Assign a person, set a milestone, or change priority only when requested or established by the task; do not guess Jacob's GitHub handle.
4. Link related issues and pull requests. Preserve unrelated issue text when updating. Keep personal information, real saves, credentials, and private browser/network data out of issues and attachments; use synthetic examples.
5. Close an issue only when the requested outcome and acceptance criteria are verified. Record the fix/PR and validation; for production bugs, distinguish a merged fix from a verified deployment. Use a non-closing reference such as `Refs #123` when deployment validation remains outstanding. Reopen only when requested or as part of an authorized triage task.

Return the issue link and briefly state what changed. If access is unavailable, provide a ready-to-file draft and say it was not created. Issue tracking does not authorize implementation, deployment, or contacting other people.
