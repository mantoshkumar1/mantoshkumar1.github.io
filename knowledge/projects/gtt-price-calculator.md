---
title: "GTT Trigger Price Calculator"
slug: "gtt-price-calculator"
category: "project"
tags: [python, streamlit, rules-engine, rounding, decision-support]
summary: "A Streamlit utility that applies explicit trigger-distance and rounding assumptions to calculate candidate GTT buy and sell prices."
last_updated: "2026-07-12"
related_topics: [input-validation, reactive-ui, financial-utility, rule-freshness]
visibility: "public"
url: "/projects/gtt-price-calculator.html"
---

# GTT Trigger Price Calculator

## Problem

The GTT Trigger Price Calculator is a public Python and Streamlit utility for calculating candidate buy and sell trigger prices from a visitor-provided current stock price. It also converts between order amount and share count.

## Current implementation

- The visitor supplies a positive current price and a rounding multiple.
- For a price at or above ₹50, `calculate_gtt_prices` applies a 0.256% distance buffer.
- For a price below ₹50, the function applies a ₹0.09 distance.
- Candidate triggers are rounded to the selected multiple and then to two decimal places.
- The interface defaults to a ₹0.05 rounding multiple.
- Streamlit session state and callbacks synchronize share-count and amount inputs using floor operations.
- Invalid numeric input and prices at or below zero produce visible errors.

## Engineering decisions

The calculation remains a short inspectable function. The application has no broker API, account authentication, trade execution, or live-price integration. It treats calculation and execution as separate responsibilities.

## Trade-offs and limits

- Trigger rules and tick-size requirements are hard-coded assumptions that can become stale and must be verified against current broker documentation.
- The public repository contains no automated tests.
- The Streamlit dependency is not version-pinned.
- The configured Streamlit deployment redirected to authentication during the 2026-07-12 review, so public live-demo availability is not established.
- The utility is not financial advice and does not guarantee broker acceptance.

## Public evidence

Source repository: https://github.com/mantoshkumar1/gtt-price-calculator

This document is limited to the public README, `app.py`, requirements, MIT license, and repository metadata. It excludes claims about users, financial outcomes, accuracy against current broker rules, and production scale.
