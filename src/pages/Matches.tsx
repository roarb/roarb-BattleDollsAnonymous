import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, addDoc, serverTimestamp, deleteDoc, doc, orderBy, updateDoc } from 'firebase/firestore';
import { Swords, Plus, Trash2, Edit2, X, MessageSquareHeart } from 'lucide-react';
import { motion } from 'motion/react';
import { GoogleGenAI } from '@google/genai';

interface GameRecord {
  id: string;
  uid: string;
  armyListId?: string;
  outcome: 'Win' | 'Loss' | 'Draw';
  pointsFor?: number;
  pointsAgainst?: number;
  opponentName?: string;
  opponentFaction?: string;
  mission?: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

interface ArmyList {
  id: string;
  title: string;
  faction: string;
}

import battleLogsEmpty from '../assets/state/empty/battle_logs.png';
import battleLogsHeader from '../assets/graphics/header/battle_logs.png';

export function Matches() {
  const { user } = useAuth();
  const [games, setGames] = useState<GameRecord[]>([]);
  const [armies, setArmies] = useState<ArmyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingGameId, setEditingGameId] = useState<string | null>(null);

  // Form State
  const [armyListId, setArmyListId] = useState('');
  const [outcome, setOutcome] = useState<'Win' | 'Loss' | 'Draw'>('Win');
  const [pointsFor, setPointsFor] = useState<number | ''>('');
  const [pointsAgainst, setPointsAgainst] = useState<number | ''>('');
  const [opponentName, setOpponentName] = useState('');
  const [opponentFaction, setOpponentFaction] = useState('');
  const [mission, setMission] = useState('');
  const [notes, setNotes] = useState('');
  const [saving, setSaving] = useState(false);

  // Coach State
  const [coachLoading, setCoachLoading] = useState(false);
  const [coachMessage, setCoachMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      try {
        const qArmies = query(collection(db, 'armyLists'), where('uid', '==', user.uid));
        const armiesSnap = await getDocs(qArmies);
        const a: ArmyList[] = [];
        armiesSnap.forEach(doc => {
          a.push({ id: doc.id, ...doc.data() } as ArmyList);
        });
        setArmies(a);

        const qGames = query(collection(db, 'gameLogs'), where('uid', '==', user.uid), orderBy('createdAt', 'desc'));
        const gamesSnap = await getDocs(qGames);
        const g: GameRecord[] = [];
        gamesSnap.forEach(doc => {
          g.push({ id: doc.id, ...doc.data() } as GameRecord);
        });
        setGames(g);
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, 'gameLogs/armyLists');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [user]);

  const handleOpenModal = (game?: GameRecord) => {
    if (game) {
      setEditingGameId(game.id);
      setArmyListId(game.armyListId || '');
      setOutcome(game.outcome);
      setPointsFor(game.pointsFor ?? '');
      setPointsAgainst(game.pointsAgainst ?? '');
      setOpponentName(game.opponentName || '');
      setOpponentFaction(game.opponentFaction || '');
      setMission(game.mission || '');
      setNotes(game.notes || '');
    } else {
      setEditingGameId(null);
      setArmyListId('');
      setOutcome('Win');
      setPointsFor('');
      setPointsAgainst('');
      setOpponentName('');
      setOpponentFaction('');
      setMission('');
      setNotes('');
    }
    setIsModalOpen(true);
  };

  const handleSaveGame = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    try {
      const data: any = {
        uid: user.uid,
        outcome,
        updatedAt: serverTimestamp(),
      };
      if (armyListId) data.armyListId = armyListId;
      if (pointsFor !== '') data.pointsFor = Number(pointsFor);
      if (pointsAgainst !== '') data.pointsAgainst = Number(pointsAgainst);
      if (opponentName) data.opponentName = opponentName;
      if (opponentFaction) data.opponentFaction = opponentFaction;
      if (mission) data.mission = mission;
      if (notes) data.notes = notes;

      if (editingGameId) {
        await updateDoc(doc(db, 'gameLogs', editingGameId), data);
        setGames(prev => prev.map(g => g.id === editingGameId ? { ...g, ...data } : g));
      } else {
        data.createdAt = serverTimestamp();
        const docRef = await addDoc(collection(db, 'gameLogs'), data);
        setGames([{ id: docRef.id, ...data }, ...games]);
      }
      setIsModalOpen(false);
    } catch (err) {
      handleFirestoreError(err, OperationType.WRITE, 'gameLogs');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!user) return;
    if (window.confirm('Are you sure you want to delete this game record?')) {
      try {
        await deleteDoc(doc(db, 'gameLogs', id));
        setGames(prev => prev.filter(g => g.id !== id));
      } catch (err) {
        handleFirestoreError(err, OperationType.DELETE, `gameLogs/${id}`);
      }
    }
  };

  const generateCoachFeedback = async () => {
    if (games.length === 0) return;
    setCoachLoading(true);
    setCoachMessage(null);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY || '' });
      const gamesSummary = games.map(g =>
        `Outcome: ${g.outcome}, Points: ${g.pointsFor || 0} to ${g.pointsAgainst || 0}, Opponent Faction: ${g.opponentFaction || 'Unknown'}, Notes: ${g.notes || 'None'}`
      ).join(' | ');

      const prompt = `You are a universal miniature wargaming coach AI, supporting all systems like Warhammer 40k, Age of Sigmar, BattleTech, Star Wars: Legion and more.
Here is the user's recent match history:
${gamesSummary}
Provide a brief, encouraging 2-3 paragraph summary and some tactical advice based on their wins and losses.`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt,
      });

      if (response.text) {
        setCoachMessage(response.text);
      }
    } catch (err) {
      console.error(err);
      setCoachMessage("Ah, the Astropaths are currently experiencing interference in the Warp. Try again later.");
    } finally {
      setCoachLoading(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <img src={battleLogsHeader} alt="" className="mr-3 h-[80px] w-[80px] object-contain" />
            Tales of Gray Plastic
          </h1>
          <p className="text-zinc-400 mt-1">Log the games where your unpainted models inevitably rolled worse than your opponent's painted ones.</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={generateCoachFeedback}
            className="inline-flex items-center px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-lg border border-transparent focus:outline-none transition-colors shadow-sm disabled:opacity-50"
            disabled={coachLoading || games.length === 0}
          >
            <MessageSquareHeart className="mr-2 h-4 w-4" />
            {coachLoading ? 'Asking AI why you lost...' : 'AI Coach'}
          </button>
          <button
            onClick={() => handleOpenModal()}
            className="inline-flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white text-sm font-medium rounded-lg shadow-sm border border-transparent focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 focus:ring-offset-zinc-950 transition-all"
          >
            <Plus className="-ml-1 mr-2 h-4 w-4" />
            Log Matches
          </button>
        </div>
      </div>

      {coachMessage && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="bg-indigo-900/40 border border-indigo-500/50 rounded-xl p-6 backdrop-blur-md">
          <h3 className="text-lg font-bold text-white mb-2 flex items-center">
            <MessageSquareHeart className="w-5 h-5 mr-2 text-indigo-400" />
            Coach's Debrief
          </h3>
          <div className="text-indigo-100/90 whitespace-pre-wrap leading-relaxed text-sm">
            {coachMessage}
          </div>
          <button onClick={() => setCoachMessage(null)} className="mt-4 text-xs font-medium text-indigo-300 hover:text-white uppercase tracking-wider">Dismiss</button>
        </motion.div>
      )}

      {games.length === 0 ? (
        <div className="text-center py-12 md:py-20 bg-zinc-900/50 backdrop-blur-sm border border-zinc-800/80 rounded-2xl relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-blue-500/5 to-transparent pointer-events-none" />
          <motion.img
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            src={battleLogsEmpty}
            alt="No battles"
            className="mx-auto w-full max-w-md mb-8 rounded-xl shadow-2xl border border-zinc-800/50 relative z-10"
          />
          <div className="relative z-10">
            <h3 className="text-xl font-bold text-white mb-2">No battles logged yet</h3>
            <p className="text-zinc-500 max-w-sm mx-auto mb-8">Start recording your victories (and glorious defeats) to gain tactical insight into your army's performance.</p>
            <button
              onClick={() => handleOpenModal()}
              className="inline-flex items-center px-6 py-3 bg-blue-600 hover:bg-blue-500 text-white text-sm font-bold rounded-xl shadow-lg transition-all hover:scale-105 active:scale-95"
            >
              <Plus className="mr-2 h-5 w-5" /> Log your first Match
            </button>
          </div>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {games.map(game => (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              key={game.id}
              className="bg-zinc-900/80 border border-zinc-800/80 rounded-xl p-5 relative group flex flex-col"
            >
              <div className="flex justify-between items-start mb-3">
                <div className={`px-2.5 py-1 uppercase tracking-widest text-[10px] font-bold rounded ${game.outcome === 'Win' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : game.outcome === 'Loss' ? 'bg-red-500/20 text-red-400 border border-red-500/30' : 'bg-zinc-700/50 text-zinc-300 border border-zinc-600'}`}>
                  {game.outcome}
                </div>
                <div className="flex opacity-0 group-hover:opacity-100 transition-opacity">
                  <button onClick={() => handleOpenModal(game)} className="p-1.5 text-zinc-400 hover:text-blue-400"><Edit2 className="w-4 h-4" /></button>
                  <button onClick={() => handleDelete(game.id)} className="p-1.5 text-zinc-400 hover:text-red-400"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
              <div className="mb-2">
                <h4 className="font-bold text-white text-lg">
                  {game.pointsFor !== undefined && game.pointsAgainst !== undefined ? `${game.pointsFor} - ${game.pointsAgainst}` : 'Unscored Game'}
                </h4>
                {game.opponentName && <p className="text-zinc-400 text-sm">vs {game.opponentName} {game.opponentFaction ? `(${game.opponentFaction})` : ''}</p>}
              </div>
              {game.mission && <div className="text-xs text-blue-400 mb-2 font-medium bg-blue-400/10 inline-block px-2 py-0.5 rounded">Mission: {game.mission}</div>}
              {game.notes && <p className="text-zinc-500 text-sm line-clamp-3 mt-auto pt-2 border-t border-zinc-800/50">{game.notes}</p>}
            </motion.div>
          ))}
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-zinc-800 rounded-xl max-w-lg w-full p-6 my-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold text-white">{editingGameId ? 'Edit Match' : 'Log Match'}</h2>
              <button onClick={() => setIsModalOpen(false)} className="text-zinc-400 hover:text-white"><X className="w-5 h-5" /></button>
            </div>

            <form onSubmit={handleSaveGame} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Your Army List (Optional)</label>
                <select
                  value={armyListId}
                  onChange={e => setArmyListId(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">-- None Selected --</option>
                  {armies.map(a => <option key={a.id} value={a.id}>{a.title} ({a.faction})</option>)}
                </select>
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Outcome</label>
                  <select
                    value={outcome}
                    onChange={e => setOutcome(e.target.value as any)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="Win">Win</option>
                    <option value="Loss">Loss</option>
                    <option value="Draw">Draw</option>
                  </select>
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Your Points</label>
                  <input
                    type="number" min="0" value={pointsFor} onChange={e => setPointsFor(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div className="col-span-3 sm:col-span-1">
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Opponent Pts</label>
                  <input
                    type="number" min="0" value={pointsAgainst} onChange={e => setPointsAgainst(e.target.value ? Number(e.target.value) : '')}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Opponent Name</label>
                  <input
                    type="text" value={opponentName} onChange={e => setOpponentName(e.target.value)} placeholder="e.g. John D."
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-zinc-400 mb-1">Opp. Faction</label>
                  <input
                    type="text" value={opponentFaction} onChange={e => setOpponentFaction(e.target.value)} placeholder="e.g. Tyranids"
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Mission / Scenario</label>
                <input
                  type="text" value={mission} onChange={e => setMission(e.target.value)} placeholder="e.g. Scorched Earth"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-zinc-400 mb-1">Notes / Summary</label>
                <textarea
                  value={notes} onChange={e => setNotes(e.target.value)} rows={3} placeholder="Highlights, what worked, what failed..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-4 py-2 border border-zinc-700 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700">Cancel</button>
                <button type="submit" disabled={saving} className="px-4 py-2 bg-blue-600 rounded-lg text-white hover:bg-blue-500 disabled:opacity-50">
                  {saving ? 'Saving...' : 'Save Record'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
