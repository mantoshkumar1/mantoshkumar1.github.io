---
title: "GTT Trigger Price Calculator"
slug: "gtt-price-calculator"
category: "project"
tags: [indian-stock-market, gtt-orders, python, streamlit, decision-support]
summary: "A helper for preparing candidate buy and sell trigger prices before placing a GTT order in the Indian stock market."
last_updated: "2026-07-12"
related_topics: [input-validation, reactive-ui, financial-utility, rule-freshness]
visibility: "public"
url: "/projects/gtt-price-calculator.html"
---

# GTT Trigger Price Calculator

## Problem

The GTT Trigger Price Calculator helps a visitor prepare candidate buy and sell trigger prices before placing a Good Till Triggered order in the Indian stock market. The visitor provides the current stock price; the tool also converts between investment amount and share count.

## Current implementation

- The visitor supplies a positive current price and a rounding multiple.
- For a price at or above ₹50, `calculate_gtt_prices` applies a 0.256% distance buffer.
- For a price below ₹50, the function applies a ₹0.09 distance.
- Candidate triggers are rounded to the selected multiple and then to two decimal places.
- The interface defaults to a ₹0.05 rounding multiple.
- Streamlit session state and callbacks synchronize share-count and amount inputs using floor operations.
- Invalid numeric input and prices at or below zero produce visible errors.

## Engineering decisions

### Keep the pricing rule visible

Thresholds, distance calculations, and rounding stay in a short inspectable function. This keeps assumptions reviewable, with the trade-off that hard-coded rules can become stale.

### Separate calculation from trading

The application has no broker API, account authentication, trade execution, or live-price integration. It prepares values for human review, sacrificing convenience to reduce security, compliance, and execution risk.

### Synchronize amount and share inputs conservatively

Either amount or share count can drive the paired value. The interface tracks the latest input and uses floor operations, adding state coordination to avoid silently inconsistent values or unavailable precision.

## Trade-offs and limits

- Trigger rules and tick-size requirements are hard-coded assumptions that can become stale and must be verified against current broker documentation.
- The public repository contains no automated tests.
- The Streamlit dependency is not version-pinned.
- The configured Streamlit deployment redirected to authentication during the 2026-07-12 review, so public live-demo availability is not established.
- The utility is not financial advice and does not guarantee broker acceptance.

## What this project demonstrates

- Rule modeling through explicit trigger-distance, rounding, and synchronization behavior.
- Transparent computation that keeps assumptions inspectable.
- Boundary design that separates value preparation from brokerage access and order execution.
- Risk-aware engineering that documents stale-rule, dependency, testing, and deployment limitations.

## Reflection

The visible calculation and boundary between preparation and trade execution remain appropriate. A stronger version should add automated boundary tests, pinned dependencies, and a versioned authoritative rules source before adding convenience features.

## Public evidence

Source repository: https://github.com/mantoshkumar1/gtt-price-calculator

This document is limited to the public README, `app.py`, requirements, MIT license, and repository metadata. It excludes claims about users, financial outcomes, accuracy against current broker rules, and production scale.
