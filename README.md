# VRT3X | Operational Integrity Platform

## Project Overview

VRT3X is a high-trust, institutional-grade operational integrity platform for Skilled Nursing Facilities. Built with a cyber-security terminal aesthetic, VRT3X provides real-time operational intelligence, regulatory compliance tracking, and revenue optimization.

## Core Features

### Three-Pillar Architecture (VRT3X Nodes)

1. **Node 1: Capture (The Sucker)** - Live staffing stream automation
2. **Node 2: Defense (The Shield)** - Good Faith Effort documentation and audit trails
3. **Node 3: Profit (The Bridge)** - PDPM Revenue Audit and optimization

### Key Capabilities

- Real-time facility attention scoring
- Automated staffing data capture via Chrome extension
- Regulatory defense memo generation with integrity hashing
- Revenue leakage detection (acuity/billing mismatches)
- Multi-facility portfolio management
- Legal safe harbor compliance tracking

## How can I edit this code?

There are several ways of editing your application.

**Use your preferred IDE**

If you want to work locally using your own IDE, you can clone this repo and push changes.

The only requirement is having Node.js & npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

Follow these steps:

```sh
# Step 1: Clone the repository using the project's Git URL.
git clone <YOUR_GIT_URL>

# Step 2: Navigate to the project directory.
cd <YOUR_PROJECT_NAME>

# Step 3: Install the necessary dependencies.
npm i

# Step 4: Start the development server with auto-reloading and an instant preview.
npm run dev
```

**Edit a file directly in GitHub**

- Navigate to the desired file(s).
- Click the "Edit" button (pencil icon) at the top right of the file view.
- Make your changes and commit the changes.

**Use GitHub Codespaces**

- Navigate to the main page of your repository.
- Click on the "Code" button (green button) near the top right.
- Select the "Codespaces" tab.
- Click on "New codespace" to launch a new Codespace environment.
- Edit files directly within the Codespace and commit and push your changes once you're done.

## What technologies are used for this project?

This project is built with:

- Vite
- TypeScript
- React
- shadcn-ui
- Tailwind CSS

## How can I deploy this project?

Build the project and deploy to your preferred hosting platform:

```sh
npm run build
```

## Project Structure

- `src/` - Source code
- `extension/` - Chrome extension for data capture
- `supabase/migrations/` - Database migrations
- `tests/` - Test files
