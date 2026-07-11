---
title: "PhotoSahi"
slug: "photosahi"
category: "project"
tags: [browser-side-processing, privacy, html5-canvas, image-processing]
summary: "A privacy-first passport and visa photo generator that processes images entirely in the browser."
last_updated: "2026-07-11"
related_topics: [client-side-architecture, privacy, performance]
visibility: "public"
url: "/projects/photosahi.html"
---

# PhotoSahi

PhotoSahi is a passport and visa photo generator designed to reduce the friction
of preparing official photos. Many online tools require sensitive image uploads
to remote servers and leave users without a clear guided workflow.

The product runs completely in the browser and uses HTML5 Canvas for local
image processing. The processing flow is: input image, canvas processing, crop,
resize, background adjustment, and export. Photos are processed locally and are
not uploaded to a backend.

## Why there is no backend

A backend was unnecessary for the core use case. It would add latency,
operating cost, and trust concerns around sensitive photo uploads. Keeping the
workflow browser-only makes the experience immediate and private without adding
operational complexity.

The trade-off is that the browser must handle more image-processing complexity
and resource use. The implementation therefore focuses on efficient canvas
operations and careful image handling so the UI remains responsive on desktop
and mobile devices.

## Engineering lessons

Image processing needs careful attention to quality, cropping, and edge cases.
The Canvas API is powerful, but browser compatibility and performance need to
be considered from the beginning. In a highly procedural task, user experience
matters as much as technical correctness.
