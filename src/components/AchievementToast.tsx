import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Package, Waves, Scissors, SprayCan, Brush, CheckCircle, Flame, CalendarDays, Trophy, X } from 'lucide-react';
import { Achievement } from '../data/achievements';

interface AchievementToastProps {
  achievement: Achievement | null;
  onClose: () => void;
}

const IconMap: Record<string, React.ElementType> = {
  Package,
  Waves,
  Scissors,
  SprayCan,
  Brush,
  CheckCircle,
  Flame,
  CalendarDays,
  Trophy
};

export function AchievementToast({ achievement, onClose }: AchievementToastProps) {
  useEffect(() => {
    if (achievement) {
      const timer = setTimeout(() => {
        onClose();
      }, 5000); // Auto close after 5 seconds
      return () => clearTimeout(timer);
    }
  }, [achievement, onClose]);

  return (
    <AnimatePresence>
      {achievement && (
        <motion.div
          initial={{ opacity: 0, y: 50, scale: 0.9 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.9 }}
          className="fixed bottom-6 right-6 z-50 flex items-center bg-zinc-900 border border-yellow-500/50 rounded-xl p-4 shadow-[0_0_20px_rgba(234,179,8,0.2)] max-w-sm w-full"
        >
          <div className="flex-shrink-0 mr-4 bg-yellow-500/10 p-3 rounded-full border border-yellow-500/30">
            {React.createElement(IconMap[achievement.iconName] || Trophy, {
              className: 'h-8 w-8 text-yellow-400',
            })}
          </div>
          
          <div className="flex-1 min-w-0">
            <p className="text-xs font-bold text-yellow-500 uppercase tracking-widest mb-1">
              Achievement Unlocked!
            </p>
            <h3 className="text-base font-semibold text-white truncate">
              {achievement.title}
            </h3>
            <p className="text-sm text-zinc-400 mt-0.5 line-clamp-2">
              {achievement.description}
            </p>
          </div>
          
          <button
            onClick={onClose}
            className="ml-4 flex-shrink-0 text-zinc-500 hover:text-white transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
