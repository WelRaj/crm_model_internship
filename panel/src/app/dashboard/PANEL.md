# CRM Project - Panel Documentation

## Overview
Premium CRM Panel built with Next.js (App Router), TypeScript, and Tailwind CSS.

## Current Status
- [x] Next.js Initialization
- [x] Senior-level Folder Structure
- [x] Premium Color Palette (Tailwind Config)
- [x] Base API Client (Decoupled Layer)
- [x] Auth Screens (Signup & OTP Signin)
- [x] Dashboard Layout & Navigation
- [x] Client Operations / CRM Module
- [x] People Operations / HRMS Module
- [x] Delivery Projects Module
- [x] Finance Control Module
- [x] Growth Marketing Module
- [x] Admin Control Module
- [x] Support Desk Module
- [x] Notifications + Audit visibility
- [x] RBAC page filtering and page guards
- [x] Backend-connected central API wrappers
- [x] Production smoke verification on seeded fake data

## Components Added
- src/components/ui/Input.tsx: Premium reusable input.
- src/components/ui/Button.tsx: Premium reusable button.
- src/components/auth/SignupForm.tsx: Registration flow.
- src/components/auth/SigninForm.tsx: 2-step OTP flow.

## Pages Created
- /auth/signup: User registration.
- /auth/signin: OTP based mobile login.
- /dashboard: Central CRM hub with module switching.
- Dashboard tabs inside /dashboard:
  - Lead Desk
  - Lead Assignment
  - Calling Desk
  - Follow-ups
  - Lead Outcomes
  - Project Clients
  - Legal Agreements
  - Employee Onboarding
  - Employee Directory
  - Attendance
  - Leave Management
  - Payroll
  - Exit Process
  - Project Portfolio
  - Team Assignment
  - Tasks
  - Milestones
  - Deadlines
  - Team Performance
  - Client Master
  - Vendor Master
  - Quotations
  - Invoices
  - Payments
  - Reminders
  - Credit Notes
  - Sales, Purchases & Expenses
  - Budget Control
  - Payroll Register
  - GST Compliance
  - TDS Compliance
  - Finance Reports
  - Finance Approvals
  - Audit Logs
  - Access Control
  - Bank Details
  - Campaigns
  - ROI
  - Lead Sources
  - Support Desk
  - Admin Control

## Theme (Tailwind)
- Primary: #0f172a (Navy)
- Accent: #10b981 (Emerald)
- Background: #f8fafc (Slate)

## API Configuration
- Base URL: http://localhost:8000/api
- Client: src/lib/api-client.ts

## Notes
- Dashboard is intentionally a single-shell tab system, not separate route pages for every module.
- All module API calls should stay centralized through the service wrappers.
- Production focus: clean RBAC, smooth flow, no duplicate APIs, and no hidden local-only data paths.
