import React from 'react';
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts';
import { CommunityProfile } from '../../lib/community';

interface ProfileProgressDonutProps {
  profile: CommunityProfile;
}

export function ProfileProgressDonut({ profile }: ProfileProgressDonutProps) {
  const summary = profile.progressSummary || {
    unbuilt: 0,
    assembled: 0,
    primed: 0,
    basicPaint: 0,
    completed: 0,
    total: 0,
  };

  const needsWork = summary.unbuilt + summary.assembled + summary.primed;
  const battleReady = summary.basicPaint + summary.completed;
  const chartData = [
    { name: 'Needs Work', value: needsWork, color: '#f87171' },
    { name: 'Battle Ready', value: battleReady, color: '#60a5fa' },
  ].filter((item) => item.value > 0);

  const completionRate = summary.total > 0 ? Math.round((battleReady / summary.total) * 100) : 0;

  return (
    <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">Progress Snapshot</h2>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-400">
          {summary.total || 0} models
        </span>
      </div>

      <div className="h-56 relative">
        {chartData.length > 0 ? (
          <>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  innerRadius={64}
                  outerRadius={86}
                  paddingAngle={2}
                  dataKey="value"
                  stroke="none"
                >
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
            <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
              <span className="text-4xl font-black text-white">{completionRate}%</span>
              <span className="text-xs uppercase tracking-widest text-zinc-500">Ready</span>
            </div>
          </>
        ) : (
          <div className="absolute inset-0 flex items-center justify-center text-sm text-zinc-500">
            No shared progress yet.
          </div>
        )}
      </div>

      <div className="mt-5 grid grid-cols-2 gap-3 text-xs text-zinc-400">
        <LegendItem label="Unbuilt" value={summary.unbuilt} color="#f87171" />
        <LegendItem label="Assembled" value={summary.assembled} color="#d4d4d8" />
        <LegendItem label="Primed" value={summary.primed} color="#fbbf24" />
        <LegendItem label="Basic Paint" value={summary.basicPaint} color="#3b82f6" />
        <LegendItem label="Completed" value={summary.completed} color="#60a5fa" />
      </div>
    </section>
  );
}

function LegendItem({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex items-center min-w-0">
      <span className="mr-2 h-3 w-3 rounded-full flex-shrink-0" style={{ backgroundColor: color }} />
      <span className="truncate">{label}</span>
      <span className="ml-auto font-semibold text-white">{value || 0}</span>
    </div>
  );
}

