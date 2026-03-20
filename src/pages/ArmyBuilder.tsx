import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { GoogleGenAI } from '@google/genai';
import { Shield, Loader2, Sparkles, Save, Activity } from 'lucide-react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface Model {
  id: string;
  modelName: string;
  qty: number;
  status: string;
  pointsPerModel?: number;
  faction: string;
  gameSystem?: string;
}

export function ArmyBuilder() {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [targetPoints, setTargetPoints] = useState(1000);
  
  const [gameSystems, setGameSystems] = useState<string[]>([]);
  const [selectedGameSystem, setSelectedGameSystem] = useState('');
  
  const [selectedFaction, setSelectedFaction] = useState('');
  const [factions, setFactions] = useState<string[]>([]);
  
  const [armyList, setArmyList] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const fetchModels = async () => {
      try {
        const q = query(collection(db, 'collection'), where('uid', '==', user.uid));
        const snapshot = await getDocs(q);
        
        const fetchedModels: Model[] = [];
        const uniqueSystems = new Set<string>();
        
        snapshot.forEach((doc) => {
          const data = doc.data() as Model;
          const modelData = { id: doc.id, ...data };
          fetchedModels.push(modelData);
          uniqueSystems.add(modelData.gameSystem || 'Warhammer 40k');
        });
        
        setModels(fetchedModels);
        
        const systemsArray = Array.from(uniqueSystems);
        setGameSystems(systemsArray);
        if (systemsArray.length > 0 && !selectedGameSystem) {
          setSelectedGameSystem(systemsArray[0]);
        }
        
        setLoading(false);
      } catch (err) {
        handleFirestoreError(err, OperationType.LIST, 'collection');
        setLoading(false);
      }
    };

    fetchModels();
  }, [user]);

  useEffect(() => {
    if (!selectedGameSystem) return;
    
    const filteredModels = models.filter(m => (m.gameSystem || 'Warhammer 40k') === selectedGameSystem);
    const uniqueFactions = new Set(filteredModels.map(m => m.faction));
    const factionsArray = Array.from(uniqueFactions);
    
    setFactions(factionsArray);
    if (factionsArray.length > 0) {
      setSelectedFaction(factionsArray[0]);
    } else {
      setSelectedFaction('');
    }
  }, [selectedGameSystem, models]);

  const generateArmyList = async () => {
    if (!user || !selectedFaction) return;
    
    setGenerating(true);
    setError(null);
    setArmyList(null);

    try {
      // Filter for assembled/painted models of the selected faction and game system
      const allowedStatuses = ['Assembled', 'Primed', 'Painted', 'Tabletop Ready'];
      const availableModels = models.filter(m => 
        (m.gameSystem || 'Warhammer 40k') === selectedGameSystem &&
        m.faction === selectedFaction && 
        allowedStatuses.includes(m.status)
      );

      if (availableModels.length === 0) {
        setError(`You don't have any Assembled or Painted models for ${selectedFaction} in ${selectedGameSystem}. Get building!`);
        setGenerating(false);
        return;
      }

      const inventoryList = availableModels.map(m => 
        `- ${m.qty}x ${m.modelName} (approx ${m.pointsPerModel || 'unknown'} pts each) - Status: ${m.status}`
      ).join('\n');

      const prompt = `
You are an expert tabletop wargaming strategist and army builder.
I want to build a ${targetPoints}-point army list for the game system: ${selectedGameSystem}, using the faction: ${selectedFaction}.

Here is my current inventory of assembled and painted models:
${inventoryList}

Using ONLY the models from my inventory above, construct the most competitive and legal army list possible for a ${targetPoints}-point game.
CRITICAL INSTRUCTION: You MUST prioritize using models with the status "Painted" or "Tabletop Ready" over "Primed" or "Assembled". Only use "Primed" or "Assembled" models if absolutely necessary to reach the point limit or fulfill mandatory army requirements.

If I don't have enough models to reach exactly ${targetPoints} points, get as close as possible without going over.
If I don't have enough models to make a legal detachment/army, explain what I am missing and build the best list you can anyway.

Please format the output as a clean Markdown document with:
1. A catchy name for the army
2. Total points
3. The list of units included (with quantities, estimated points, and their current paint status)
4. A brief tactical summary of how to play this list based on the units selected.
      `;

      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
      const response = await ai.models.generateContent({
        model: 'gemini-3.1-pro-preview',
        contents: prompt,
      });

      setArmyList(response.text || 'Failed to generate list.');
    } catch (err) {
      console.error("Error generating list:", err);
      setError("An error occurred while communicating with the AI Strategist.");
    } finally {
      setGenerating(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]"></div></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Shield className="mr-3 h-8 w-8 text-fuchsia-500" />
            AI Army Strategist
          </h1>
          <p className="text-zinc-400 mt-1">Generate optimal deployment lists from your available assets.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-1 space-y-6"
        >
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
            <h2 className="text-lg font-medium text-white mb-6 flex items-center">
              <Activity className="mr-2 h-5 w-5 text-fuchsia-500" />
              Mission Parameters
            </h2>
            
            <div className="space-y-5">
              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Target Points</label>
                <input
                  type="number"
                  value={targetPoints}
                  onChange={(e) => setTargetPoints(parseInt(e.target.value) || 0)}
                  step="50"
                  className="block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Game System</label>
                {gameSystems.length > 0 ? (
                  <select
                    value={selectedGameSystem}
                    onChange={(e) => setSelectedGameSystem(e.target.value)}
                    className="block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors appearance-none"
                  >
                    {gameSystems.map(sys => (
                      <option key={sys} value={sys}>{sys}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-zinc-500 italic py-2 bg-zinc-950/50 rounded-lg px-3 border border-zinc-800/50">No game systems found.</div>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-2">Faction</label>
                {factions.length > 0 ? (
                  <select
                    value={selectedFaction}
                    onChange={(e) => setSelectedFaction(e.target.value)}
                    className="block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors appearance-none"
                  >
                    {factions.map(f => (
                      <option key={f} value={f}>{f}</option>
                    ))}
                  </select>
                ) : (
                  <div className="text-sm text-zinc-500 italic py-2 bg-zinc-950/50 rounded-lg px-3 border border-zinc-800/50">No factions found for this system.</div>
                )}
              </div>

              <button
                onClick={generateArmyList}
                disabled={generating || factions.length === 0}
                className="w-full flex justify-center py-3 px-4 border border-fuchsia-500/30 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-fuchsia-600/10 hover:bg-fuchsia-600/20 hover:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-950 transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed items-center mt-8"
              >
                {generating ? (
                  <><Loader2 className="animate-spin mr-2 h-5 w-5 text-fuchsia-400" /> <span className="text-fuchsia-100">Strategizing...</span></>
                ) : (
                  <><Sparkles className="mr-2 h-5 w-5 text-fuchsia-400" /> <span className="text-fuchsia-100">Generate List</span></>
                )}
              </button>
            </div>
          </div>

          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm">
            <h3 className="text-xs font-medium text-zinc-400 uppercase tracking-wider mb-4">Available Forces (Assembled+)</h3>
            <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
              {models.filter(m => (m.gameSystem || 'Warhammer 40k') === selectedGameSystem && m.faction === selectedFaction && ['Assembled', 'Primed', 'Painted', 'Tabletop Ready'].includes(m.status)).length > 0 ? (
                models
                  .filter(m => (m.gameSystem || 'Warhammer 40k') === selectedGameSystem && m.faction === selectedFaction && ['Assembled', 'Primed', 'Painted', 'Tabletop Ready'].includes(m.status))
                  .map(m => (
                    <div key={m.id} className="flex justify-between text-sm items-center border-b border-zinc-800/50 pb-2 last:border-0 last:pb-0">
                      <span className="text-zinc-300 font-medium">{m.qty}x {m.modelName} <span className="text-xs text-zinc-500 font-normal ml-1">({m.status})</span></span>
                      <span className="text-fuchsia-400/80 font-mono text-xs">{m.pointsPerModel ? m.pointsPerModel * m.qty : '?'} pts</span>
                    </div>
                  ))
              ) : (
                <div className="text-sm text-zinc-500 italic bg-zinc-950/50 rounded-lg p-4 border border-zinc-800/50 text-center">No battle-ready units for this faction.</div>
              )}
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-2"
        >
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm shadow-sm min-h-[600px] flex flex-col relative overflow-hidden">
            {/* Decorative background elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-fuchsia-900/10 rounded-full blur-3xl -mr-32 -mt-32 pointer-events-none"></div>
            
            <div className="flex justify-between items-center mb-6 border-b border-zinc-800/80 pb-4 relative z-10">
              <h2 className="text-lg font-medium text-white flex items-center">
                <Shield className="mr-2 h-5 w-5 text-fuchsia-500" />
                Strategic Output
              </h2>
              {armyList && (
                <button className="text-zinc-400 hover:text-fuchsia-400 transition-colors flex items-center text-sm font-medium px-3 py-1.5 rounded-md hover:bg-fuchsia-900/20">
                  <Save className="h-4 w-4 mr-1.5" /> Save List
                </button>
              )}
            </div>
            
            <div className="flex-1 overflow-y-auto prose prose-invert prose-fuchsia max-w-none relative z-10 custom-scrollbar pr-2">
              {error ? (
                <div className="text-red-400 p-4 bg-red-950/30 rounded-lg border border-red-900/50 flex items-start">
                  <Activity className="h-5 w-5 mr-3 mt-0.5 flex-shrink-0" />
                  <p className="m-0">{error}</p>
                </div>
              ) : armyList ? (
                <div className="markdown-body text-zinc-300 bg-zinc-950/30 p-6 rounded-xl border border-zinc-800/50">
                  <ReactMarkdown>{armyList}</ReactMarkdown>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-zinc-500 space-y-6 opacity-60">
                  <div className="relative">
                    <Shield className="h-24 w-24 text-zinc-700" />
                    <Activity className="h-8 w-8 text-fuchsia-500/50 absolute bottom-0 right-0" />
                  </div>
                  <p className="text-sm uppercase tracking-widest font-medium">Awaiting parameters to generate battle plan...</p>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
