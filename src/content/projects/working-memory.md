---
title: Working Memory
domain: WEB · EVENT SOURCING
status: LIVE
statusDetail: workingmemory.onrender.com
live: true
stack: [Next.js, TypeScript, SQLite, Litestream, Backblaze B2, Docker]
demo: https://workingmemory.onrender.com
repo: https://github.com/carlitoswillis/workingmemory
video: /media/wm-scrubber.mp4
poster: /media/wm-scrubber.jpg
videoAlt: Screen recording of the live demo — dragging the time-machine scrubber rewinds the board through three weeks of history, then snaps back to now.
summary: I wanted to know what a task app would look like if history wasn't an afterthought. Instead of updating rows in place, every edit becomes an event, so the board can be replayed from the beginning or inspected at any moment in its past. It runs on free hosting where every deploy doubles as a backup-and-recovery drill.
order: 1
---

**[Try the live demo](https://workingmemory.onrender.com)** — no signup; you get
your own throwaway board pre-loaded with three weeks of history, so the time
machine has somewhere to go. (Free-tier host: the first load after an idle spell
takes about a minute.)

## The problem

For years I kept one perpetually rewritten note — today's priorities at the top,
things I was waiting on, a brain-dump at the bottom. It worked until I asked it a
question it couldn't answer: *what was I actually worried about three weeks ago?*
The note only ever knew **now**; every rewrite quietly destroyed the previous me.
Todo apps don't fix this. Trello, Notion, Linear are excellent at current state
and amnesiac about everything else — the history of your attention is the exhaust
they throw away.

## What I built

A small kanban-style board (Today · Focus · Waiting · Backlog · Brain Dump, plus
a pinned daily note) where **every change to every card is recorded in an
append-only event log**. The board shows now; the time machine scrubs backward
through every moment the board ever changed and re-renders it as it was —
read-only, drill-down and all. Sub-cards nest to arbitrary depth with their own
histories, daily-repeating tasks reset at local midnight without deleting
anything, and multi-select drag plus undo make it fast enough to actually live in.

## How it works

**History is enforced by the database, not the app.** Every insert or update on
`items` fires a SQLite trigger that appends to `item_events` — so any client
(the app, a script, a future mobile client) records history just by writing.
Time travel is a pure function that replays events backward from now. History
isn't a feature some code path can forget; it's a property of the storage layer.

**Durability without paying for it.** The hosted instance runs on Render's free tier
with deliberately **no persistent disk**: Litestream continuously replicates the
SQLite database to a Backblaze B2 bucket and restores it on every boot, which
means every deploy is also a disaster-recovery drill. Daily automated pulls keep
a local backup, and an uptime worker tames free-tier cold starts.

**Multi-tenancy in one file.** All accounts live in a single replicated SQLite
database, scoped per-user in every query, with stateless HMAC cookie sessions.
Anonymous visitors get isolated, rate-limited, auto-expiring demo boards seeded
with fabricated-but-consistent history — the full product, no signup wall.
