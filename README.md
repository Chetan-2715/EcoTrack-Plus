# 🌱 EcoTrack+

**EcoTrack+** is a comprehensive full-stack web application that gamifies environmental sustainability by allowing users to track eco-friendly habits, earn points, compete on leaderboards, and make a real difference for the planet. Built with modern technologies and a beautiful, responsive UI.

![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Express](https://img.shields.io/badge/Express-000000?style=flat&logo=express&logoColor=white)
![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white)
![TailwindCSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white)

---

## ✨ Key Features

### 🔐 **User Management**
- **Secure Authentication:** Email/password-based registration and login
- **Profile Customization:** Upload and manage profile pictures with image compression
- **Account Management:** Update username, remove profile photo, delete account
- **Join Date Display:** See when you became part of the eco-community

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

### 📜 **Action History**
- **Complete History View:** Scrollable list of all eco-actions taken
- **Detailed Action Modal:** Click any action to view:
  - Full date and time
  - Action type and count
  - Points earned
  - User description
  - Verification photo
  - Transport details (distance, route)
  - Recycled items

### 📈 **Activity Heatmap**
- **GitHub-Style Visualization:** 12-week (84-day) activity grid
- **Color-Coded Intensity:** Green gradient based on daily actions
- **Interactive Tooltips:** Hover to see exact dates and action counts
- **Always Visible:** Shows all 84 squares even with no data

### 🏆 **Leaderboard & Competition**
- **Global Rankings:** See top eco-warriors
- **Podium Display:** Special cards for top 3 users
- **Profile Pictures:** Avatars displayed for all users
- **Real-Time Updates:** Rankings update instantly
- **Stats Display:** Points, streaks, and rankings

### 👤 **Comprehensive Profile Page**
- **Profile Photo:** Large avatar with upload/remove options
- **Editable Username:** Click to edit inline
- **Join Date:** Display account creation date
- **Statistics Grid:**
  - Total points earned
  - Total actions taken
  - Active days streak
- **Activity Heatmap:** Visual representation of daily engagement
- **Performance Optimized:** Parallel data fetching for fast loading

### 🎁 **Rewards System**
- Unlock rewards based on points
- Claim special badges and achievements

---

## 🛠️ Tech Stack

### **Frontend**
- **React 18** with TypeScript
- **Vite** - Lightning-fast build tool
- **TailwindCSS** - Utility-first styling
- **shadcn/ui** - Beautiful, accessible components
- **Lucide React** - Modern icon library
- **TanStack Query** - Powerful data fetching and caching
- **React Hook Form** - Performant form validation
- **Zod** - TypeScript-first schema validation
- **Wouter** - Lightweight routing
- **Browser Image Compression** - Client-side image optimization

### **Backend**
- **Node.js** with TypeScript
- **Express.js** - Fast, minimalist web framework
- **Supabase** - PostgreSQL database with real-time capabilities
- **Supabase Client** - Database operations and auth
- **Drizzle ORM** - Type-safe database schema
- **dotenv** - Environment variable management

### **Development Tools**
- **TSX** - TypeScript execution
- **Vite HMR** - Hot module replacement
- **ESLint** - Code linting
- **Cross-env** - Cross-platform environment variables

---

## 📁 Project Structure

```
EcoTrack-Plus/
├── client/                   # React frontend application
│   ├── src/
│   │   ├── components/       # Reusable UI components
│   │   │   ├── ui/          # shadcn/ui components
│   │   │   ├── habit-card.tsx
│   │   │   ├── habit-forms.tsx
│   │   │   └── user-avatar.tsx
│   │   ├── hooks/           # Custom React hooks
│   │   ├── lib/             # Utilities and configurations
│   │   │   ├── auth.tsx     # Authentication context
│   │   │   ├── supabase.ts  # Supabase client setup
│   │   │   └── queryClient.ts
│   │   ├── pages/           # Page components
│   │   │   ├── dashboard.tsx
│   │   │   ├── profile.tsx
│   │   │   ├── leaderboard.tsx
│   │   │   ├── login.tsx
│   │   │   └── register.tsx
│   │   └── index.css        # Global styles
│   └── index.html
├── server/                   # Express.js backend
│   ├── index.ts             # Server entry point
│   ├── routes.ts            # API route definitions
│   ├── supabase-storage.ts  # Database operations
│   └── vite.ts              # Vite integration
├── shared/                   # Shared code between client/server
│   └── schema.ts            # Zod schemas and types
├── .env                     # Environment variables
├── package.json
├── tsconfig.json
└── vite.config.ts
```

---

## 🚀 Getting Started

### Prerequisites

- **Node.js** (v18 or higher)
- **npm** or **yarn**
- **Supabase Account** (free tier available)

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

3. **Set up Supabase:**

   - Create a new project at [supabase.com](https://supabase.com)
   - Go to **Settings** → **API** and copy your credentials
   - Run the following SQL in your Supabase SQL Editor:

   ```sql
   -- Create users table
   CREATE TABLE users (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     username TEXT NOT NULL,
     email TEXT UNIQUE NOT NULL,
     password TEXT NOT NULL,
     points INTEGER DEFAULT 0,
     streak INTEGER DEFAULT 0,
     avatar_url TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create habits table
   CREATE TABLE habits (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     habit_type TEXT NOT NULL,
     count INTEGER DEFAULT 0,
     date DATE NOT NULL,
     points_earned INTEGER DEFAULT 0,
     verified INTEGER DEFAULT 1,
     distance REAL,
     start_location TEXT,
     end_location TEXT,
     recycled_item TEXT,
     image_url TEXT,
     description TEXT,
     created_at TIMESTAMP DEFAULT NOW()
   );

   -- Create rewards table
   CREATE TABLE rewards (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     title TEXT NOT NULL,
     description TEXT,
     points_required INTEGER NOT NULL,
     icon TEXT
   );

   -- Create user_rewards table
   CREATE TABLE user_rewards (
     id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
     user_id UUID REFERENCES users(id) ON DELETE CASCADE,
     reward_id UUID REFERENCES rewards(id) ON DELETE CASCADE,
     claimed_at TIMESTAMP DEFAULT NOW()
   );

   -- Create indexes for better performance
   CREATE INDEX idx_habits_user_date ON habits(user_id, date);
   CREATE INDEX idx_users_email ON users(email);
   CREATE INDEX idx_users_points ON users(points DESC);
   ```

4. **Configure environment variables:**

   Create a `.env` file in the root directory:

   ```env
   SUPABASE_URL=your_supabase_project_url
   SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

5. **Start the development server:**
   ```bash
   npm run dev
   ```

   The app will be available at `http://localhost:5000`

---

## 🌐 API Endpoints

### Authentication
- `POST /api/auth/register` - Register a new user
- `POST /api/auth/login` - Login with email and password

### User Management
- `GET /api/users/:id` - Get user profile with stats
- `PUT /api/users/:id` - Update user profile (username, avatar)
- `DELETE /api/users/:id` - Delete user account

### Habits & Actions
- `POST /api/habits/:userId` - Log a new eco-action
- `GET /api/habits/:userId/today` - Get today's habits summary
- `GET /api/habits/:userId/history` - Get detailed action history (last 50)

### Analytics
- `GET /api/activity/:userId` - Get daily activity data (for heatmap)

### Leaderboard
- `GET /api/leaderboard` - Get global rankings with avatars

### Rewards
- `GET /api/rewards` - List all available rewards
- `GET /api/rewards/:userId` - Get user's claimed rewards
- `POST /api/rewards/:userId/claim` - Claim a reward

---

## 🎨 Features in Detail

### **Image Upload & Compression**
- Client-side image compression to reduce storage costs
- Supports JPEG, PNG, GIF formats
- Maximum file size: 2MB (before compression)
- Automatic quality optimization
- Base64 encoding for database storage

### **Session Persistence**
- User sessions persist across page refreshes
- localStorage + API validation
- Automatic logout on account deletion
- Secure token handling

### **Performance Optimizations**
- Parallel API requests with `Promise.all()`
- TanStack Query caching
- Optimistic UI updates
- Image lazy loading
- Efficient database indexing

### **Responsive Design**
- Mobile-first approach
- Tablet and desktop optimized
- Touch-friendly interactions
- Smooth animations and transitions

---

## 🔒 Security Features

- Password-based authentication
- Email uniqueness validation (case-insensitive)
- SQL injection protection via Supabase
- Environment variable protection
- Secure API endpoints

---

## 🎯 Future Enhancements

- [ ] Social features (friends, challenges)
- [ ] Real-time notifications
- [ ] Mobile app (React Native)
- [ ] AI-powered habit suggestions
- [ ] Carbon footprint calculator
- [ ] Community challenges
- [ ] Export data (CSV, PDF)
- [ ] OAuth integration (Google, GitHub)

---

## 🤝 Contributing

Contributions are welcome! To contribute:

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Commit your changes (`git commit -m 'Add some amazing feature'`)
5. Push to the branch (`git push origin feature/amazing-feature`)
6. Open a Pull Request

Please make sure to:
- Follow the existing code style
- Write meaningful commit messages
- Test your changes thoroughly
- Update documentation as needed

---

## 👨‍💻 Author

**Chetan Shabadi**

- GitHub: [@Chetan-2715](https://github.com/Chetan-2715)
- Project Link: [EcoTrack-Plus](https://github.com/Chetan-2715/EcoTrack-Plus)

---

## 🙏 Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Supabase](https://supabase.com/) for the powerful backend infrastructure
- [Lucide](https://lucide.dev/) for the icon set
- [TailwindCSS](https://tailwindcss.com/) for the styling framework
- All contributors and eco-warriors using this app to make a difference! 🌍



## 💡 Tips for Users

- **Daily Consistency:** Log actions daily to build your streak
- **Verification Photos:** Always upload photos for better tracking
- **Descriptions:** Add meaningful descriptions to remember your actions
- **Compete:** Check the leaderboard regularly to stay motivated
- **Profile:** Keep your profile updated with a picture and username

---


**Made with 💚 for a greener planet**

*Every action counts. Start tracking today and make a difference!* 🌱