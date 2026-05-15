import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';
import { Settings as SettingsIcon, Save, Loader2, Target, Trophy, Package, Waves, Scissors, SprayCan, Brush, CheckCircle, Flame, CalendarDays, Lock, CreditCard, Mountain, Wrench, Wind, Palette, Swords, Sun, Crown, Skull, Star } from 'lucide-react';
import { motion } from 'motion/react';
import { ACHIEVEMENTS } from '../data/achievements';

const IconMap: Record<string, React.ElementType> = {
  Package, Waves, Scissors, SprayCan, Brush, CheckCircle, Flame, CalendarDays, Trophy,
  CreditCard, Mountain, Wrench, Wind, Palette, Swords, Sun, Crown, Skull, Star
};

interface ArmyList {
  id: string;
  title: string;
  faction: string;
}

export function Settings() {
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
      setSuccessMessage('Settings saved successfully!');
      setTimeout(() => setSuccessMessage(''), 3000);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `users/${user.uid}`);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-blue-500" />
          Recovery Protocols
        </h1>
        <p className="text-zinc-400 mt-1">Set your targets so you can feel bad when you inevitably miss them.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center mb-4">
              <Target className="mr-2 h-5 w-5 text-blue-400" />
              Combat Readiness Target
            </h2>
            <p className="text-sm text-zinc-400 mb-4">
              By default, the Combat Readiness metric on your dashboard calculates the percentage of your entire collection that is fully painted. 
              Select a specific faction or saved army below to focus your Combat Readiness metric on getting that force tabletop ready.
            </p>
            
            <div className="max-w-md">
              <label htmlFor="targetSelection" className="block text-sm font-medium text-zinc-300 mb-2">
                Target Force
              </label>
              <select
                id="targetSelection"
                value={targetSelection}
                onChange={(e) => setTargetSelection(e.target.value)}
                className="block w-full bg-zinc-950 border border-zinc-800 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent sm:text-sm transition-shadow"
              >
                <option value="none">Entire Collection (Default)</option>
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

          <div className="pt-6 border-t border-zinc-800 flex items-center justify-between">
            <div className="text-emerald-400 text-sm font-medium h-5">
              {successMessage}
            </div>
            <button
              type="submit"
              disabled={saving}
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-blue-600 hover:bg-blue-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-950 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
              Save Settings
            </button>
          </div>
        </form>
      </motion.div>

      <div className="pt-12 pb-6 border-b border-zinc-800 flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Trophy className="mr-3 h-8 w-8 text-yellow-500" />
            Trophy Room
          </h1>
          <p className="text-zinc-400 mt-1">A monument to your questionable life choices and occasional progress.</p>
        </div>
        <div className="bg-zinc-900/50 border border-zinc-800 rounded-lg p-4 min-w-[200px]">
          <div className="flex justify-between items-end mb-2">
            <span className="text-xs font-medium text-zinc-400 uppercase tracking-wider">Completion</span>
            <span className="text-lg font-bold text-yellow-500">{unlockedIds.length} / {ACHIEVEMENTS.length}</span>
          </div>
          <div className="w-full bg-zinc-800 rounded-full h-2">
            <div className="bg-yellow-500 h-2 rounded-full shadow-[0_0_10px_rgba(234,179,8,0.5)] transition-all duration-500" style={{ width: `${Math.round((unlockedIds.length / ACHIEVEMENTS.length) * 100)}%` }}></div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {ACHIEVEMENTS.map((achievement, index) => {
          const isUnlocked = unlockedIds.includes(achievement.id);
          const IconComponent = IconMap[achievement.iconName] || Trophy;

          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              className={`relative overflow-hidden rounded-2xl border ${isUnlocked ? 'bg-zinc-900/80 border-yellow-500/30 shadow-[0_0_15px_rgba(234,179,8,0.1)]' : 'bg-zinc-950/50 border-zinc-800/50 opacity-60'} p-6 transition-all`}
            >
              {isUnlocked && (
                <div className="absolute -right-6 -top-6 w-24 h-24 bg-yellow-500/10 blur-2xl rounded-full pointer-events-none"></div>
              )}
              
              <div className="flex items-start">
                <div className={`flex-shrink-0 mr-4 p-3 rounded-full border ${isUnlocked ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-zinc-900 border-zinc-800'}`}>
                  {isUnlocked ? (
                    <IconComponent className="h-6 w-6 text-yellow-400" />
                  ) : (
                    <Lock className="h-6 w-6 text-zinc-600" />
                  )}
                </div>
                <div>
                  <h3 className={`text-lg font-bold ${isUnlocked ? 'text-white' : 'text-zinc-500'}`}>
                    {achievement.title}
                  </h3>
                  <p className={`mt-1 text-sm ${isUnlocked ? 'text-zinc-300' : 'text-zinc-600'}`}>
                    {isUnlocked ? achievement.description : 'Condition unknown. Keep building, painting, and pretending you\'ll finish your pile.'}
                  </p>
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
