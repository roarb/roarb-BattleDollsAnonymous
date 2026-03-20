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
import { Settings } from './pages/Settings';
import { Navbar } from './components/layout/Navbar';
import { Background } from './components/layout/Background';

function AuthenticatedApp() {
  const { user } = useAuth();
  const [currentPath, setCurrentPath] = useState('dashboard');

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
      case 'settings':
        return <Settings />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <>
      <Background />
      <div className="min-h-screen bg-zinc-950/20 text-zinc-50 font-sans selection:bg-fuchsia-500/30">
        <Navbar currentPath={currentPath} onNavigate={setCurrentPath} />
        <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8 relative z-10">
          {renderPage()}
        </main>
      </div>
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
