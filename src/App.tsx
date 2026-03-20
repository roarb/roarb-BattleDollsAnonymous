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
import { Navbar } from './components/layout/Navbar';

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
    return <Login />;
  }

  const renderPage = () => {
    switch (currentPath) {
      case 'dashboard':
        return <Dashboard />;
      case 'collection':
        return <Collection />;
      case 'army-builder':
        return <ArmyBuilder />;
      default:
        return <Dashboard />;
    }
  };

  return (
    <div className="min-h-screen bg-zinc-950 text-zinc-50 font-sans selection:bg-fuchsia-500/30">
      <Navbar currentPath={currentPath} onNavigate={setCurrentPath} />
      <main className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
        {renderPage()}
      </main>
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <AuthenticatedApp />
    </AuthProvider>
  );
}
