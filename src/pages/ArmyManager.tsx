import React, { useState } from 'react';
import { Shield, Swords } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { ArmyBuilder } from './ArmyBuilder';
import { Armies } from './Armies';

export function ArmyManager() {
  const [activeTab, setActiveTab] = useState<'build' | 'saved'>('build');

  return (
    <div className="space-y-8 pb-12">
      {/* Header & Tabs */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center mb-6">
          <Shield className="mr-3 h-8 w-8 text-blue-500" />
          Army Manager
        </h1>
        
        <div className="flex space-x-1 bg-zinc-900/50 p-1 rounded-xl border border-zinc-800/80 inline-flex">
          <button
            onClick={() => setActiveTab('build')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'build'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Shield className="w-4 h-4 mr-2" />
            Build New List
          </button>
          <button
            onClick={() => setActiveTab('saved')}
            className={`flex items-center px-6 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
              activeTab === 'saved'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/50'
            }`}
          >
            <Swords className="w-4 h-4 mr-2" />
            Saved Armies
          </button>
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        <motion.div
          key={activeTab}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.2 }}
        >
          {activeTab === 'build' ? (
            <ArmyBuilder onNavigateToSaved={() => setActiveTab('saved')} />
          ) : (
            <Armies onNavigateToBuilder={() => setActiveTab('build')} />
          )}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}
