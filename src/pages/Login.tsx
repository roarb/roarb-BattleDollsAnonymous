import React from 'react';
import { useAuth } from '../contexts/AuthContext';
import { LogIn } from 'lucide-react';
import { motion } from 'motion/react';
import logo from '../assets/WarDollies_Logo.png';

export function Login() {
  const { login } = useAuth();

  return (
    <div className="min-h-screen bg-zinc-950/20 flex flex-col justify-center py-12 sm:px-6 lg:px-8 relative z-10">
      <motion.div 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="sm:mx-auto sm:w-full sm:max-w-md"
      >
        <div className="flex justify-center mb-8">
          <img src={logo} alt="War Dollies Logo" className="h-32 w-auto drop-shadow-[0_0_15px_rgba(59,130,246,0.3)]" />
        </div>
        <h2 className="mt-6 text-center text-xl font-medium text-blue-400 tracking-widest uppercase">
          War Dollies Anonymous
        </h2>
        <h1 className="mt-2 text-center text-4xl font-extrabold text-white tracking-tight">
          Admitting it<br />is the first step.
        </h1>
        <p className="mt-4 text-center text-lg text-zinc-400 max-w-xs mx-auto">
          Your unpainted pile is judging you right now. Let's pretend we're going to fix that.
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
            className="w-full flex justify-center py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-900 transition-colors items-center"
          >
            <LogIn className="mr-2 h-5 w-5" />
            Sign in with Google
          </button>
          
          <div className="mt-6 text-center">
            <button 
              onClick={login}
              className="text-sm text-zinc-500 hover:text-blue-400 transition-colors underline underline-offset-4"
            >
              Accept your fate. Create an account.
            </button>
          </div>
        </div>
      </motion.div>
    </div>
  );
}
