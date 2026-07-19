---
title: OP-1 Lab
domain: FIRMWARE · ASSEMBLY
status: ON HARDWARE
statusDetail: custom DSP running on the real device
live: false
stack: [Blackfin assembly, Python, GNU bfin toolchain, op1repacker]
summary: Reverse-engineering the original OP-1 synthesizer like a ROM hack — mapping Teenage Engineering's closed Blackfin firmware, then writing a synth oscillator in hand-written assembly and running it on the actual instrument, reversibly, with byte-level verification before anything touches flash.
order: 3
dark: true
---

## The problem

The OP-1 (original, 2011) is a beloved instrument with closed firmware and no
extension story. Its DSP runs on an Analog Devices **Blackfin** processor — an
architecture Ghidra doesn't even ship a disassembler for. If you want new sounds
out of this hardware, nobody hands you a toolchain: you build one, and you work
out where in a multi-megabyte firmware image your code can safely live.

## What I built

A **hand-written Blackfin assembly synth engine running on the real hardware**:
a custom oscillator injected over the stock `voltage` engine, inheriting
envelope, LFO, effects, and polyphony from Teenage Engineering's own framework —
so the custom DSP behaves like a first-class engine on the device. The
supporting toolchain: `op1repacker` for firmware pack/unpack, the GNU
`bfin-elf` toolchain for assembly and linking, custom Python tools for reading,
patching, and mapping LDR firmware images, and a host-side **Blackfin
interpreter** that executes the DSP off-device and renders its audio output to
WAV — so an engine is heard and verified before it ever runs on hardware.

## The discipline

Flashing someone's instrument is the easy way to brick it, so the lab runs on
rules: read-only analysis first; every patch **byte-verified** against the image
before flashing; the boot-critical regions (`te-boot.ldr`, COM, Shift, Power)
never modified — those are the brick vectors; stock firmware always reflashable.
The interpreter's rendered output is compared against expectations before the
device sees a build. Everything is reversible or it doesn't ship.

## Why there's no repo link

The firmware work stays in a private repository — no copyrighted firmware gets
redistributed. This writeup is the public artifact; a device recording of the
custom engine is coming to this page.
