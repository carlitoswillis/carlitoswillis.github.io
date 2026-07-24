---
title: Incighder
domain: DATA · ENTITY RESOLUTION
status: LIVE
statusDetail: incighder.vercel.app
live: true
stack: [Next.js, TypeScript, Python, Flask, MySQL, Gemini 2.5 Flash]
demo: https://incighder.vercel.app
repo: https://github.com/carlitoswillis/incighder
summary: An artist-scouting tool built around a surprisingly hard question — are these accounts actually the same artist? Search-backed discovery finds candidate profiles across six platforms, Gemini verifies the ambiguous ones, and patient scraping turns the metrics into growth history and a single cross-platform traction score.
order: 4
featured: false
---

**<a href="https://incighder.vercel.app" target="_blank" rel="noopener noreferrer">See it live</a>** — browsing the
tracked roster, growth history, and traction scores always works. Scraping and
discovery run from my own machine (more on why below), so those features show
an "offline" banner when I'm not running them.

## The problem

Deciding whether an emerging artist is gaining real traction means checking
Spotify, YouTube, SoundCloud, Instagram, TikTok, and Twitch — separately, by
hand, with no memory of what the numbers were last month. And before you can
compare anything, you have to solve a quieter problem first: **which accounts
are actually theirs?** Handles rarely match — the preferred name was taken,
they use a stage name on one platform and a legal name on another — so a blind
name-guess finds the wrong profile more often than the right one. I did a
version of this work professionally, evaluating emerging artists from scraped
platform data, and this project is the tool I wished I'd had.

## What I built

A full-stack tracker with a Next.js frontend and a Python scraping service
behind it. Add an artist from Spotify search, and Incighder assembles the rest
of their footprint: it searches the open web for candidate Instagram and TikTok
profiles, then has **Gemini 2.5 Flash inspect each candidate's profile metadata
and rule `match` / `uncertain` / `mismatch`** — the best match is auto-filled
and the runners-up are kept as one-click alternates, so the human stays in the
loop exactly where the model is unsure.

Every scrape writes account-keyed snapshots to MySQL, and a scheduler sweeps
the roster daily, so growth history accrues on its own. On top of that history
sits a **cross-platform traction score**: log-scaled reach across all
platforms, breadth (how many platforms they're actually on), momentum (median
weekly growth from the snapshots), and Spotify popularity — with a breakdown
tooltip that explains every point, because a score you can't interrogate is
just a vibe. A discovery page walks Last.fm's similarity graph from any seed
artist (Spotify retired its related-artists API in 2024), enriches each result
with live metrics, and tracks any of them in one click.

## The scraping is deliberately boring

Platforms don't offer this data politely, so the scrapers are built to be a
good citizen and to fail gracefully: HTTP-only (no headless browser), a strict
24-hour cache per platform, sequential requests with random jitter, and
automatic backoff on rate-limit responses. A failure on one platform never
blocks the others — every scraper is best-effort and isolated, because
scraping is fragile by nature and pretending otherwise just breaks the whole
pull.

## The deploy is the interesting part

The frontend lives on Vercel and reads a hosted MySQL database, so browsing is
always up. But scraping from a datacenter IP is a losing game — so the data
API runs on my Mac, on a residential connection, and exposes itself through a
throwaway Cloudflare tunnel. The twist: the tunnel URL is **published into the
shared database**, and the deployed frontend looks it up at request time. Going
live is one command on my laptop; no redeploy, ever. When the tunnel is down,
the site degrades honestly — an amber banner says live scraping is offline,
and everything already collected keeps working.
