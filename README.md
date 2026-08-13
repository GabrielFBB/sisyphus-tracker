# sisyphus-tracker

A full-stack tracker application with a Next.js frontend and Django backend.

## Structure

- `frontend/` - Next.js application
- `backend/` - Django application
- `docker-compose.yml` - local development orchestration

## Setup

1. Add your Next.js app in `frontend/`.
2. Add your Django app in `backend/`.
3. Update `frontend/Dockerfile` and `backend/Dockerfile` as needed.
4. Run `docker compose up --build` from the repository root.
