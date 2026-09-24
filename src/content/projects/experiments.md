---
title: Growth experiments
domain: WEB · EXPERIMENTATION
status: 2021 – 2023
statusDetail: Funnel Optimization team
live: false
stack: [React, TypeScript, Rails, GraphQL, Optimizely, Amplitude]
summary: Two years on a growth team at a payroll company, building A/B tests on the marketing site and in the signup flow behind it. In my busiest stretch I owned more experiments than anyone else on the team. I got better at building tests quickly, measuring them properly, and building the tools that made the next test cheaper.
order: 7
featured: false
---

## The job

The Funnel Optimization team ran a steady stream of experiments on the
path from "first visit" to "ran payroll." Engineers were experiment owners: we
built the variants, wired the tracking, launched, watched the charts, and
cleaned up afterward. The marketing site and the product app were separate
codebases (React on one side, Rails on the other), and a lot of tests had to
touch both.

## Selected experiments

**A path for visitors who weren't ready.** My first test: a "learn more"
journey for people who wanted to look around before signing up, instead of
dropping everyone into the signup form. The bigger lesson was structural. The
signup flow was one component, so you couldn't enroll someone in a test partway
through it, and tests couldn't overlap. Much of my later refactoring work came
back to that.

**After-hours visitors could book a call.** People who signed up after hours had
no one to talk to, so we let them schedule a call with sales for later. I built
the version on the demo flow and helped on the original off-hours version. It
was one of the team's clear wins, and it moved the downstream metric we cared
about most, not just form fills.

**An exit prompt on the demo flow.** A relaunch that came back not
significant. I'm including it because the useful lesson came from it: have the
charts ready before launch, and announce every launch in the team channel,
including the ones you're unsure about.

## Tools

**Experiment Simulator.** Product and design used to hand-edit browser cookies
to see a particular variant. I built a tool that let anyone view the marketing site in
any live experiment with one click, and added it to the team's experiment hub.
Once it was in the hub, non-engineers could QA tests in production themselves.
It was nominated for an internal builder award.

**Adopting the experiment hub.** The hub was another team's internal tool, and
nobody on my team used it. I made the case for adopting it, fixed the bugs that
were blocking us, and helped build on it. By the time I left, every engineer on
the team was using it.

**Smaller things.** A command-line script to scaffold experiments against the
Optimizely API. I started it without being asked, and it never shipped as its
own tool; the idea went into the hub work. I also trimmed the experiment brief
template down to the parts engineers actually filled in.

## What I took from it

- Most tests lose or come back flat. Being fast and trustworthy matters more
  than any single win.
- "It's not done until it's live." Give a date instead of "ASAP."
- Ask for the tracking plan at the start of the ticket, not after the build.
- Tooling that removes a manual step gets adopted when you show it to people,
  not when you tell them about it.
