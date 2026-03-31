# 🌱 EcoTrack+
Track Your Habits. Save the Planet. <br><br>

**EcoTrack+** is a comprehensive full-stack web application that gamifies environmental sustainability by allowing users to track eco-friendly habits, earn points, compete on leaderboards, and make a real difference for the planet. Built with modern technologies and a beautiful, responsive UI.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Neon](https://img.shields.io/badge/Neon-00E5A0?style=flat&logo=postgresql&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## ✨ Key Features

### 🔐 **User Management**
- **Secure Authentication:** Email/password-based registration and login with auto-redirect
- **Profile Customization:** Upload and manage profile pictures with image compression
- **Account Management:** Update username, remove profile photo, delete account
- **Session Persistence:** localStorage-based sessions that persist across page refreshes

### 📊 **Habit Tracking Dashboard**
- **Four Eco-Actions:**
  - ♻️ **Recycling:** Track recycled items (+5 points each)
  - 🚆 **Public Transport:** Log trips with distance tracking (+1-4 points based on distance)
  - 💧 **Water Conservation:** Record liters saved (+4 points)
  - 🌳 **Tree Planting:** Log planted trees (+5 points)
  
- **Action Forms with Validation:**
  - Upload verification photos (with automatic compression)
  - Add descriptions for each action
  - Specify distances and locations for transport
  - Track recycled item types

### 🤖 **AI-Powered Eco Assistant**
- **Gemini-Powered Chatbot:** Get personalized eco-tips and sustainability advice
- **Habit Recommendations:** AI suggests new eco-friendly habits based on your activity
- **Environmental Impact Insights:** Learn about your carbon footprint reduction
- **Interactive Q&A:** Ask questions about sustainability and get AI-generated responses

### 📜 **Action History**
- **Complete History View:** Scrollable list of all eco-actions taken
- **Detailed Action Modal:** Click any action to view full details, photos, and routes
- **Delete Actions:** Remove incorrectly logged actions

### 📈 **Activity Heatmap**
- **GitHub-Style Visualization:** 12-week (84-day) activity grid on profile
- **Color-Coded Intensity:** Green gradient based on daily action count
- **Interactive Tooltips:** Hover to see exact dates and action counts

### 🏆 **Leaderboard & Competition**
- **Global Rankings:** See top eco-warriors
- **Podium Display:** Special cards for top 3 users with avatars
- **Real-Time Updates:** Rankings update instantly

### 🎁 **Rewards System**
- Unlock rewards based on accumulated points
- Claim special badges and achievements (Eco Warrior, Tree Planter, Carbon Neutral Champion, etc.)

---

## 🛠️ Tech Stack

### **Frontend**
| Technology | Purpose |
|-----------|---------|
| React 18 + TypeScript | UI framework |
| Vite | Build tool with HMR |
| TailwindCSS | Utility-first styling |
| shadcn/ui | Accessible component library |
| TanStack Query | Data fetching & caching |
| Wouter | Lightweight client-side routing |
| Lucide React | Icon library |
| Browser Image Compression | Client-side image optimization |

### **Backend**
| Technology | Purpose |
|-----------|---------|
| Node.js + TypeScript | Runtime |
| Express.js | HTTP server |
| Neon PostgreSQL | Serverless database (via `@neondatabase/serverless`) |
| Drizzle ORM | Type-safe schema definitions |
| Zod | Input validation |

### **AI & APIs**
| Technology | Purpose |
|-----------|---------|
| Google Gemini API | AI chatbot & eco-recommendations |
| OpenRouteService API | Transport distance calculation |

---

## 📁 Project Structure

```
EcoTrack-Plus/
├── client/                      # React frontend
│   ├── src/
│   │   ├── components/          # Reusable UI components
│   │   │   ├── ui/              # shadcn/ui primitives
│   │   │   ├── chatbot.tsx      # AI eco-assistant
│   │   │   ├── habit-card.tsx   # Habit tracker cards
│   │   │   ├── habit-forms.tsx  # Action submission forms
│   │   │   ├── navbar.tsx       # Navigation bar
│   │   │   └── user-avatar.tsx  # Profile picture component
│   │   ├── lib/
│   │   │   ├── auth.tsx         # Auth context (localStorage + API)
│   │   │   └── queryClient.ts   # TanStack Query config
│   │   ├── pages/
│   │   │   ├── auth.tsx         # Login/Register container
│   │   │   ├── dashboard.tsx    # Main habit tracker
│   │   │   ├── leaderboard.tsx  # Global rankings
│   │   │   ├── login.tsx        # Login form
│   │   │   ├── profile.tsx      # User profile & heatmap
│   │   │   ├── register.tsx     # Registration form
│   │   │   └── rewards.tsx      # Rewards store
│   │   └── index.css            # Global styles
│   ├── .env                     # Client env (API keys only)
│   └── index.html
├── server/                      # Express backend
│   ├── index.ts                 # Server entry point
│   ├── routes.ts                # API route definitions
│   ├── neon-storage.ts          # Neon PostgreSQL storage layer
│   └── vite.ts                  # Vite dev middleware
├── shared/
│   └── schema.ts                # Drizzle ORM schema + Zod types
├── migrations/
│   └── 001_init.sql             # Database schema migration
├── .env                         # Server env (DATABASE_URL)
├── .env.example                 # Environment template
├── drizzle.config.ts            # Drizzle Kit configuration
├── package.json
├── tsconfig.json
├── tailwind.config.ts
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** v18 or higher
- **npm**
- **Neon Account** — free tier at [neon.tech](https://neon.tech)

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/Chetan-2715/EcoTrack-Plus.git
   cd EcoTrack-Plus
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Set up Neon PostgreSQL:**

   - Create a new project at [console.neon.tech](https://console.neon.tech)
   - Go to **SQL Editor** and run the migration file:

   ```bash
   # Copy the contents of migrations/001_init.sql and execute in Neon SQL Editor
   ```

   This creates the `users`, `habits`, `rewards`, and `user_rewards` tables along with indexes and seed data.

4. **Configure environment variables:**

   Copy the template and fill in your values:

   ```bash
   cp .env.example .env
   ```

   **Root `.env`:**
   ```env
   DATABASE_URL=postgresql://neondb_owner:YOUR_PASSWORD@YOUR_HOST.neon.tech/neondb?sslmode=require
   ```

   **Client `client/.env`** (optional, for AI features):
   ```env
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_ORS_API_KEY=your_openrouteservice_key
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

---

## 🌐 API Endpoints

### Authentication
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/auth/register` | Register a new user |
| `POST` | `/api/auth/login` | Login with email/password |

### User Management
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/users/:id` | Get user profile with stats |
| `PUT` | `/api/users/:id` | Update profile (username, avatar) |
| `DELETE` | `/api/users/:id` | Delete user account |

### Habits & Actions
| Method | Endpoint | Description |
|--------|----------|-------------|
| `POST` | `/api/habits/:userId` | Log a new eco-action |
| `GET` | `/api/habits/:userId/today` | Get today's habits summary |
| `GET` | `/api/habits/:userId/history` | Get action history (last 50) |
| `DELETE` | `/api/habits/:userId/history/:id` | Delete a specific action |

### Analytics & Social
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/activity/:userId` | Daily activity data (heatmap) |
| `GET` | `/api/leaderboard` | Global rankings |

### Rewards
| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/api/rewards` | List available rewards |
| `GET` | `/api/rewards/:userId` | Get user's claimed rewards |
| `POST` | `/api/rewards/:userId/claim` | Claim a reward |

---

## 🔒 Security

- Password-based authentication with server-side validation
- Email uniqueness validation (case-insensitive)
- Parameterized SQL queries (injection-safe via `@neondatabase/serverless` tagged templates)
- Environment variables for all secrets (never committed to git)
- CORS and request validation on all endpoints

---

## 🎨 Design Highlights

- **Responsive Design:** Mobile-first with tablet/desktop optimization
- **Dark Mode:** System-preference detection + manual toggle
- **Glassmorphism:** Frosted glass cards with backdrop blur
- **Micro-Animations:** Smooth transitions, hover effects, and interactive elements
- **Activity Heatmap:** GitHub-style contribution visualization
- **Flip Card Auth:** Animated card flip between login/register forms

---

## 🎯 Future Enhancements

- [ ] OAuth integration (Google, GitHub)
- [ ] Social features (friends, challenges)
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] Carbon footprint calculator
- [ ] Community challenges
- [ ] Data export (CSV, PDF)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit (`git commit -m 'Add amazing feature'`)
5. Push (`git push origin feature/amazing-feature`)
6. Open a Pull Request

---

## 👨‍💻 Author

**Chetan Shabadi**

- GitHub: [@Chetan-2715](https://github.com/Chetan-2715)
- Project: [EcoTrack-Plus](https://github.com/Chetan-2715/EcoTrack-Plus)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) — Component library
- [Neon](https://neon.tech/) — Serverless PostgreSQL
- [Lucide](https://lucide.dev/) — Icon set
- [TailwindCSS](https://tailwindcss.com/) — Styling framework
- [Google Gemini](https://ai.google.dev/) — AI capabilities

---

**Made with 💚 for a greener planet**

*Every action counts. Start tracking today and make a difference!* 🌱