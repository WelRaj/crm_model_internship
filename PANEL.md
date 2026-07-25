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
- [x] Projects Module UI (Projects, Tasks, Milestones, Deadlines)
- [x] Client Operations / CRM Module
- [ ] Onboarding Module
- [ ] Lead Module
- [ ] Accounting Module

## Components Added
- src/components/ui/Input.tsx: Premium reusable input.
- src/components/ui/Button.tsx: Premium reusable button.
- src/components/auth/SignupForm.tsx: Registration flow.
- src/components/auth/SigninForm.tsx: 2-step OTP flow.
- src/components/dashboard/projects/ProjectHub.tsx: Project management UI.

## Pages Created
- /auth/signup: User registration.
- /auth/signin: OTP based mobile login.
- /dashboard: Central CRM hub with module switching.

## Theme (Tailwind)
- Primary: #0f172a (Navy)
- Accent: #10b981 (Emerald)
- Background: #f8fafc (Slate)

## API Configuration
- Base URL: http://localhost:8000/api
- Client: src/lib/api-client.ts
