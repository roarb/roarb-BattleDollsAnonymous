import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';
import { 
  Target, Medal, Package, Waves, Scissors, SprayCan, Brush, CheckCircle, 
  Flame, CalendarDays, Lock, CreditCard, Mountain, Wrench, Wind, Palette, 
  Swords, Sun, Crown, Skull, Star, Save, Loader2 
} from 'lucide-react';
import { motion } from 'motion/react';
import { ACHIEVEMENTS } from '../data/achievements';

const IconMap: Record<string, React.ElementType> = {
  Package, Waves, Scissors, SprayCan, Brush, CheckCircle, Flame, CalendarDays, Medal,
  CreditCard, Mountain, Wrench, Wind, Palette, Swords, Sun, Crown, Skull, Star
};

interface ArmyList {
  id: string;
  title: string;
  faction: string;
}

export function Goals() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [targetSelection, setTargetSelection] = useState('none');
  const [availableFactions, setAvailableFactions] = useState<string[]>([]);
  const [availableArmies, setAvailableArmies] = useState<ArmyList[]>([]);
  const [successMessage, setSuccessMessage] = useState('');
  const [unlockedIds, setUnlockedIds] = useState<string[]>([]);

  useEffect(() => {
    if (!user) return;
    
    const fetchSettingsAndData = async () => {
      try {
        // Fetch user settings
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.targetArmyId) {
            setTargetSelection(`army:${data.targetArmyId}`);
          } else if (data.targetFaction) {
            setTargetSelection(`faction:${data.targetFaction}`);
          }
          setUnlockedIds(data.unlockedAchievements || []);
        }

        // Fetch available factions from collection
        const qCol = query(collection(db, 'collection'), where('uid', '==', user.uid));
        const snapshotCol = await getDocs(qCol);
        const factions = new Set<string>();
        snapshotCol.forEach(doc => {
          const data = doc.data();
          if (data.faction) factions.add(data.faction);
        });
        setAvailableFactions(Array.from(factions).sort());

        // Fetch available armies
        const qArmies = query(collection(db, 'armyLists'), where('uid', '==', user.uid));
        const snapshotArmies = await getDocs(qArmies);
        const armies: ArmyList[] = [];
        snapshotArmies.forEach(doc => {
          const data = doc.data();
          armies.push({ id: doc.id, title: data.title, faction: data.faction });
        });
        setAvailableArmies(armies.sort((a, b) => a.title.localeCompare(b.title)));

      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'users/collection/armyLists');
      } finally {
        setLoading(false);
      }
    };

    fetchSettingsAndData();
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMessage('');
    try {
      let targetFaction = '';
      let targetArmyId = '';

      if (targetSelection.startsWith('faction:')) {
        targetFaction = targetSelection.replace('faction:', '');
      } else if (targetSelection.startsWith('army:')) {
        targetArmyId = targetSelection.replace('army:', '');
      }

      await updateDoc(doc(db, 'users', user.uid), {
        targetFaction: targetFaction || deleteField(),
        targetArmyId: targetArmyId || deleteField()
      });
      setSuccessMessage('Recovery targets updated!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      {/* Target Section */}
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
          <Target className="mr-3 h-8 w-8 text-blue-500" />
          Recovery Protocols
        </h1>
        <p className="text-zinc-400 mt-1">Focus your attention on a single goal before you get distracted by another shiny box.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center mb-4">
              <Target className="mr-2 h-5 w-5 text-blue-400" />
              Primary Objective
            </h2>
            <p className="text-sm text-zinc-400 mb-4 leading-relaxed">
              Redirect your "Combat Readiness" dashboard metric to a specific force. It's easier to pretend you're finishing an army if you stop looking at the other 1,000 unpainted models.
            </p>
            
            <div className="max-w-md">
              <label htmlFor="targetSelection" className="block text-xs font-medium text-zinc-500 uppercase tracking-widest mb-2">
                Target Force
              </label>
              <select
                id="targetSelection"
                value={targetSelection}
                onChange={(e) => setTargetSelection(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-800 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-all"
              >
                <option value="none">Entire Collection (All Shame Included)</option>
                {availableArmies.length > 0 && (
                  <optgroup label="Saved Armies">
                    {availableArmies.map(army => (
                      <option key={`army:${army.id}`} value={`army:${army.id}`}>
                        {army.title} ({army.faction})
                      </option>
                    ))}
                  </optgroup>
                )}
                {availableFactions.length > 0 && (
                  <optgroup label="Factions">
                    {availableFactions.map(faction => (
                      <option key={`faction:${faction}`} value={`faction:${faction}`}>
                        {faction}
                      </option>
                    ))}
                  </optgroup>
                )}
              </select>
            </div>
          </div>

          <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
            <div className="text-emerald-400 text-sm font-medium h-5">
              {successMessage}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-6 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
              Update Protocols
            </button>
          </div>
        </form>
      </motion.div>

      {/* Chips Section */}
      <div className="pt-12 pb-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Medal className="mr-3 h-8 w-8 text-amber-500" />
            Milestone Chips
          </h1>
          <p className="text-zinc-400 mt-1">A collection of tokens proving you actually picked up a brush at least once.</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-xl p-4 min-w-[220px]">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">Chips Collected</span>
            <span className="text-xl font-black text-amber-500">{unlockedIds.length} / {ACHIEVEMENTS.length}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2 shadow-inner">
            <div 
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-2 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.3)] transition-all duration-1000 ease-out" 
              style={{ width: `${Math.round((unlockedIds.length / ACHIEVEMENTS.length) * 100)}%` }}
            ></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ACHIEVEMENTS.map((achievement, index) => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          const IconComponent = IconMap[achievement.iconName] || Medal;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.03 }}
              className={`relative overflow-hidden rounded-2xl border ${
                isUnlocked 
                  ? 'bg-zinc-900/80 border-amber-500/30 shadow-[0_0_20px_rgba(245,158,11,0.05)]' 
                  : 'bg-zinc-950/40 border-zinc-900/80 opacity-50'
              } p-6 group transition-all duration-300 hover:border-zinc-700`}
            >
              <div className="flex items-start">
                <div className={`flex-shrink-0 mr-4 p-4 rounded-2xl border transition-all duration-500 ${
                  isUnlocked 
                    ? 'bg-amber-500/10 border-amber-500/20 group-hover:bg-amber-500/20' 
                    : 'bg-zinc-900/50 border-zinc-800'
                }`}>
                  {isUnlocked ? (
                    <IconComponent className="h-7 w-7 text-amber-400" />
                  ) : (
                    <Lock className="h-7 w-7 text-zinc-700" />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-bold tracking-tight ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`mt-1.5 text-sm leading-relaxed ${isUnlocked ? 'text-zinc-400' : 'text-zinc-600'}`}>
                    {isUnlocked ? achievement.description : 'Keep your head down and keep painting. The chip will reveal itself eventually.'}
                  </p>
                </div>
              </div>
              
              {isUnlocked && (
                <div className="absolute top-2 right-2">
                  <div className="h-1.5 w-1.5 rounded-full bg-amber-500 shadow-[0_0_5px_rgba(245,158,11,1)]"></div>
                </div>
              )}
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
