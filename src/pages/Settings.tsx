import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, collection, query, where, getDocs, deleteField } from 'firebase/firestore';
import { Settings as SettingsIcon, Save, Loader2, Target } from 'lucide-react';
import { motion } from 'motion/react';

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
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]"></div></div>;
  }

  return (
    <div className="max-w-3xl mx-auto space-y-8 pb-12">
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
          <SettingsIcon className="mr-3 h-8 w-8 text-fuchsia-500" />
          Personal Settings
        </h1>
        <p className="text-zinc-400 mt-1">Configure your dashboard metrics and personal preferences.</p>
      </div>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 md:p-8 backdrop-blur-sm"
      >
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold text-white flex items-center mb-4">
              <Target className="mr-2 h-5 w-5 text-fuchsia-400" />
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
                className="block w-full bg-zinc-950 border border-zinc-800 rounded-lg shadow-sm py-2.5 px-3 text-white focus:outline-none focus:ring-2 focus:ring-fuchsia-500 focus:border-transparent sm:text-sm transition-shadow"
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
              className="inline-flex items-center px-5 py-2.5 border border-transparent rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-500 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-950 transition-all disabled:opacity-50"
            >
              {saving ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
              Save Settings
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}
