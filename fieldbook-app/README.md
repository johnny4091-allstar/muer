# Fieldbook

A mobile app for field‑service businesses — one organized workspace where every customer, job, estimate, invoice and payment stays connected, so the office and the field team always work from the same information.

Built with **Expo (SDK 57) + React Native + Expo Router + TypeScript**. Runs on iOS, Android and the web.

## Features

| Area | What it does |
| --- | --- |
| **Book smarter** | Customer‑facing online booking page (`/book`). Requests land in **Booking requests**, where the office reviews them, picks a time, assigns a technician and turns them into a scheduled job in one tap. Existing customers are matched by email/phone; new ones are created automatically. |
| **Schedule with clarity** | Month, week and list views, per‑technician filter, team workload for the week. Recurring service (weekly → quarterly) puts the next six months of visits on the calendar. Job statuses: scheduled, in progress, completed, cancelled. |
| **Empower your field team** | Technician mode shows *My day*, the job on the clock, checklists, a live job timer, notes, one‑tap call and directions. Money and customer admin are hidden from technicians. |
| **Get paid faster** | Estimates with line items, discount and tax → send for approval → record the customer's decision → convert to an invoice in one step. Invoices from jobs (from the estimate, or from tracked time). Share/print professional PDF estimates and invoices. Record card, cash, check or bank payments; partial payments supported. |
| **Stay on top of the money** | Dashboard KPIs (jobs today, collected this month, outstanding, overdue), "needs attention" queue, invoice/estimate/payment lists with filters, reports: monthly revenue, receivables aging, approval rate, technician hours, top customers. |

## Getting started

```bash
npm install
npx expo start        # press i (iOS), a (Android) or w (web)
```

Scan the QR code with **Expo Go** on your phone to try it immediately.

The app opens with a demo workspace ("Evergreen Home Services"). Use **Settings → Signed in as** to switch between the office view and a technician's view. **Settings → Reset demo data** restores the sample workspace.

```bash
npm run typecheck     # TypeScript
npm run export:web    # production web bundle in dist/
```

## Building for the App Store / Play Store

Bundle IDs are set to `org.fieldbooks.app` in `app.json`. Build and submit with EAS:

```bash
npx eas-cli@latest build --platform all
npx eas-cli@latest submit --platform ios   # or android
```

## Project structure

```
src/
  app/                 Expo Router screens
    (tabs)/            Home, Schedule, Jobs, Customers, Money
    job/ customer/ estimate/ invoice/ request/
    book.tsx           public booking page
    reports.tsx settings.tsx requests.tsx
  components/          UI kit (ui.tsx), domain widgets, shared doc editor
  store/               types, Zustand store + actions, demo seed
  lib/                 money/tax math, dates & recurrence, PDF rendering
  theme.ts             colors, type scale, status tones
```

## What's needed for production

This version stores data **on the device** (AsyncStorage) so it works fully offline and is easy to demo. To run a real multi‑user business on it you'll want:

1. **A backend & accounts** — sync the store to a hosted database (e.g. Supabase/Postgres) with sign‑in per team member. All reads/writes already go through the actions in `src/store/store.ts`, so this is the one place to swap in API calls.
2. **Online card payments** — a Stripe (or similar) integration to generate a secure pay link for each invoice and mark it paid via webhook. Today, payments are recorded manually.
3. **Email/SMS delivery** — "Send" currently opens the device share sheet with the PDF; a server-side mailer (e.g. Resend/Twilio) would deliver estimates, invoices, reminders and booking confirmations automatically.
4. **A hosted booking page** — publish `/book` (or the web build) on your domain, e.g. `book.fieldbooks.org`, backed by the same API.
