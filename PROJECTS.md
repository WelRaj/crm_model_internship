# CRM - Projects Module Documentation

## Features
- Project Overview: Card-based view with progress tracking.
- Task Management: Table view for granular task tracking.
- Milestones: Visual tracking of project phases.
- Deadlines: Critical date alerts and urgent task monitoring.

## Components
- src/components/dashboard/projects/ProjectHub.tsx: Main entry point for the projects section.

## Data Structure (Mock)
- Projects: ID, Name, Client, Progress, Status, Priority, Deadline.
- Tasks: ID, Name, Project, Assignee, Status, Priority.
- Milestones: Label, Date, Status.
- Deadlines: Label, Date, Priority.

## UI/UX Standards
- Icons: Lucide React.
- Colors: Slate-900 (Primary), Emerald-500 (Accent/Success), Blue-500 (Info), Red-500 (Urgent).
- Transitions: animate-in fade-in slide-in-from-bottom-4
