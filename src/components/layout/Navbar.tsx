import React from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { LogOut, LayoutDashboard, Package, Shield, Menu, X } from 'lucide-react';
import { useState } from 'react';

export function Navbar({ currentPath, onNavigate }: { currentPath: string, onNavigate: (path: string) => void }) {
  const { user, logout } = useAuth();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: 'Dashboard', path: 'dashboard', icon: LayoutDashboard },
    { name: 'Collection', path: 'collection', icon: Package },
    { name: 'Army Builder', path: 'army-builder', icon: Shield },
  ];

  return (
    <nav className="bg-zinc-900 border-b border-zinc-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Shield className="h-8 w-8 text-fuchsia-500" />
              <span className="ml-2 text-xl font-bold text-white tracking-tight">Battle Dolls Anonymous</span>
            </div>
            <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
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
                    } inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium transition-colors`}
                  >
                    <Icon className="mr-2 h-4 w-4" />
                    {item.name}
                  </button>
                );
              })}
            </div>
          </div>
          <div className="hidden sm:ml-6 sm:flex sm:items-center">
            {user && (
              <div className="flex items-center space-x-4">
                <span className="text-sm text-zinc-400">{user.displayName}</span>
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
          <div className="-mr-2 flex items-center sm:hidden">
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="inline-flex items-center justify-center p-2 rounded-md text-zinc-400 hover:text-white hover:bg-zinc-800 focus:outline-none"
            >
              {isMobileMenuOpen ? <X className="block h-6 w-6" /> : <Menu className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {isMobileMenuOpen && (
        <div className="sm:hidden bg-zinc-900 border-b border-zinc-800">
          <div className="pt-2 pb-3 space-y-1">
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentPath === item.path;
              return (
                <button
                  key={item.path}
                  onClick={() => {
                    onNavigate(item.path);
                    setIsMobileMenuOpen(false);
                  }}
                  className={`${
                    isActive
                      ? 'bg-zinc-800 border-fuchsia-500 text-white'
                      : 'border-transparent text-zinc-400 hover:bg-zinc-800 hover:border-zinc-300 hover:text-zinc-200'
                  } block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left flex items-center`}
                >
                  <Icon className="mr-3 h-5 w-5" />
                  {item.name}
                </button>
              );
            })}
            <button
              onClick={() => {
                logout();
                setIsMobileMenuOpen(false);
              }}
              className="border-transparent text-zinc-400 hover:bg-zinc-800 hover:border-zinc-300 hover:text-zinc-200 block pl-3 pr-4 py-2 border-l-4 text-base font-medium w-full text-left flex items-center"
            >
              <LogOut className="mr-3 h-5 w-5" />
              Logout
            </button>
          </div>
        </div>
      )}
    </nav>
  );
}
