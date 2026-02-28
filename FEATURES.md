# Medha — Platform Overview

## 🎯 Target Audience

| Segment | Description |
|---------|-------------|
| **College Students** (1st–4th year) | Engineering/CS students looking for structured learning paths and career direction |
| **Self-taught Developers** | Learners navigating YouTube tutorials and free resources without a clear roadmap |
| **Career Switchers** | Professionals transitioning into tech who need guided skill-building |
| **Early-career Engineers** (0–2 yrs) | Junior developers aiming to level up, specialize, and build portfolios |
| **Bootcamp Graduates** | Graduates needing to fill skill gaps and demonstrate competence to employers |

---

## 🚀 Core Features

### 1. AI-Powered Career Explorer
- Search any career keyword → get categorized domains, roles, and salary data
- Drill down into specific roles with required skills and growth trajectories
- AI-generated learning roadmaps tailored to Indian & global job markets
- Powered by **Groq LLM + real-time web search + job market APIs**

### 2. Personalized Learning Plans
- Phase-wise learning roadmaps with curated YouTube videos, projects, and resources
- Estimated timelines, skill checkpoints, and difficulty progression
- Job market snapshot: salary ranges, in-demand skills, active job counts
- One-click journey start with progress tracking

### 3. YouTube Learning Tracker
- Auto-tracks YouTube watch history via browser extension
- Categorizes videos as educational vs. distraction
- Shows watch time analytics, learning streaks, and distraction alerts
- Real-time SSE dashboard for live tracking

### 4. Resource Vault & Course Library
- Curated library of free courses, tutorials, and resources
- AI-powered quality analysis for any YouTube video
- ML-based personalized recommendations
- Bookmark, rate, and track progress

### 5. Gamification System
- **XP & Career Ranks**: Intern → Junior → Developer → Senior → Lead → Architect → CTO
- **25+ Achievements** across 7 categories (Skill Mastery, Consistency, Learning, Community, Explorer, Career, Special)
- **Daily Streaks** with streak tracking and rewards
- **Leaderboard** with global ranking by XP

### 6. Goal-Based Onboarding
- 4-step wizard: Dream Role → Experience Level → Time Commitment → Launch
- Saves career goal and learning preferences to user profile
- Redirects to Career Explorer with pre-filled goal for instant roadmap generation

### 7. Achievements Gallery
- Visual achievement cards with Bronze → Diamond tier progression
- Category and tier filtering
- Rank progress bar with next-rank target
- Animated unlock effects

### 8. Public Developer Profiles
- Shareable profile at `/u/:slug` with gamification stats
- Displays career rank, XP, streaks, badges, skills, and project showcase
- Achievement gallery and skill tags

### 9. Referral System
- Unique referral codes (MEDHA-XXXXXX)
- Track signups via `?ref=` parameter
- XP rewards for successful referrals

### 10. Community (Charcha)
- Discussion forum integrated via SSO
- Post questions, share resources, help peers
- Upvotes and community achievements

### 11. Career Readiness Assessment
- AI-powered career readiness scoring
- Skill gap identification with targeted recommendations
- Industry-aligned competency benchmarks

### 12. Blog & Content Platform
- Developer-focused blog articles
- Rich text editor for content creation
- SEO-optimized public articles

### 13. Opportunities Board
- Curated internships, jobs, and hackathons
- Location and skill-based filtering
- Direct application links

### 14. Smart Skill Tracking
- Automatic skill detection from learning activity
- Skill level progression (beginner → advanced)
- Skill-based achievement unlocks

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Frontend** | React 19, Vite, Tailwind CSS 4, Framer Motion |
| **Backend** | Node.js, Express.js, MongoDB (Atlas) |
| **AI/ML** | Groq (LLM), Python ML Classifier (recommendations) |
| **APIs** | YouTube Data API, Google Custom Search, JSearch (jobs) |
| **Auth** | JWT, Google OAuth, OTP-based email verification |
| **Deployment** | Vercel (frontend), Render/custom (backend) |

---

## 💡 What Makes Medha Different

1. **Not just courses** — AI-generated career roadmaps from real job market data
2. **YouTube-native** — Tracks what you actually watch and turns it into structured learning
3. **Gamified progression** — XP, ranks, streaks, and achievements keep learners engaged
4. **Career-outcome focused** — Every feature connects back to landing a real job
5. **Free tier** — Core features available without payment
