# Tax-Free Periods Campaign App

A lightweight Node.js + Express project for the Tax-Free Periods advocacy campaign in Ethiopia. The app serves the campaign landing page, stores petition signatures, and generates a PDF export of recorded supporters.

## Features

- Static landing page for the campaign
- Persistent petition storage in a local JSON file
- PDF export of saved signatures
- Simple health check for deployment validation
- Easy deployment path for static + API hosting

## Local setup

1. Install dependencies:
   npm install

2. Copy the sample environment file:
   cp .env.example .env

3. Start the app:
   npm start

4. Open the site:
   http://localhost:3000

## API endpoints

- GET /health
- GET /api/petitions
- POST /api/petitions
- GET /api/petitions/export.pdf

## Storage

Petitions are stored in:

data/petitions.json

The directory and file are created automatically on first run.

## Notes

- The project uses a JSON file for local persistence. For production, you can replace this with PostgreSQL or Supabase.
- The PDF endpoint exports the current petition records for sharing and reporting.
- This project is intentionally lightweight so it can be deployed quickly while remaining easy to extend.
