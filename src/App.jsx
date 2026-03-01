import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import ProtectedRoute from './components/ProtectedRoute';

// Landing page
import LandingApp from './LandingApp';

// Auth pages
import Login from './pages/Login';
import Signup from './pages/Signup';

// App shell
import AppLayout from './components/app/AppLayout';

// App pages
import CommandCenter from './pages/app/CommandCenter';
import Productivity from './pages/app/Productivity';
import Career from './pages/app/Career';
import Finance from './pages/app/Finance';
import Fitness from './pages/app/Fitness';
import MentalGrowth from './pages/app/MentalGrowth';
import Analytics from './pages/app/Analytics';
import AIAssistant from './pages/app/AIAssistant';
import Settings from './pages/app/Settings';
import Onboarding from './pages/app/Onboarding';

// Tier 2: Advanced Systems (Stubs)
import GoalPlanning from './pages/app/GoalPlanning';
import Learning from './pages/app/Learning';
import LifeAdmin from './pages/app/LifeAdmin';
import Social from './pages/app/Social';

// Tier 3: Futuristic Systems (Stubs)
import StrategyEngine from './pages/app/StrategyEngine';
import LifeSimulator from './pages/app/LifeSimulator';
import TimeAnalytics from './pages/app/TimeAnalytics';
import RiskRadar from './pages/app/RiskRadar';

import './index.css';
import './app.css';

export default function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <Routes>
            {/* Public landing page */}
            <Route path="/" element={<LandingApp />} />

            {/* Auth routes */}
            <Route path="/login" element={<Login />} />
            <Route path="/signup" element={<Signup />} />

            {/* Onboarding — protected but outside AppLayout */}
            <Route path="/app/onboarding" element={
              <ProtectedRoute>
                <Onboarding />
              </ProtectedRoute>
            } />

            {/* Protected app routes */}
            <Route path="/app" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<CommandCenter />} />
              <Route path="productivity" element={<Productivity />} />
              <Route path="career" element={<Career />} />
              <Route path="finance" element={<Finance />} />
              <Route path="fitness" element={<Fitness />} />
              <Route path="mental" element={<MentalGrowth />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="ai" element={<AIAssistant />} />
              <Route path="settings" element={<Settings />} />

              {/* Tier 2 */}
              <Route path="goals" element={<GoalPlanning />} />
              <Route path="learning" element={<Learning />} />
              <Route path="admin" element={<LifeAdmin />} />
              <Route path="social" element={<Social />} />

              {/* Tier 3 */}
              <Route path="strategy" element={<StrategyEngine />} />
              <Route path="simulator" element={<LifeSimulator />} />
              <Route path="time-analytics" element={<TimeAnalytics />} />
              <Route path="risk-radar" element={<RiskRadar />} />
            </Route>

            {/* Catch-all */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}
