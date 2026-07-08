# CRM - Backend Documentation (Planned)

## Tech Stack
- Framework: Django 5.x
- API: Django Rest Framework (DRF)
- Database: MySQL
- Authentication: JWT + Mobile OTP

## Planned Modules
1. Auth Module (Users, Mobile OTP)
2. CRM Module (Leads, Contacts)
3. Project Module (Projects, Tasks, Milestones)
4. Accounting Module (Invoices, Payments)

## Database Schema (Initial)
- Users: id, mobile, email, name, role
- Projects: id, title, description, start_date, end_date, budget, status
- Tasks: id, project_id, title, assigned_to, status, priority
- Leads: id, name, email, mobile, source, status
