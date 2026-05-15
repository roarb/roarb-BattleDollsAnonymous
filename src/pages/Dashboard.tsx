import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { Package, CheckCircle, Activity, Flame, TrendingUp, Settings, Swords, ShieldOff, DollarSign, Clock, ExternalLink, Info, Trophy } from 'lucide-react';
import { HobbyPhaseGuide } from '../components/HobbyPhaseGuide';
import { WARHAMMER_40K_DATA } from '../data/warhammer40k';
import { AGE_OF_SIGMAR_DATA } from '../data/ageOfSigmar';
import { OLD_WORLD_DATA } from '../data/oldWorld';
import { HORUS_HERESY_DATA } from '../data/horusHeresy';
import { MARVEL_CP_DATA } from '../data/marvelCP';

interface Model {
  id: string;
  modelName: string;
  nickname?: string;
  qty: number;
  status: string;
  pointsPerModel?: number;
  unitCost?: number;
  faction: string;
  gameSystem?: string;
  createdAt: any;
  updatedAt: any;
}

const STATUS_COLORS = {
  'Unbuilt': '#f87171', // red-400
  'Assembled': '#d4d4d8', // zinc-300
  'Primed': '#fbbf24', // amber-400
  'Basic Paint': '#3b82f6', // blue-500
  'Completed': '#60a5fa', // blue-400
};


// Helper to generate velocity data (last 6 months)
const generateVelocityData = (models: Model[]) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const data = [];
  const today = new Date();

  for (let i = 5; i >= 0; i--) {
    const d = new Date(today.getFullYear(), today.getMonth() - i, 1);
    data.push({
      name: months[d.getMonth()],
      month: d.getMonth(),
      year: d.getFullYear(),
      completed: 0,
      assembled: 0
    });
  }

  models.forEach(m => {
    if (m.updatedAt && m.updatedAt.toDate) {
      const date = m.updatedAt.toDate();
      const monthData = data.find(d => d.month === date.getMonth() && d.year === date.getFullYear());
      if (monthData) {
        if (['Basic Paint', 'Completed'].includes(m.status)) {
          monthData.completed += m.qty;
        } else {
          monthData.assembled += m.qty;
        }
      }
    }
  });

  return data;
};

import accountabilityMirrorHeader from '../assets/graphics/header/accountability_mirror.png';

export function Dashboard() {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetFaction, setTargetFaction] = useState<string | null>(null);
  const [targetArmy, setTargetArmy] = useState<{ title: string, faction: string } | null>(null);
  const [games, setGames] = useState<any[]>([]);
  const [relapses, setRelapses] = useState<any[]>([]);
  const [isRelapseModalOpen, setIsRelapseModalOpen] = useState(false);
  const [relapseFormData, setRelapseFormData] = useState({
    modelName: '', nickname: '', qty: 1, pointsPerModel: 0,
    unitCost: '' as number | string, faction: '', gameSystem: 'Warhammer 40k', reason: ''
  });
  const [savingRelapse, setSavingRelapse] = useState(false);
  const [recoveryPlan, setRecoveryPlan] = useState<string | null>(null);
  const [currentStreak, setCurrentStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);
  const [isHobbyGuideOpen, setIsHobbyGuideOpen] = useState(false);

  const getGameSystemData = (system: string) => {
    switch (system) {
      case 'Warhammer 40k': return WARHAMMER_40K_DATA;
      case 'Age of Sigmar': return AGE_OF_SIGMAR_DATA;
      case 'Warhammer Old World': return OLD_WORLD_DATA;
      case 'Horus Heresy': return HORUS_HERESY_DATA;
      case 'Marvel Crisis Protocol': return MARVEL_CP_DATA;
      default: return [];
    }
  };

  const selectedFactionData = getGameSystemData(relapseFormData.gameSystem || '').find(f => f.name === relapseFormData.faction);

  const selectedModelData = selectedFactionData
    ? selectedFactionData.models.find(m => m.name === relapseFormData.modelName)
    : undefined;

  useEffect(() => {
    if (!user) return;

    // Fetch user settings and streak
    const userUnsub = onSnapshot(doc(db, 'users', user.uid), async (userDoc) => {
      if (userDoc.exists()) {
        const data = userDoc.data();
        if (data.targetArmyId) {
          try {
            const armyDoc = await getDoc(doc(db, 'armyLists', data.targetArmyId));
            if (armyDoc.exists()) {
              setTargetArmy({ title: armyDoc.data().title, faction: armyDoc.data().faction });
            }
          } catch (e) { }
        } else if (data.targetFaction) {
          setTargetFaction(data.targetFaction);
        }

        const todayDate = new Date();
        const today = `${todayDate.getFullYear()}-${String(todayDate.getMonth() + 1).padStart(2, '0')}-${String(todayDate.getDate()).padStart(2, '0')}`;
        const lastDate = data.lastStreakDate || '';

        const yesterdayDate = new Date();
        yesterdayDate.setDate(yesterdayDate.getDate() - 1);
        const yesterdayStr = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

        if (lastDate !== today && lastDate !== yesterdayStr && data.currentStreak > 0) {
          setCurrentStreak(0);
        } else {
          setCurrentStreak(data.currentStreak || 0);
        }
        setBestStreak(data.bestStreak || 0);
      }
    });

    const q = query(collection(db, 'collection'), where('uid', '==', user.uid));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedModels: Model[] = [];
      snapshot.forEach((doc) => {
        fetchedModels.push({ id: doc.id, ...doc.data() } as Model);
      });
      setModels(fetchedModels);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'collection');
    });

    const qGames = query(collection(db, 'gameLogs'), where('uid', '==', user.uid));
    const unsubscribeGames = onSnapshot(qGames, (snapshot) => {
      const fetchedGames: any[] = [];
      snapshot.forEach((doc) => {
        fetchedGames.push({ id: doc.id, ...doc.data() });
      });
      setGames(fetchedGames);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'gameLogs');
    });

    const qRelapses = query(collection(db, 'relapses'), where('uid', '==', user.uid));
    const unsubscribeRelapses = onSnapshot(qRelapses, (snapshot) => {
      const fetchedRelapses: any[] = [];
      snapshot.forEach((doc) => {
        fetchedRelapses.push({ id: doc.id, ...doc.data() });
      });
      setRelapses(fetchedRelapses);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'relapses');
      setLoading(false);
    });

    return () => { unsubscribe(); unsubscribeGames(); unsubscribeRelapses(); userUnsub(); };
  }, [user]);

  const handleSaveRelapse = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSavingRelapse(true);
    try {
      const cost = typeof relapseFormData.unitCost === 'number' ? relapseFormData.unitCost : 0;

      // 1. Add to collection as Unbuilt
      await addDoc(collection(db, 'collection'), {
        uid: user.uid,
        modelName: relapseFormData.modelName,
        nickname: relapseFormData.nickname,
        qty: relapseFormData.qty,
        status: 'Unbuilt',
        pointsPerModel: relapseFormData.pointsPerModel,
        unitCost: cost,
        faction: relapseFormData.faction,
        gameSystem: relapseFormData.gameSystem,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 2. Log the relapse
      await addDoc(collection(db, 'relapses'), {
        uid: user.uid,
        msrp: cost,
        boxName: relapseFormData.modelName,
        reason: relapseFormData.reason,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });

      // 3. Recovery plan: 1 model per $20, rounded up
      const modelsToFinish = Math.ceil(cost / 20);
      setRecoveryPlan(`Recovery Plan: Finish ${modelsToFinish} existing model${modelsToFinish !== 1 ? 's' : ''} before opening this box.`);
      setTimeout(() => setRecoveryPlan(null), 8000);

      setIsRelapseModalOpen(false);
      setRelapseFormData({
        modelName: '', nickname: '', qty: 1, pointsPerModel: 0,
        unitCost: '', faction: '', gameSystem: 'Warhammer 40k', reason: ''
      });
    } catch (error) {
      handleFirestoreError(error, OperationType.WRITE, 'relapses');
    } finally {
      setSavingRelapse(false);
    }
  };

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  const totalModels = models.reduce((acc, m) => acc + m.qty, 0);

  // Calculate Combat Readiness based on target faction if set
  const activeFaction = targetArmy ? targetArmy.faction : targetFaction;
  const readinessModels = activeFaction ? models.filter(m => m.faction === activeFaction) : models;
  const targetTotal = readinessModels.reduce((acc, m) => acc + m.qty, 0);
  const paintedCount = readinessModels.filter(m => ['Basic Paint', 'Completed'].includes(m.status)).reduce((acc, m) => acc + m.qty, 0);
  const completionRate = targetTotal > 0 ? Math.round((paintedCount / targetTotal) * 100) : 0;

  // Calculate Games Stats
  const totalGames = games.length;
  const wins = games.filter(g => g.outcome === 'Win').length;
  const winRate = totalGames > 0 ? Math.round((wins / totalGames) * 100) : 0;


  // Recovery Savings
  const paintedModelsTotalCost = models
    .filter(m => ['Basic Paint', 'Completed'].includes(m.status))
    .reduce((acc, m) => acc + ((m as any).unitCost || 0), 0);

  const totalRelapseSpent = relapses.reduce((acc, r) => acc + (Number(r.msrp) || 0), 0);
  const recoverySavingsRaw = paintedModelsTotalCost - totalRelapseSpent;
  const recoverySavings = recoverySavingsRaw > 0 ? recoverySavingsRaw : 0;

  // Days Sober (since last relapse)
  const sortedRelapses = [...relapses].sort((a, b) => {
    const aTime = a.createdAt?.toDate?.() || new Date(0);
    const bTime = b.createdAt?.toDate?.() || new Date(0);
    return bTime.getTime() - aTime.getTime();
  });
  const lastRelapseDate = sortedRelapses.length > 0 && sortedRelapses[0].createdAt?.toDate
    ? sortedRelapses[0].createdAt.toDate()
    : null;
  const daysSober = lastRelapseDate
    ? Math.floor((Date.now() - lastRelapseDate.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  // Pile of Shame (total MSRP of non-completed units)
  const pileOfShameCost = models
    .filter(m => !['Basic Paint', 'Completed'].includes(m.status))
    .reduce((acc, m) => acc + (m.unitCost || 0), 0);

  // Ledger of Excess (unbuilt kits sorted oldest first)
  const unbuiltModels = models
    .filter(m => m.status === 'Unbuilt')
    .sort((a, b) => {
      const aTime = a.createdAt?.toDate?.() || new Date();
      const bTime = b.createdAt?.toDate?.() || new Date();
      return aTime.getTime() - bTime.getTime();
    });

  const getTimeInShame = (createdAt: any) => {
    if (!createdAt?.toDate) return 'Unknown';
    const diff = Date.now() - createdAt.toDate().getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days < 1) return 'Today';
    if (days === 1) return '1 day';
    if (days < 30) return `${days} days`;
    if (days < 60) return '1 month';
    const months = Math.floor(days / 30);
    if (months < 12) return `${months} months`;
    const years = Math.floor(months / 12);
    return years === 1 ? '1 year' : `${years} years`;
  };

  const velocityData = generateVelocityData(models);

  const pieData = [
    { name: 'Unbuilt', value: models.filter(m => m.status === 'Unbuilt').reduce((a, b) => a + b.qty, 0), color: STATUS_COLORS['Unbuilt'] },
    { name: 'Assembled', value: models.filter(m => m.status === 'Assembled').reduce((a, b) => a + b.qty, 0), color: STATUS_COLORS['Assembled'] },
    { name: 'Primed', value: models.filter(m => m.status === 'Primed').reduce((a, b) => a + b.qty, 0), color: STATUS_COLORS['Primed'] },
    { name: 'Basic Paint', value: models.filter(m => m.status === 'Basic Paint').reduce((a, b) => a + b.qty, 0), color: STATUS_COLORS['Basic Paint'] },
    { name: 'Completed', value: models.filter(m => m.status === 'Completed').reduce((a, b) => a + b.qty, 0), color: STATUS_COLORS['Completed'] },
  ].filter(d => d.value > 0);



  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <img src={accountabilityMirrorHeader} alt="" className="mr-3 h-[80px] w-[80px] object-contain" />
            The Accountability Mirror
          </h1>
          <p className="text-zinc-400 mt-1">Look upon your Pile of Shame, ye mighty, and despair. (Or just track your addiction).</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={() => setIsRelapseModalOpen(true)}
            title="Log a new purchase — this will add the unit to your Stash as Unbuilt"
            className="inline-flex items-center px-5 py-2.5 bg-red-600/10 hover:bg-red-600/20 text-red-500 border border-red-500/30 hover:border-red-500/50 rounded-lg text-sm font-medium transition-all duration-300"
          >
            <Flame className="-ml-1 mr-2 h-5 w-5" />
            Log a Relapse
          </button>
        </div>
      </div>

      {/* Recovery Plan Banner */}
      {recoveryPlan && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0 }}
          className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4 flex items-center space-x-3"
        >
          <ShieldOff className="h-6 w-6 text-amber-400 flex-shrink-0" />
          <p className="text-amber-300 text-sm font-medium">{recoveryPlan}</p>
        </motion.div>
      )}

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <MetricCard
          title="Days Sober"
          value={daysSober !== null ? daysSober : '∞'}
          subtitle={daysSober !== null ? (daysSober === 0 ? "You relapsed today. Shameful." : "Since your last plastic purchase") : "No relapses on record. Suspicious."}
          icon={Clock}
          color={daysSober !== null && daysSober < 7 ? "text-red-500" : "text-emerald-500"}
          trend={lastRelapseDate ? `Last: ${lastRelapseDate.toLocaleDateString()}` : "Clean record"}
        />
        <MetricCard
          title="Pile of Shame"
          value={`$${pileOfShameCost.toLocaleString()}`}
          subtitle="Total MSRP of unfinished units"
          icon={DollarSign}
          color="text-red-400"
          trend={`${models.filter(m => !['Basic Paint', 'Completed'].includes(m.status)).length} units unfinished`}
        />
        <MetricCard
          title="Actually Finished"
          value={`${completionRate}%`}
          subtitle={`${paintedCount} fully painted`}
          icon={CheckCircle}
          color="text-blue-500"
          trend={targetArmy ? `Target: ${targetArmy.title}` : targetFaction ? `Target: ${targetFaction}` : "Target: Entire Collection"}
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'goals' }))}
          actionIcon={Trophy}
        />
        <MetricCard
          title="Recovery Savings"
          value={`$${recoverySavings.toLocaleString()}`}
          subtitle="Total MSRP of completed units"
          icon={TrendingUp}
          color="text-emerald-500"
          trend={`Minus $${totalRelapseSpent.toLocaleString()} spent on relapses`}
        />
        <MetricCard
          title="Hobby Streak"
          value={`${currentStreak} Days`}
          subtitle="Consecutive days of forward progress"
          icon={Flame}
          color="text-orange-500"
          trend={`Personal best: ${bestStreak}`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Hobby Velocity Chart */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-2 bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white flex items-center">
              <TrendingUp className="mr-2 h-5 w-5 text-blue-500" />
              Shame Accumulation vs. Completion
            </h2>
            <span className="text-xs font-medium px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">Last 6 Months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="colorAssembled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f87171" stopOpacity={0.2} />
                    <stop offset="95%" stopColor="#f87171" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="assembled" name="WIP/Assembled" stroke="#f87171" fillOpacity={1} fill="url(#colorAssembled)" />
                <Area type="monotone" dataKey="completed" name="Painted" stroke="#3b82f6" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Readiness Distribution */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm flex flex-col"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white">Asset Distribution</h2>
            <button
              onClick={() => setIsHobbyGuideOpen(true)}
              className="p-1.5 text-zinc-500 hover:text-blue-400 hover:bg-blue-500/10 rounded-lg transition-all"
              title="Hobby Phase Guide"
            >
              <Info className="w-5 h-5" />
            </button>
          </div>
          <div className="flex-1 min-h-[200px] relative">
            {totalModels > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={pieData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={80}
                    paddingAngle={2}
                    dataKey="value"
                    stroke="none"
                  >
                    {pieData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                    itemStyle={{ color: '#fff' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-zinc-500 text-sm">
                No telemetry available.
              </div>
            )}
            {totalModels > 0 && (
              <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                <span className="text-3xl font-bold text-white">{totalModels}</span>
                <span className="text-xs text-zinc-500 uppercase tracking-wider">Total</span>
              </div>
            )}
          </div>
          {totalModels > 0 && (
            <div className="mt-6 grid grid-cols-2 gap-3">
              {pieData.map((entry, index) => (
                <div key={index} className="flex items-center text-xs text-zinc-400">
                  <div className="w-3 h-3 rounded-full mr-2 flex-shrink-0" style={{ backgroundColor: entry.color }} />
                  <span className="truncate">{entry.name}</span>
                  <span className="ml-auto font-medium text-white">{entry.value}</span>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Ledger of Excess */}
      {unbuiltModels.length > 0 && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm"
        >
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-lg font-medium text-white flex items-center">
              <Package className="mr-2 h-5 w-5 text-red-400" />
              The Ledger of Excess
            </h2>
            <span className="text-xs font-medium px-2.5 py-1 bg-red-500/10 text-red-400 rounded-full border border-red-500/20">
              {unbuiltModels.length} unbuilt — ${unbuiltModels.reduce((a, m) => a + (m.unitCost || 0), 0).toLocaleString()} USD
            </span>
          </div>
          <div className="space-y-2 max-h-64 overflow-y-auto custom-scrollbar">
            {unbuiltModels.map(m => (
              <div key={m.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-zinc-950/50 border border-zinc-800/40 hover:border-zinc-700/60 transition-colors">
                <div className="flex items-center space-x-3 min-w-0">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-white truncate">{m.modelName}</p>
                    <p className="text-xs text-zinc-500">{m.faction} · {m.gameSystem || 'Warhammer 40k'}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 flex-shrink-0">
                  {m.unitCost ? (
                    <span className="text-xs text-zinc-400">${m.unitCost}</span>
                  ) : (
                    <span className="text-xs text-red-400">$0</span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full bg-zinc-800 text-zinc-400 border border-zinc-700/50">
                    {getTimeInShame(m.createdAt)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* Relapse Modal */}
      {isRelapseModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm overflow-y-auto">
          <div className="bg-zinc-950 border border-red-900/50 rounded-xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-2xl font-bold text-red-500 mb-2 flex items-center">
              <Flame className="w-6 h-6 mr-2" />
              Log a Relapse
            </h2>
            <p className="text-zinc-400 text-sm mb-6">Admit it. You bought more plastic. This will add the unit to your Stash as Unbuilt.</p>

            <form onSubmit={handleSaveRelapse} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Game System</label>
                  <select
                    required
                    value={relapseFormData.gameSystem}
                    onChange={e => setRelapseFormData({ ...relapseFormData, gameSystem: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  >
                    <option value="Warhammer 40k">Warhammer 40k</option>
                    <option value="Age of Sigmar">Age of Sigmar</option>
                    <option value="BattleTech">BattleTech</option>
                    <option value="Star Wars: Legion">Star Wars: Legion</option>
                    <option value="Kill Team">Kill Team</option>
                    <option value="Warcry">Warcry</option>
                    <option value="Marvel Crisis Protocol">Marvel Crisis Protocol</option>
                    <option value="Warhammer: The Old World">Warhammer: The Old World</option>
                    <option value="Infinity">Infinity</option>
                    <option value="Firefight">Firefight</option>
                    <option value="Conquest: The Last Argument of Kings">Conquest</option>
                    <option value="Frostgrave">Frostgrave</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Faction</label>
                  <input
                    type="text" required
                    list="relapse-factions"
                    value={relapseFormData.faction}
                    onChange={e => setRelapseFormData({ ...relapseFormData, faction: e.target.value })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                  <datalist id="relapse-factions">
                    {getGameSystemData(relapseFormData.gameSystem || '').map(f => <option key={f.name} value={f.name} />)}
                  </datalist>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">What did you buy?</label>
                  {selectedModelData?.productUrl && (
                    <a
                      href={selectedModelData.productUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-blue-400 hover:text-blue-300 flex items-center transition-colors"
                    >
                      View on Warhammer.com <ExternalLink className="ml-1 h-2.5 w-2.5" />
                    </a>
                  )}
                </div>
                <input
                  type="text" required
                  list="relapse-models"
                  value={relapseFormData.modelName}
                  onChange={e => {
                    const newName = e.target.value;
                    let newQty = relapseFormData.qty;
                    let newPoints = relapseFormData.pointsPerModel;
                    let newCost = relapseFormData.unitCost;

                    const systemData = getGameSystemData(relapseFormData.gameSystem || '');
                    const factionData = systemData.find(f => f.name === relapseFormData.faction);

                    if (factionData) {
                      const md = factionData.models.find(m => m.name === newName);
                      if (md) {
                        if (md.points.length > 0) {
                          newQty = md.points[0].qty;
                          newPoints = Math.round(md.points[0].pts / newQty);
                        }
                        if (md.msrp) {
                          newCost = md.msrp;
                        }
                      }
                    }
                    setRelapseFormData({ ...relapseFormData, modelName: newName, qty: newQty, pointsPerModel: newPoints, unitCost: newCost });
                  }}
                  placeholder="e.g. Combat Patrol: Tyranids"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
                <datalist id="relapse-models">
                  {selectedFactionData?.models.map(m => <option key={m.name} value={m.name} />)}
                </datalist>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Nickname (Optional)</label>
                <input
                  type="text"
                  value={relapseFormData.nickname}
                  onChange={e => setRelapseFormData({ ...relapseFormData, nickname: e.target.value })}
                  placeholder="e.g. Purple Sash, Squad Alpha..."
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Qty</label>
                  <input
                    type="number" min="1" required
                    value={relapseFormData.qty}
                    onChange={e => setRelapseFormData({ ...relapseFormData, qty: parseInt(e.target.value) || 1 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Pts/Model</label>
                  <input
                    type="number" min="0"
                    value={relapseFormData.pointsPerModel}
                    onChange={e => setRelapseFormData({ ...relapseFormData, pointsPerModel: parseInt(e.target.value) || 0 })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Cost (USD)</label>
                  <input
                    type="number" min="0" step="0.01"
                    placeholder="60.00"
                    value={relapseFormData.unitCost}
                    onChange={e => setRelapseFormData({ ...relapseFormData, unitCost: e.target.value ? parseFloat(e.target.value) : '' })}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Reason for Lapse</label>
                <select
                  required
                  value={relapseFormData.reason}
                  onChange={e => setRelapseFormData({ ...relapseFormData, reason: e.target.value })}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-2.5 text-white text-sm focus:outline-none focus:ring-1 focus:ring-red-500"
                >
                  <option value="">Select an excuse...</option>
                  <option value="The sculpts were too cool">The sculpts were too cool</option>
                  <option value="It was a limited run">It was a limited run / FOMO</option>
                  <option value="I have no self-control">I literally have no self-control</option>
                  <option value="Needed for my list">Needed it for a tournament list</option>
                  <option value="Good deal">It was a really good deal</option>
                  <option value="I convinced myself I'd paint them this weekend">I convinced myself I'd paint them this weekend</option>
                  <option value="The box art lied to me">The box art lied to me</option>
                  <option value="Other">Other...</option>
                </select>
              </div>

              <div className="flex justify-end space-x-3 pt-4 mt-4 border-t border-zinc-800">
                <button
                  type="button"
                  onClick={() => setIsRelapseModalOpen(false)}
                  className="px-4 py-2 border border-zinc-700 bg-zinc-800 rounded-lg text-white hover:bg-zinc-700 transition-colors text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={savingRelapse}
                  className="px-4 py-2 bg-red-600 hover:bg-red-500 rounded-lg text-white disabled:opacity-50 transition-colors font-medium text-sm"
                >
                  {savingRelapse ? 'Confessing...' : 'Log Relapse'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {recoveryPlan && (
        <motion.div
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] px-6 py-3 bg-zinc-900 border border-zinc-800 rounded-full shadow-2xl text-white font-medium"
        >
          {recoveryPlan}
        </motion.div>
      )}

      <HobbyPhaseGuide isOpen={isHobbyGuideOpen} onClose={() => setIsHobbyGuideOpen(false)} />
    </div>
  );
}

function MetricCard({ title, value, subtitle, icon: Icon, color = "text-zinc-400", trend, onClick, actionIcon: ActionIcon }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      onClick={onClick}
      className={`bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm relative overflow-hidden group ${onClick ? 'cursor-pointer hover:border-zinc-700/80 transition-colors' : ''}`}
    >
      <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:opacity-20 transition-opacity duration-500 transform group-hover:scale-110 group-hover:rotate-12">
        <Icon className={`h-24 w-24 ${color}`} />
      </div>

      <div className="relative z-10">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-medium text-zinc-400 uppercase tracking-wider">{title}</h3>
          <div className="flex items-center space-x-2">
            {ActionIcon && (
              <ActionIcon className="h-4 w-4 text-zinc-500 hover:text-white transition-colors" />
            )}
            <Icon className={`h-5 w-5 ${color}`} />
          </div>
        </div>
        <div className="flex items-baseline space-x-2">
          <p className="text-4xl font-bold text-white tracking-tight">{value}</p>
        </div>
        <div className="mt-4 flex items-center justify-between text-sm">
          <span className="text-zinc-500">{subtitle}</span>
          <span className="text-zinc-400 font-medium">{trend}</span>
        </div>
      </div>
    </motion.div>
  );
}
