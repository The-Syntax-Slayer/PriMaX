# ⚡ PriMaX Hub — The AI-Powered Personal Growth OS

[![Vite](https://img.shields.io/badge/Vite-7.3+-646CFF?style=for-the-badge&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React](https://img.shields.io/badge/React-19.0-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev/)
[![Supabase](https://img.shields.io/badge/Supabase-Persistence-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com/)
[![Gemini](https://img.shields.io/badge/Google_Gemini-AI_Engine-8E75FF?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

**PriMaX Hub** is a premium, all-in-one personal performance platform designed to unify your Career, Finance, Productivity, and Wellness into a single, AI-driven ecosystem. Built for high-performers, it leverages cutting-edge AI to provide actionable insights and automated planning.

---

## 🚀 Key Modules & Features

### 🏢 Career Strategy
- **AI Roadmap Generator**: Customized career paths from current role to target role using Gemini.
- **Mock Interviews**: Domain-specific question sets generated in real-time.
- **Resume Hub**: Professional profile management and resume exports.

### 💰 Intelligent Finance
- **Interactive Dashboards**: Real-time tracking of income, expenses, and net balance (support for ₹ Rupees).
- **AI Financial Advisor**: Get personalized advice based on your actual spending patterns.
- **Budgeting & Savings**: Set monthly limits and track progress toward multiple financial goals.

### ⚡ Peak Productivity
- **AI Kanban Board**: Manage tasks with priority levels and automated scheduling tips.
- **Focus Mode**: Integrated Pomodoro timer to maintain flow state.
- **Real-time Sync**: Full Supabase integration for instant data persistence.

### 🧠 Mindset & Fitness
- **Journaling & Mood**: Track mental well-being with AI mindset coaching.
- **Workout Engine**: Science-backed fitness guidance and streak tracking.

---

## 🛠️ Tech Stack

- **Core**: React 19, Vite, React Router Dom 7
- **Styling**: Vanilla CSS (Custom Variable System), Framer Motion (Animations)
- **Backend**: Supabase (PostgreSQL, Real-time, Auth)
- **Intelligence**: Google Gemini AI (Vertex AI/Generative AI SDK)
- **VFX**: tsparticles (High-performance particle systems)
- **Icons**: Lucide (via react-icons)

---

## ⚙️ Installation & Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/The-Syntax-Slayer/PriMaX.git
   cd PriMaX
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Create a `.env` file in the root directory:
   ```env
   VITE_SUPABASE_URL=your_supabase_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   VITE_GEMINI_API_KEY=your_gemini_api_key
   ```

4. **Launch Dev Server**
   ```bash
   npm run dev
   ```

---

## 📁 Project Structure

```text
src/
├── components/   # Reusable UI components (Modals, Cards, Nav)
├── contexts/     # Auth and Global State providers
├── lib/          # AI Services, Supabase Client, Mock Data
├── pages/        # Core Module Containers (Finance, Career, etc.)
└── assets/       # Static branding and media
```

---

## 📄 License
This project is private and intended for academic study.

Built with ❤️ for human potential.
