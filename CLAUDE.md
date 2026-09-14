@AGENTS.md

## Memory: Obsidian is the source of truth

Obsidian is my long-term memory. **On every message, before responding**, check the
Obsidian vault to see whether the project/topic being discussed already exists there —
prefer what's recorded in Obsidian over assumptions.

- **Vault:** `/Users/macbook/Documents/Obsidian Vault`
- **Project notes:** `Projects/` (e.g. `Projects/AstraNova.md`, `Projects/Crossfire.md`)
- **Chat archive:** `Claude Sessions/<project>/…` (auto-saved transcripts)

If a project exists, read its note and build on it. If it doesn't, treat it as new
and offer to create a `Projects/<Name>.md` note. Keep Obsidian notes updated as things
change. The `~/.claude/.../memory/MEMORY.md` auto-memory index still applies and points
at the same facts.

## Browsing policy

When browsing the internet, use **Camoufox by default** (anti-detect Firefox).
Escalate to the **gstack browser** only for serious blockers (hard anti-bot walls,
CAPTCHAs, Cloudflare challenges) where Camoufox can't get through.

- **Camoufox** — venv at `/Users/macbook/camoufox-project/.venv`; drive via
  `/Users/macbook/camoufox-project/.venv/bin/python` with `from camoufox.sync_api import Camoufox`.
  Browser cached at `~/Library/Caches/camoufox/Camoufox.app`.
- **gstack browser** (escalation) — invoke the `/open-gstack-browser` skill, or the
  `browse` binary at `/Users/macbook/.claude/skills/gstack/browse/dist/browse`.

## Skill routing

When the user's request matches an available skill, invoke it via the Skill tool. When in doubt, invoke the skill.

Key routing rules:
- Product ideas/brainstorming → invoke /office-hours
- Strategy/scope → invoke /plan-ceo-review
- Architecture → invoke /plan-eng-review
- Design system/plan review → invoke /design-consultation or /plan-design-review
- Full review pipeline → invoke /autoplan
- Bugs/errors → invoke /investigate
- QA/testing site behavior → invoke /qa or /qa-only
- Code review/diff check → invoke /review
- Visual polish → invoke /design-review
- Ship/deploy/PR → invoke /ship or /land-and-deploy
- Save progress → invoke /context-save
- Resume context → invoke /context-restore
