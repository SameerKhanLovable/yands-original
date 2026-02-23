# Yousif & Sons Rent A Car

## Overview
A car rental management application built with React, TypeScript, and Firebase. Features include vehicle management, booking, rental tracking, and user authentication via Firebase Auth with Firestore as the database.

## Project Architecture
- **Frontend**: React + Vite + TypeScript + Tailwind CSS + shadcn/ui
- **Backend**: Firebase (Firestore + Auth) — no separate backend server needed for the main app
- **Legacy Backend**: Python FastAPI with MongoDB (in `/backend/`) — not actively used by the frontend

## Project Structure
```
frontend/          # React application
  src/
    components/    # UI components
    hooks/         # Custom React hooks
    lib/           # Firebase config, Firestore service
    pages/         # Page components
    types/         # TypeScript type definitions
  public/          # Static assets
backend/           # Legacy FastAPI backend (not used by frontend)
memory/            # Project documentation/notes
```

## Development
- Frontend runs on port 5000 via Vite dev server
- Uses Firebase for authentication and data storage
- Deployment configured as static site (Vite build output)

## Recent Changes
- 2026-02-23: Initial Replit setup, configured Vite for port 5000 with proxy support
