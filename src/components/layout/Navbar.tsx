import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, LayoutDashboard, Package, Shield, Swords, Settings } from 'lucide-react';

export function Navbar({ currentPath, onNavigate }: { currentPath: string, onNavigate: (path: string) => void }) {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { name: 'Collection', path: 'collection', icon: Package },
    { name: 'Army Builder', path: 'army-builder', icon: Shield },
    { name: 'Saved Armies', path: 'armies', icon: Swords },
    { name: 'Settings', path: 'settings', icon: Settings },
  ];

  return (
    <nav className="bg-zinc-950/60 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-shrink-0">
            <Shield className="h-8 w-8 text-fuchsia-500" />
            <span className="hidden lg:block ml-2 text-xl font-bold text-white tracking-tight">Battle Dolls Anonymous</span>
          </div>
          
          <div className="flex flex-1 justify-center md:justify-start md:ml-8 space-x-2 sm:space-x-6">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => onNavigate(item.path)}
                  className={`${
                    isActive
                      ? 'border-fuchsia-500 text-white'
                      : 'border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-200'
                  } inline-flex items-center px-2 md:px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  title={item.name}
                >
                  <Icon className="h-6 w-6 md:mr-2 md:h-4 md:w-4" />
                  <span className="hidden md:inline-block">{item.name}</span>
                </button>
              );
            })}
          </div>

          <div className="flex items-center flex-shrink-0 ml-4">
            {user && (
              <div className="flex items-center space-x-4">
                <span className="hidden sm:block text-sm text-zinc-400">{user.displayName}</span>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-zinc-400 hover:text-white hover:bg-zinc-800 transition-colors"
                  title="Logout"
                >
                  <LogOut className="h-5 w-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
}
