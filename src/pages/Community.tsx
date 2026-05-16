import React from 'react';
import { motion } from 'motion/react';
import { Activity, Users } from 'lucide-react';
import { CommunitySearch } from '../components/community/CommunitySearch';
import { RequestsPanel } from '../components/community/RequestsPanel';
import { CommunityFeed } from '../components/community/CommunityFeed';

interface CommunityProps {
  onNavigate: (path: string) => void;
}

export function Community({ onNavigate }: CommunityProps) {
  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <span className="mr-4 flex h-16 w-16 items-center justify-center rounded-2xl border border-blue-500/20 bg-blue-500/10">
              <Users className="h-8 w-8 text-blue-300" />
            </span>
            The Fellowship
          </h1>
          <p className="text-zinc-400 mt-2">Friends, sponsors, relapses, and the small wins that keep the brush moving.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="xl:col-span-2 space-y-6"
        >
          <CommunityFeed
            title="Shared Updates"
            emptyText="Your feed will fill up as friends and sponsors share progress."
          />
          <CommunitySearch onNavigate={onNavigate} />
        </motion.div>

        <motion.aside
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="space-y-6"
        >
          <RequestsPanel />
          <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
            <h2 className="text-lg font-bold text-white flex items-center">
              <Activity className="mr-2 h-5 w-5 text-emerald-400" />
              Sharing Controls
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-zinc-500">
              Your public profile, request settings, and feed sharing toggles live in Member Profile.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('settings')}
              className="mt-5 inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 hover:border-blue-500/40 hover:text-blue-300"
            >
              Open Member Profile
            </button>
          </section>
        </motion.aside>
      </div>
    </div>
  );
}

