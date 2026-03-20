import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { Shield, LogIn } from 'lucide-react';
import { motion } from 'motion/react';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center">
          <Shield className="h-16 w-16 text-fuchsia-500" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-white tracking-tight">
          Battle Dolls Anonymous
        </h2>
        <p className="mt-2 text-center text-sm text-zinc-400">
          Track your miniatures, manage your pile of shame, and build armies with AI.
        </p>
      </motion.div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mt-8 sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="bg-zinc-900 py-8 px-4 shadow sm:rounded-xl sm:px-10 border border-zinc-800">
          <button
            onClick={login}
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-900 transition-colors items-center"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </button>
        </div>
      </motion.div>
    </div>
  );
}
