---
title: My Linux Box
description: How I turned a spare laptop into an always-on home for my AI agents, with SSH, T3 Code and OpenBot.
date: 2026-11-03
tags: [AI agents, Linux, Homelab]
---

I had an old laptop sitting in a drawer. Now it runs my AI agents all day, every day, and I barely touch it. Here's how it's set up and what I learned.

<!-- excerpt -->

## Why a separate machine

Coding agents are happiest when they can run for a long time without interruption. My Mac goes to sleep, travels with me and has my real work on it. I wanted a box that stays on, can be messy, and that I can hand long jobs to and check on later.

So the split is simple:

- **The Linux box does the work.** Builds, tests, research, scheduled jobs and anything that runs for hours.
- **The Mac is the remote control.** I start tasks, review results and approve anything that matters from there.

## The hardware

It's an ASUS Vivobook Pro 16X from a few years ago: a Ryzen 9, 32 GB of RAM and a 4K OLED screen that nobody looks at anymore. I wiped Windows and installed Ubuntu 26.04.

A laptop makes a surprisingly good home server. It's quiet, it sips power at idle, and the battery works as a small built-in UPS when the power blips.

## Getting in from anywhere: SSH over a Cloudflare Tunnel

I didn't want to open a port on my home router. Instead, the box makes an outbound connection to Cloudflare with a Cloudflare Tunnel, and Cloudflare Access sits in front of it.

- **No open ports.** Nothing on my network accepts connections from the internet. The tunnel only dials out.
- **A login in front of SSH.** Before you even reach the SSH prompt, Cloudflare Access asks you to sign in. Sessions last a week.
- **It survives reboots.** The tunnel runs as a systemd user service, with lingering turned on so it starts at boot even when I'm not logged in.
- **It works from my phone.** Cloudflare can render an SSH terminal in the browser, so I can check on the box from Safari without installing anything.

From the Mac it's one short SSH alias. From the phone it's a bookmark. Either way, the box just has to be awake and online.

## T3 Code: the control room

[T3 Code](https://github.com/pingdotgg/t3code) is where all of this comes together. It's a desktop app for running coding agents, and it can connect to more than one machine. On my Mac I pick the Linux environment, open a project, and every thread and agent runs on the box.

What I lean on most:

- **Projects and threads.** Each repo is a project. Each task gets its own thread, so the context stays focused.
- **Delegation.** A main thread can hand a piece of work to another agent and get the result back, even on a different model.
- **Schedules.** Recurring jobs, like processing my saved bookmarks, run on their own and leave a short summary.
- **An in-app browser.** Agents can open real pages, which is how they check their own UI work.

I keep a small "personal assistant" workspace on the box too: a folder of plain Markdown files with my preferences, notes and a running handoff. Any agent can read it at the start of a session, so I don't repeat myself.

## OpenBot: persistent AI teammates

[OpenBot](https://github.com/nightly-labs/openbot) is a local-first desktop app for AI "teammates." Each agent gets its own workspace and conversation, and it can drive Codex, Claude Code and several other agents from one window.

While trying it, the plan-usage meter for Claude showed the wrong number. I had an agent dig into the source and found a real bug: a cached usage reading could stay stale with no age limit. I wrote a fix that refreshes the reading after five minutes, plus an end-to-end test that fails without the fix and passes with it. It's a local patch for now.

Running it on the box means those teammates keep working while my Mac sleeps.

## What I'd tell you if you want to try this

- **Start with remote access.** Get SSH working through a tunnel before anything else. Everything else depends on it.
- **Keep secrets out of the agents' reach.** Tokens and passwords stay in proper credential stores, never in repos or chat logs.
- **Write things down for the agents.** A few Markdown files with your preferences and current work save a lot of re-explaining.
- **Let the box be messy.** It's a workbench, not a showroom. That's the point.

It's one of my favorite setups I've built this year, and it cost nothing but an afternoon and a laptop I already had.
