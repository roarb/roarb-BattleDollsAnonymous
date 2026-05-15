/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Collection } from './pages/Collection';
import { ArmyBuilder } from './pages/ArmyBuilder';
import { Armies } from './pages/Armies';
import { Matches } from './pages/Matches';
import { Settings } from './pages/Settings';
import { Navbar } from './components/layout/Navbar';
import { Background } from './components/layout/Background';
import { Footer } from './components/layout/Footer';
import { useAchievements } from './hooks/useAchievements';
import { AchievementToast } from './components/AchievementToast';

function AuthenticatedApp() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('dashboard');
  const { recentUnlock, clearRecentUnlock } = useAchievements();

  React.useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      setCurrentPath(customEvent.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, []);

  if (!user) {
    return (
      <>
        <Background />
        <Login />
      </>
    );
  }

  const renderPage = () => {
    switch (currentPath) {
      case 'dashboard':
        return <Dashboard />;
      case 'collection':
        return <Collection />;
      case 'army-builder':
        return <ArmyBuilder />;
      case 'armies':
        return <Armies />;
      case 'matches':
        return <Matches />;
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Background />
      <div className="min-h-screen flex flex-col bg-zinc-950/20 text-zinc-50 font-sans selection:bg-blue-500/30">
        <Navbar currentPath={currentPath} onNavigate={setCurrentPath} />
        <main className="flex-1 w-full max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
          {renderPage()}
        </main>
        <Footer />
      </div>
      <AchievementToast achievement={recentUnlock} onClose={clearRecentUnlock} />
    </>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
