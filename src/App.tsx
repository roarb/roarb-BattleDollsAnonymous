/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { Login } from './pages/Login';
import { Dashboard } from './pages/Dashboard';
import { Collection } from './pages/Collection';
import { ArmyManager } from './pages/ArmyManager';
import { Matches } from './pages/Matches';
import { Settings } from './pages/Settings';
import { Goals } from './pages/Goals';
import { Community } from './pages/Community';
import { Profile } from './pages/Profile';
import { Navbar } from './components/layout/Navbar';
import { Background } from './components/layout/Background';
import { Footer } from './components/layout/Footer';
import { useAchievements } from './hooks/useAchievements';
import { useCommunityProfileSync } from './hooks/useCommunityProfileSync';
import { AchievementToast } from './components/AchievementToast';

function getHashPath() {
  const hashPath = window.location.hash.replace(/^#\/?/, '');
  return hashPath || 'dashboard';
}

function AuthenticatedApp() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState(getHashPath);
  const { recentUnlock, clearRecentUnlock } = useAchievements();
  useCommunityProfileSync();

  const navigate = React.useCallback((path: string) => {
    setCurrentPath(path);
    const nextHash = `#/${path}`;
    if (window.location.hash !== nextHash) {
      window.history.pushState(null, '', nextHash);
    }
  }, []);

  React.useEffect(() => {
    const handleNavigate = (e: Event) => {
      const customEvent = e as CustomEvent<string>;
      navigate(customEvent.detail);
    };
    window.addEventListener('navigate', handleNavigate);
    return () => window.removeEventListener('navigate', handleNavigate);
  }, [navigate]);

  React.useEffect(() => {
    const handleHashChange = () => setCurrentPath(getHashPath());
    window.addEventListener('hashchange', handleHashChange);
    return () => window.removeEventListener('hashchange', handleHashChange);
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
    if (currentPath.startsWith('profile/')) {
      const uid = currentPath.replace('profile/', '');
      return <Profile uid={uid} onNavigate={navigate} />;
    }

    switch (currentPath) {
      case 'dashboard':
        return <Dashboard />;
      case 'collection':
        return <Collection />;
      case 'army-manager':
        return <ArmyManager />;
      case 'matches':
        return <Matches />;
      case 'goals':
        return <Goals />;
      case 'community':
        return <Community onNavigate={navigate} />;
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
        <Navbar currentPath={currentPath} onNavigate={navigate} />
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
