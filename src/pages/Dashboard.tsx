import React, { useEffect, useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, doc, getDoc } from 'firebase/firestore';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, AreaChart, Area, XAxis, YAxis, CartesianGrid } from 'recharts';
import { motion } from 'motion/react';
import { Package, CheckCircle, Activity, Flame, Shield, TrendingUp, Settings } from 'lucide-react';

interface Model {
  id: string;
  modelName: string;
  qty: number;
  status: string;
  faction: string;
  gameSystem?: string;
  updatedAt: any;
}

const STATUS_COLORS = {
  'Unbuilt': '#52525b', // zinc-600
  'Assembled': '#3b82f6', // blue-500
  'Primed': '#eab308', // yellow-500
  'Painted': '#d946ef', // fuchsia-500
  'Tabletop Ready': '#10b981', // emerald-500
};

// Helper to calculate hobby streak
const calculateStreak = (models: Model[]) => {
  if (models.length === 0) return { current: 0, best: 0 };

  // Get all unique dates of activity
  const activityDates = new Set<string>();
  models.forEach(m => {
    if (m.updatedAt && m.updatedAt.toDate) {
      const date = m.updatedAt.toDate();
      date.setHours(0, 0, 0, 0);
      activityDates.add(date.getTime().toString());
    }
  });

  const sortedDates = Array.from(activityDates).map(Number).sort((a, b) => b - a);
  if (sortedDates.length === 0) return { current: 0, best: 0 };

  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayTime = today.getTime();
  const yesterdayTime = todayTime - 86400000;

  let currentStreak = 0;
  let bestStreak = 0;
  let tempStreak = 1;

  // Calculate current streak
  let checkTime = todayTime;
  if (activityDates.has(todayTime.toString())) {
    currentStreak = 1;
    checkTime = yesterdayTime;
    while (activityDates.has(checkTime.toString())) {
      currentStreak++;
      checkTime -= 86400000;
    }
  } else if (activityDates.has(yesterdayTime.toString())) {
    currentStreak = 1;
    checkTime = yesterdayTime - 86400000;
    while (activityDates.has(checkTime.toString())) {
      currentStreak++;
      checkTime -= 86400000;
    }
  }

  // Calculate best streak
  for (let i = 0; i < sortedDates.length - 1; i++) {
    if (sortedDates[i] - sortedDates[i + 1] === 86400000) {
      tempStreak++;
    } else {
      if (tempStreak > bestStreak) bestStreak = tempStreak;
      tempStreak = 1;
    }
  }
  if (tempStreak > bestStreak) bestStreak = tempStreak;
  
  // If only one day of activity, best is 1
  if (sortedDates.length === 1) bestStreak = 1;

  return { current: currentStreak, best: Math.max(bestStreak, currentStreak) };
};

// Helper to generate last 90 days for heatmap
const generateHeatmapData = (models: Model[]) => {
  const days = 90;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const data = [];
  const activityMap = new Map<string, number>();

  // Count activity by date string (YYYY-MM-DD)
  models.forEach(m => {
    if (m.updatedAt && m.updatedAt.toDate) {
      const date = m.updatedAt.toDate();
      date.setHours(0, 0, 0, 0);
      const dateStr = date.toISOString().split('T')[0];
      // Give more weight to painted/ready models
      const weight = ['Painted', 'Tabletop Ready'].includes(m.status) ? 3 : 1;
      activityMap.set(dateStr, (activityMap.get(dateStr) || 0) + (m.qty * weight));
    }
  });

  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const dateStr = d.toISOString().split('T')[0];
    data.push({
      date: dateStr,
      count: activityMap.get(dateStr) || 0
    });
  }
  return data;
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
        if (['Painted', 'Tabletop Ready'].includes(m.status)) {
          monthData.completed += m.qty;
        } else {
          monthData.assembled += m.qty;
        }
      }
    }
  });

  return data;
};

export function Dashboard() {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [targetFaction, setTargetFaction] = useState<string | null>(null);
  const [targetArmy, setTargetArmy] = useState<{title: string, faction: string} | null>(null);

  useEffect(() => {
    if (!user) return;

    // Fetch user settings for target faction
    const fetchSettings = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          const data = userDoc.data();
          if (data.targetArmyId) {
            const armyDoc = await getDoc(doc(db, 'armyLists', data.targetArmyId));
            if (armyDoc.exists()) {
              setTargetArmy({ title: armyDoc.data().title, faction: armyDoc.data().faction });
            }
          } else if (data.targetFaction) {
            setTargetFaction(data.targetFaction);
          }
        }
      } catch (err) {
        console.error("Error fetching user settings:", err);
      }
    };
    fetchSettings();

    const q = query(collection(db, 'collection'), where('uid', '==', user.uid));
    
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const fetchedModels: Model[] = [];
      snapshot.forEach((doc) => {
        fetchedModels.push({ id: doc.id, ...doc.data() } as Model);
      });
      setModels(fetchedModels);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'collection');
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500"></div></div>;
  }

  const totalModels = models.reduce((acc, m) => acc + m.qty, 0);
  
  // Calculate Combat Readiness based on target faction if set
  const activeFaction = targetArmy ? targetArmy.faction : targetFaction;
  const readinessModels = activeFaction ? models.filter(m => m.faction === activeFaction) : models;
  const targetTotal = readinessModels.reduce((acc, m) => acc + m.qty, 0);
  const paintedCount = readinessModels.filter(m => ['Painted', 'Tabletop Ready'].includes(m.status)).reduce((acc, m) => acc + m.qty, 0);
  const completionRate = targetTotal > 0 ? Math.round((paintedCount / targetTotal) * 100) : 0;
  
  const streak = calculateStreak(models);

  const heatmapData = generateHeatmapData(models);
  const velocityData = generateVelocityData(models);

  const pieData = [
    { name: 'Unbuilt', value: models.filter(m => m.status === 'Unbuilt').reduce((a,b) => a+b.qty, 0), color: STATUS_COLORS['Unbuilt'] },
    { name: 'Assembled', value: models.filter(m => m.status === 'Assembled').reduce((a,b) => a+b.qty, 0), color: STATUS_COLORS['Assembled'] },
    { name: 'Primed', value: models.filter(m => m.status === 'Primed').reduce((a,b) => a+b.qty, 0), color: STATUS_COLORS['Primed'] },
    { name: 'Painted', value: models.filter(m => m.status === 'Painted').reduce((a,b) => a+b.qty, 0), color: STATUS_COLORS['Painted'] },
    { name: 'Tabletop Ready', value: models.filter(m => m.status === 'Tabletop Ready').reduce((a,b) => a+b.qty, 0), color: STATUS_COLORS['Tabletop Ready'] },
  ].filter(d => d.value > 0);

  const getHeatmapColor = (count: number) => {
    if (count === 0) return 'bg-zinc-900 border-zinc-800';
    if (count < 3) return 'bg-fuchsia-900/40 border-fuchsia-900/50';
    if (count < 7) return 'bg-fuchsia-700/60 border-fuchsia-700/50';
    if (count < 15) return 'bg-fuchsia-500 border-fuchsia-400';
    return 'bg-fuchsia-400 border-fuchsia-300 shadow-[0_0_10px_rgba(232,121,249,0.5)]';
  };

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Activity className="mr-3 h-8 w-8 text-fuchsia-500" />
            Command Center
          </h1>
          <p className="text-zinc-400 mt-1">Track your plastic crack addiction with performance metrics and collection telemetry.</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'army-builder' }))}
          className="inline-flex items-center px-5 py-2.5 border border-fuchsia-500/30 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-fuchsia-600/10 hover:bg-fuchsia-600/20 hover:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-950 transition-all duration-300"
        >
          <Shield className="-ml-1 mr-2 h-5 w-5 text-fuchsia-400" />
          Deploy Forces
        </button>
      </div>

      {/* Top Metrics Row */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <MetricCard 
          title="Total Assets" 
          value={totalModels} 
          subtitle="Miniatures logged"
          icon={Package} 
          trend="Across all factions"
        />
        <MetricCard 
          title="Combat Readiness" 
          value={`${completionRate}%`} 
          subtitle={`${paintedCount} fully painted`}
          icon={CheckCircle} 
          color="text-fuchsia-500"
          trend={targetArmy ? `Target: ${targetArmy.title}` : targetFaction ? `Target: ${targetFaction}` : "Target: Entire Collection"}
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'settings' }))}
          actionIcon={Settings}
        />
        <MetricCard 
          title="Hobby Streak" 
          value={`${streak.current} Days`} 
          subtitle="Consecutive activity"
          icon={Flame} 
          color="text-orange-500"
          trend={`Personal best: ${streak.best}`}
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
              <TrendingUp className="mr-2 h-5 w-5 text-fuchsia-500" />
              Hobby Velocity
            </h2>
            <span className="text-xs font-medium px-2.5 py-1 bg-zinc-800 text-zinc-300 rounded-full border border-zinc-700">Last 6 Months</span>
          </div>
          <div className="h-72">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={velocityData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCompleted" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#d946ef" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#d946ef" stopOpacity={0}/>
                  </linearGradient>
                  <linearGradient id="colorAssembled" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
                <XAxis dataKey="name" stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <YAxis stroke="#71717a" fontSize={12} tickLine={false} axisLine={false} />
                <Tooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderColor: '#27272a', borderRadius: '8px', color: '#fff' }}
                  itemStyle={{ color: '#fff' }}
                />
                <Area type="monotone" dataKey="assembled" name="WIP/Assembled" stroke="#3b82f6" fillOpacity={1} fill="url(#colorAssembled)" />
                <Area type="monotone" dataKey="completed" name="Painted" stroke="#d946ef" strokeWidth={2} fillOpacity={1} fill="url(#colorCompleted)" />
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
          <h2 className="text-lg font-medium text-white mb-6">Asset Distribution</h2>
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

      {/* GitHub-style Heatmap */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm"
      >
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-medium text-white">Activity Heatmap</h2>
          <div className="flex items-center space-x-2 text-xs text-zinc-500">
            <span>Less</span>
            <div className="flex space-x-1">
              <div className="w-3 h-3 rounded-sm bg-zinc-900 border border-zinc-800"></div>
              <div className="w-3 h-3 rounded-sm bg-fuchsia-900/40 border border-fuchsia-900/50"></div>
              <div className="w-3 h-3 rounded-sm bg-fuchsia-700/60 border border-fuchsia-700/50"></div>
              <div className="w-3 h-3 rounded-sm bg-fuchsia-500 border border-fuchsia-400"></div>
              <div className="w-3 h-3 rounded-sm bg-fuchsia-400 border border-fuchsia-300 shadow-[0_0_5px_rgba(232,121,249,0.5)]"></div>
            </div>
            <span>More</span>
          </div>
        </div>
        
        <div className="overflow-x-auto custom-scrollbar pb-2">
          <div className="min-w-[700px]">
            <div className="grid grid-rows-7 grid-flow-col gap-1.5">
              {heatmapData.map((day, i) => (
                <div 
                  key={i} 
                  className={`w-3.5 h-3.5 rounded-sm border ${getHeatmapColor(day.count)} transition-all duration-200 hover:scale-125 hover:z-10 cursor-pointer`}
                  title={`${day.date}: ${day.count} activity points`}
                />
              ))}
            </div>
          </div>
        </div>
      </motion.div>
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
