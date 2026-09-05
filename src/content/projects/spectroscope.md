---
title: Spectroscope
domain: AUDIO · C++
status: PLUGIN + APP
statusDetail: Audio Unit · VST3 · standalone macOS
live: false
stack: [C++, JUCE 8, CMake, OpenGL, GitHub Actions]
repo: https://github.com/carlitoswillis/spectroscope
gallery:
  - src: /media/spectroscope-console-nostromo.png
    alt: The Spectroscope console with all six instruments lit, Nostromo livery — waveform, spectrogram, spectrum, stereo field, loudness chart, and oscilloscope.
    width: 940
    height: 900
  - src: /media/spectroscope-console-tva.png
    alt: The same six-instrument console in the TVA livery, an aged-paper chassis with a burnt-orange wordmark.
    width: 940
    height: 900
galleryCaption: "Four film-grade liveries share the same console — every colour and detail changes, none is a tint of another."
summary: An audio analysis console — waveform, spectrogram, spectrum, stereo field, loudness chart, oscilloscope — that runs as an Audio Unit or VST3 inside Ableton, or as a standalone macOS app listening to an input device. It measures and never changes the audio, so it can sit anywhere in a chain.
order: 3
---

## What it is

Six analysis instruments on one screen, built with JUCE 8 and shipped three
ways from one codebase: an Audio Unit, a VST3, and a standalone macOS app. In a
DAW it shows whatever audio reaches that point in the chain and passes it on
unchanged; standalone, it listens to an input device, which is how you look at
audio a DAW never touches. Each instrument can be switched off, and one that
isn't lit does no work.

## What was hard

The audio thread can't allocate, lock, or wait, so `processBlock` does one copy
into a preallocated lock-free ring and returns, and a separate analysis thread
does the FFTs, loudness, and correlation — when that thread falls behind, the
dropped blocks are counted and shown in the header rather than smoothed over.
The other hard part was making the measurements trustworthy: the loudness meter
follows BS.1770, so the tests assert against known references (a −18 dBFS
997 Hz sine has to read −15.0 LUFS integrated), and CI runs those DSP tests
along with Apple's `auval` and `pluginval` on every build, because a meter that
is quietly wrong is worse than no meter.
