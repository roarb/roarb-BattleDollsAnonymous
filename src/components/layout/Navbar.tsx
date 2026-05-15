import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, LayoutDashboard, Package, Shield, Swords, Settings, History, Trophy } from 'lucide-react';
import navLogo from '../../assets/WarDollies_Nav_Logo.png';

export function Navbar({ currentPath, onNavigate }: { currentPath: string, onNavigate: (path: string) => void }) {
  const { user, logout } = useAuth();

  const navItems = [
    { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { name: 'The Stash', path: 'collection', icon: Package },
    { name: 'Army Manager', path: 'army-manager', icon: Shield },
    { name: 'Battle Logs', path: 'matches', icon: History },
    { name: 'Goals & Chips', path: 'goals', icon: Trophy },
  ];

  return (
    <nav className="bg-zinc-950/60 backdrop-blur-md border-b border-zinc-800/80 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center flex-shrink-0">
            <button 
              onClick={() => onNavigate('dashboard')}
              className="flex items-center hover:opacity-80 transition-opacity cursor-pointer"
            >
              <img src={navLogo} alt="War Dollies Logo" className="h-10 w-auto" />
              <span className="hidden lg:block ml-3 text-xl font-bold text-white tracking-tight">War Dollies Anonymous</span>
            </button>
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
                      ? 'border-blue-500 text-white'
                      : 'border-transparent text-zinc-400 hover:border-zinc-300 hover:text-zinc-200'
                  } inline-flex items-center px-2 md:px-1 pt-1 border-b-2 text-sm font-medium transition-colors cursor-pointer`}
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
              <div className="flex items-center space-x-3 sm:space-x-4">
                <button 
                  onClick={() => onNavigate('settings')}
                  className={`flex items-center space-x-3 p-1 pr-2 rounded-full transition-colors cursor-pointer ${currentPath === 'settings' ? 'bg-zinc-800 border border-zinc-700' : 'hover:bg-zinc-800'}`}
                >
                  {user.photoURL && (
                    <img 
                      src={user.photoURL} 
                      alt={user.displayName || 'Profile'} 
                      className="h-8 w-8 rounded-full border border-zinc-700 shadow-sm"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  <span className="hidden sm:block text-sm text-zinc-300 font-medium tracking-wide">
                    {user.displayName}
                  </span>
                </button>
                <div className="w-px h-5 bg-zinc-800 hidden sm:block"></div>
                <button
                  onClick={logout}
                  className="p-2 rounded-full text-zinc-400 hover:text-red-400 hover:bg-zinc-800/50 transition-colors cursor-pointer"
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
