---
title: Ableton Library
domain: RUST · SYSTEMS
status: DESKTOP APP
statusDetail: local-first · no cloud, no SDK
live: false
stack: [Rust, SQLite FTS5, Tauri, TypeScript]
repo: https://github.com/carlitoswillis/ableton-library
video: /media/ableton-library.mp4
poster: /media/ableton-library.jpg
videoAlt: Screen recording of the app — orbiting the 3D similarity map colored by cluster, tempo, and artist, filtering the library by name and BPM range while a preview plays, then opening a project's track and device list.
videoControls: true
summary: After years of making music I'd accumulated hundreds of Ableton projects that were effectively unsearchable. This tool indexes them straight from disk — no SDK, no cloud — so I can search by tempo, plugin, sample, or artist without opening Live, preview sets as waveforms, and explore related projects through a 3D similarity visualization.
order: 2
---

## The problem

A decade of Ableton Live projects is a pile of opaque folders. Finding "that
150 BPM idea with the Korg patch" means opening projects one at a time in Live —
minutes each. There's no official SDK and no spec for the `.als` format; the only
honest way in is to read the files themselves.

## What I built

A Rust toolchain with two faces over one catalog: an `ableton-scan` CLI and a
Tauri desktop app. Scanning recurses any folder structure, parses every `.als`
(a gzipped XML document) without touching Ableton, and indexes Live version,
tempo, time signature, tracks, devices and plugins, referenced samples, and
locators into SQLite with FTS5 — so the whole library answers queries like
`search --min-bpm 140 --max-bpm 160 --plugin soothe` in milliseconds. On top of
the catalog: waveform previews, lists and favorites, artist filing, and a 3D
similarity map of every set in the library.

## The hard parts

**Parsing at scale without a spec.** Real libraries contain corrupt files,
version drift across a decade of Live releases, and half-missing metadata.
Extraction is lenient by design: a missing field becomes a warning on that set,
a corrupt file logs an error and the scan continues. One bad project never
aborts a scan, and rescans are incremental — only changed files are re-parsed.

**Previews from three sources.** A project isn't listenable until something
renders it. The app harvests bounces it discovers near projects, runs an
automated render worker that drives a real Live install through UI automation,
and falls back to a no-Ableton approximate "sketch" render. A triage scorer
reports each set's renderability (missing plugins, missing samples → a 0–1
score) so the worker spends time only where a render will actually succeed.

**Metadata that survives rebuilds.** Artist attribution is derived from folder
paths via marker and positional heuristics, with hand-tags that stick through
rescans. Lists are keyed by file path rather than database row, so favorites
survive a full catalog rebuild — the catalog is disposable, the library isn't.
