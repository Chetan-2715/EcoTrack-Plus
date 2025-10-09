# EcoTrack+

EcoTrack+ is a full-stack TypeScript application for tracking eco-friendly habits, earning rewards, and competing with others to help save the planet. It features a modern React frontend, an Express.js backend, and a PostgreSQL database (via Drizzle ORM).

---

## Features

- **User Authentication:** Register and log in securely.
- **Habit Tracking:** Log daily eco-friendly actions (recycling, sustainable transport, energy/water conservation).
- **Points & Rewards:** Earn points for actions and unlock rewards.
- **Leaderboard:** Compete with others for top eco-streaks and points.
- **Responsive UI:** Modern, mobile-friendly design with dark mode support.
- **Community:** Connect and compete with other eco-warriors.

---

## Tech Stack

- **Frontend:** React, TypeScript, Vite, Tailwind CSS, shadcn/ui, Wouter, TanStack Query, React Hook Form, Zod
- **Backend:** Express.js, TypeScript, REST API, Drizzle ORM, PostgreSQL (production) / In-memory (development)
- **Shared:** End-to-end type safety with shared Zod/Drizzle schemas

---

## Project Structure

```
EcoTrack-Plus/
├── client/      # React frontend
├── server/      # Express backend
├── shared/      # Shared types and schemas
├── package.json
├── README.md
└── ...
```

---

## Getting Started

### Prerequisites

- Node.js (v18+ recommended)
- npm

### Setup

1. **Clone the repo:**
   ```bash
   git clone https://github.com/yourusername/EcoTrack-Plus.git
   cd EcoTrack-Plus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Environment variables:**
   - Copy `.env.example` to `.env` and fill in required values (e.g., `DATABASE_URL`).

4. **Run in development:**
   ```bash
   npm run dev
   ```
   - This starts both the frontend and backend with hot reload.

## Database

- **Development:** Uses in-memory storage for quick prototyping.
- **Production:** Uses PostgreSQL with Drizzle ORM.
- **Schema:** Defined in `shared/schema.ts` and shared between client/server.

---

## API Endpoints

- `/api/auth/register` - Register a new user
- `/api/auth/login` - Login
- `/api/users/:id` - Get/update user profile
- `/api/habits/:userId` - Log/view habits
- `/api/activity/:userId` - Get activity data
- `/api/leaderboard` - View leaderboard
- `/api/rewards` - List rewards

---

## Customization

- **Theming:** Easily switch between light/dark mode.
- **Points System:** Configure points per habit in the backend.
- **Rewards:** Add/edit rewards in the database.

---