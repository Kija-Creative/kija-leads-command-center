# Rules for agent sessions in this repo

Read this before changing anything. `SPEC.md` is the contract for data shapes, function
signatures, CLI names, API routes and guardrails. `WEEKLY_RUN.md` is the Monday research
playbook. If code and `SPEC.md` disagree, the code is wrong or `SPEC.md` needs a deliberate edit
that you call out.

## Hard rules

1. **No em dashes or en dashes, anywhere.** Not in code, comments, copy, generated HTML, data,
   docs, commit messages or chat. Use a comma, a period, a colon, or rewrite the sentence.
   Hyphens inside words and numbers ("30-minute", "2-3") are fine. When a test needs a dash
   character, build it with `String.fromCharCode(0x2014)`; do not type an escape sequence into a
   shell heredoc, some shells turn it into the real character. `npm run check` fails on any dash.
2. **Never contact a business.** No code, script or session sends email, texts, calls, DMs,
   voicemails or form submissions to any business. Outreach is drafted for Jamey to copy. Do not
   add a send button, a mail transport, an SMS API or a webhook.
3. **Never publish.** Demos, pitch pages and share files stay on this machine. The server binds
   127.0.0.1 only. Do not deploy, upload, push to a public host or post anything. A demo is
   shareable only after Jamey sets `demo.shareApproved` in the app, and even then the app only
   writes a file.
4. **Never invent facts about a real business.** Ratings, review counts, phones, years in
   business, services, licenses, certifications, awards, warranties, insurance and review content
   are sourced (a URL in `sources`) or absent. No testimonials or quoted reviews. Review content
   appears only as short paraphrased `reviewThemes`.
5. **Outreach history is append only.** Ingest never edits `outreach` except to append a history
   entry. Do not rewrite or delete history entries.
6. **Scores are computed.** Never store or hand enter a total. Every part carries a full sentence.
7. **Rule violations are return values.** Validators and mutations return
   `{ ok, errors, warnings }` with readable sentences.
8. **Time is injected.** Pure functions in `src/lib/` take `now`. Only CLI entry points and the
   server read the clock.
9. **Zero runtime dependencies.** Node 24 built-ins only. Never run `npm install`. ESM only.
   Browser code is vanilla ES modules.
10. **No secrets in source, logs or the UI.** `GOOGLE_PLACES_API_KEY` lives in `.env`, which is
    gitignored. Only say whether it is present.
11. **Respect Google's terms.** Place IDs may be stored. Other Places content must be refreshed
    or cleared within 30 days (see `research/places-api.md`). Do not scrape Google Maps in bulk.

## House style

2 space indent, double quotes, semicolons, trailing commas in multiline literals. Short comments
that explain why. UI copy is plain, direct, sentence case, no exclamation marks, no emoji. Every
empty state says what would put something there.

## Before you finish

- `npm test` passes (it needs no network).
- `npm run check` passes. Warnings about the unconfirmed price or unverified benchmarks are
  expected until Jamey or research resolves them.
- Tests that write files use a temp directory, never the real `data/`, `demos/` or `pitches/`.
  If you exercise the server by hand, point it at a temp copy or restore what you changed.
- Do not run `npm run seed -- --force` on real data unless Jamey asks; it replaces the pipeline
  (a backup is kept in `data/backups/`).
- Commit only when asked. There is no remote.

## Weekly run

A Cowork scheduled task opens this project every Monday and follows `WEEKLY_RUN.md` from the top.
Follow it exactly: plan, research with five independent checks per lead, write the batch to
`data/inbox/<runId>.json`, ingest, build demos and pitches for the run, check, then give the final
summary. Queue decisions and outreach are Jamey's, never the run's.
