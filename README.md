# Kija Lead Command Center

A local web app and weekly research routine for Kija Creative. Every Monday a Claude Cowork
scheduled task finds US local businesses with strong Google reviews and no credible website of
their own, checks that claim independently, scores each one with the sheet's Scoring Rules, and
builds each qualified lead a private homepage demo and a pitch page that explains the return on
investment. Jamey opens the app, reviews the week, presents a demo on a call, and decides who to
contact.

Nothing in this project contacts a business or publishes anything. Outreach text is drafted for
you to copy. Demos and pitch pages are private files on this machine.

`SPEC.md` is the build contract. `WEEKLY_RUN.md` is the Monday playbook.

## Requirements

Node 24 or later. There are no dependencies and no install step.

## Run the app

```
npm start
```

Then open http://127.0.0.1:4242. The server binds 127.0.0.1 only. Set `PORT` to use another
port, for example `PORT=5000 npm start`.

Views:

- **This week**: the latest run, its plan and counts, and its leads ranked by score.
- **Pipeline**: every lead as a table with filters, or as a board by outreach stage.
- **Lead**: facts, the score breakdown in sentences, verification checks and sources, the ROI
  calculator, the demo in desktop, tablet and phone frames, outreach drafts with copy buttons,
  status, next action, owner, notes and the history timeline.
- **Present**: a full screen view for a shared screen call. Keys 1, 2 and 3 change the device
  size, t switches between demo and pitch, Esc leaves.
- **Research queue**: Promote, Keep researching or Drop (a reason is required).
- **Runs**, **Coverage** (state map and upcoming rotation) and **Settings** (offer, price,
  contact, quota, thresholds, geography).

Press `?` in the app for every keyboard shortcut.

## The weekly flow

1. **Plan.** `npm run plan` prints this week's metros, categories and quota and writes
   `data/inbox/<runId>.plan.json`. The run id is the Monday's date. Each week covers four metros
   in rotation plus Dallas-Fort Worth, and six categories that always include an auto, a home
   services and a contractor category.
2. **Research.** The Cowork task follows `WEEKLY_RUN.md`: find candidates, verify each one with
   five independent checks, and write the batch to `data/inbox/<runId>.json`.
3. **Ingest.** `npm run ingest -- data/inbox/<runId>.json` validates, dedupes against leads,
   queue and rejected, sends threshold misses and overflow to the queue, adds the top
   `weeklyQuota` as new leads and writes `data/runs/<runId>.json`. Add `--dry-run` to preview.
   Ingesting the same batch twice changes nothing.
4. **Build.** `npm run demos -- --missing` and `npm run pitches -- --missing`.
5. **Check.** `npm run check` validates every data file, scans for dash characters and runs the
   demo and pitch guardrails.
6. **Review.** Open the app. The week's leads are on the This week view.

To run a week by hand, start a Claude session in this folder and ask it to follow
`WEEKLY_RUN.md` from the top.

## Commands

| Command | Does |
|---|---|
| `npm start` | serve the app on 127.0.0.1:4242 |
| `npm test` | every test suite, no network needed |
| `npm run check` | validate data, dash scan, demo and pitch guardrails |
| `npm run seed` | build `data/` from the sheet export in `seed/` (refuses if leads exist, `-- --force` to replace) |
| `npm run plan -- [--date YYYY-MM-DD]` | this week's plan |
| `npm run ingest -- <batch.json> [--dry-run]` | ingest a research batch |
| `npm run demos -- [--run <runId> \| --id <id> \| --all \| --missing]` | build demos |
| `npm run pitches -- [--run <runId> \| --id <id> \| --all \| --missing]` | build pitch pages |
| `npm run probe -- --name "" --city "" --state "" [--phone ""]` | check likely domains for an owned site |
| `npm run discover -- --plan data/inbox/<runId>.plan.json` | Google Places discovery (needs a key) |
| `npm run export` | write the sheet CSV to `exports/` |

## Data files

| File | Holds |
|---|---|
| `config/settings.json` | quota, thresholds, offer and price, contact, geography mode |
| `config/categories.json` | the category registry: labels, verticals, search terms, defaults |
| `config/geography.json` | the 50 metros in rotation order |
| `config/chains.json` | chain and franchise names that are never leads |
| `data/leads.json` | the pipeline |
| `data/queue.json` | the research queue |
| `data/rejected.json` | businesses checked and rejected, so they are never researched again |
| `data/benchmarks.json` | ROI benchmarks with sources. `npm run seed` installs `research/benchmarks.json` |
| `data/runs/<runId>.json` | one report per weekly run |
| `data/inbox/` | plan and batch files from the weekly run |
| `data/backups/` | the newest 30 copies of each data file, written before every save |

Scores are always computed, never stored. Outreach history is append only: the app and ingest
add entries, nothing edits or removes one.

## Export to the Google Sheet

`npm run export` writes `exports/lead-pipeline-<date>.csv` in the exact Lead Pipeline column
order, so rows can be pasted back into the sheet. The Export CSV button in the app header
downloads the same file.

## Google Places key (optional)

Discovery works without a key: the weekly run falls back to web research. To use Google Places
Text Search, copy `.env.example` to `.env` and set `GOOGLE_PLACES_API_KEY`. `.env` is gitignored.
The app only ever shows whether a key is present, never the key. Read `research/places-api.md`
for costs and the storage terms before turning it on.

## Demos and pitch pages

- Demos: `demos/<id>/index.html`, viewed at http://127.0.0.1:4242/demos/<id>/
- Pitch pages: `pitches/<id>/index.html`, viewed at http://127.0.0.1:4242/pitches/<id>/
- Share files: `exports/<id>-concept.html`

Both folders are gitignored and rebuilt from the data. Every demo carries a noindex tag and a
visible ribbon: "Private concept by Kija Creative for {business}. Not the official website.
Details to confirm with the owner." Forms in a demo send nothing. A demo can only be exported as
a share file after Jamey approves it for sharing on the lead page, and even then the app only
writes a file. Jamey decides where it goes.

The pitch page prints to letter size PDF from the browser. It hides the price until
`offer.priceConfirmed` is on in Settings.

## Safety rules

1. No em dashes or en dashes anywhere: code, copy, generated pages, data, commit messages.
   `npm run check` fails on them.
2. Nothing contacts a prospect. No code sends email, texts, calls, DMs or form posts. There is no
   send button.
3. Nothing is published. The server binds 127.0.0.1. Demos stay local until Jamey chooses.
4. Never invent facts about a real business. Ratings, reviews, phone numbers, years, services,
   licenses, awards, warranties and review content are sourced or left out. No testimonials.
5. Every score explains itself, sentence by sentence.
6. No secrets in source or in the browser.

`AGENTS.md` has the rules for any Claude session working in this repo.
