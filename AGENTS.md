# Repository guidance

Keep responses short and concise.

## Ownership and scope

- Jacob manages website and game implementation and releases. This workstream maintains deployment process, privacy review, and agent/skill guidance. Follow the current request's scope; do not turn a process review into unsolicited game or website edits.
- Inspect the checkout and refresh remote references before repository-grounded work. Preserve other contributors' changes. Stage only intended files.
- Prepare changes on a working branch and through a pull request. Jacob reviews release readiness and handles the merge. A request to prepare or review changes does not authorize publishing them.

## Issue tracking

- GitHub Issues is the source of truth for bugs, improvements, and follow-up work. Link relevant issues in pull requests and release notes.
- Use `.agents/skills/website-issues/SKILL.md` when finding, filing, updating, or closing issues. Search before creating duplicates. Creating a skill or discussing an idea does not itself request a new issue.

## Privacy promises

- Read `privacy.html` before adding or changing data handling, external services, storage, fonts, embeds, or dependencies. It is the published statement of current practices.
- Preserve the no-tracking approach: no visitor analytics (including first-party or cookieless analytics), advertising pixels, session replay, fingerprinting, or gameplay telemetry. Keep scores, input, and saved progress on the device.
- Serve runtime fonts, libraries, and other assets locally. Ordinary links opened by the visitor are distinct from automatic third-party requests. Review new remote requests against the policy.
- Review every new game, including standalone routes that are not linked from the homepage. Document its actual storage, deletion, offline, and network behavior before release.
- If behavior conflicts with the policy, flag it for Jacob with file/line evidence and a concrete fix. Do not silently broaden the policy to permit collection. A deliberate change in privacy practices requires an explicit owner decision and an appropriate policy review before release.
- Use `.agents/skills/website-privacy-review/SKILL.md` for privacy reviews and release preparation.

## Deployment

- Use `.agents/skills/website-release/SKILL.md` to prepare, verify, publish, or roll back a release.
- Treat a push or merge to the configured Pages source as a production action. Verify the live source first; do not assume a branch is a preview environment.
- Agent instructions and skills guide behavior; they do not enforce access controls or required checks. Report missing GitHub protection separately. Change repository settings or deployment automation only when requested.

## Code Review Rules

- Flag added telemetry, automatic third-party asset requests, or remote transmission of player data against the privacy promises above.
- Flag missing privacy coverage for a new game's persistence or data handling.
- Flag changed PWA assets without an appropriate cache-version update and compatibility checks for existing saves.
- Distinguish source inspection, automated tests, browser checks, and physical-device checks. Never report an unperformed check as passed.
