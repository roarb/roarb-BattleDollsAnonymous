import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, onSnapshot, addDoc, updateDoc, deleteDoc, doc, serverTimestamp } from 'firebase/firestore';
import { Plus, Edit2, Trash2, Search, Filter, Database, ChevronUp, ChevronDown, ChevronsUpDown } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { WARHAMMER_40K_DATA } from '../data/warhammer40k';

interface Model {
  id: string;
  modelName: string;
  qty: number;
  status: string;
  pointsPerModel?: number;
  faction: string;
  gameSystem?: string;
}

const STATUS_OPTIONS = ['Unbuilt', 'Assembled', 'Primed', 'Painted', 'Tabletop Ready'];

export function Collection() {
  const { user } = useAuth();
  const [models, setModels] = useState<Model[]>([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingModel, setEditingModel] = useState<Model | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('All');
  const [sortConfig, setSortConfig] = useState<{ key: string, direction: 'asc' | 'desc' } | null>(null);

  const [formData, setFormData] = useState({
    modelName: '',
    qty: 1,
    status: 'Unbuilt',
    pointsPerModel: 0,
    faction: '',
    gameSystem: 'Warhammer 40k'
  });

  useEffect(() => {
    if (!user) return;

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    try {
      if (editingModel) {
        await updateDoc(doc(db, 'collection', editingModel.id), {
          ...formData,
          updatedAt: serverTimestamp()
        });
      } else {
        await addDoc(collection(db, 'collection'), {
          ...formData,
          uid: user.uid,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }
      closeModal();
    } catch (error) {
      handleFirestoreError(error, editingModel ? OperationType.UPDATE : OperationType.CREATE, 'collection');
    }
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this model?')) return;
    try {
      await deleteDoc(doc(db, 'collection', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `collection/${id}`);
    }
  };

  const openModal = (model?: Model) => {
    if (model) {
      setEditingModel(model);
      setFormData({
        modelName: model.modelName,
        qty: model.qty,
        status: model.status,
        pointsPerModel: model.pointsPerModel || 0,
        faction: model.faction,
        gameSystem: model.gameSystem || 'Warhammer 40k'
      });
    } else {
      setEditingModel(null);
      setFormData({
        modelName: '',
        qty: 1,
        status: 'Unbuilt',
        pointsPerModel: 0,
        faction: '',
        gameSystem: 'Warhammer 40k'
      });
    }
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingModel(null);
  };

  const filteredModels = models.filter(m => {
    const searchLower = searchQuery.toLowerCase();
    const systemStr = m.gameSystem || 'Warhammer 40k';
    const matchesSearch = m.modelName.toLowerCase().includes(searchLower) || 
                          m.faction.toLowerCase().includes(searchLower) ||
                          systemStr.toLowerCase().includes(searchLower);
    const matchesStatus = statusFilter === 'All' || m.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const sortedModels = React.useMemo(() => {
    let sortableModels = [...filteredModels];
    if (sortConfig !== null) {
      sortableModels.sort((a, b) => {
        let aValue: any = a[sortConfig.key as keyof Model];
        let bValue: any = b[sortConfig.key as keyof Model];

        if (sortConfig.key === 'pointsPerModel') {
          aValue = (a.pointsPerModel || 0) * a.qty;
          bValue = (b.pointsPerModel || 0) * b.qty;
        } else if (sortConfig.key === 'gameSystem') {
          aValue = a.gameSystem || 'Warhammer 40k';
          bValue = b.gameSystem || 'Warhammer 40k';
        } else {
          if (aValue === undefined || aValue === null) aValue = '';
          if (bValue === undefined || bValue === null) bValue = '';
        }

        if (aValue < bValue) {
          return sortConfig.direction === 'asc' ? -1 : 1;
        }
        if (aValue > bValue) {
          return sortConfig.direction === 'asc' ? 1 : -1;
        }
        return 0;
      });
    }
    return sortableModels;
  }, [filteredModels, sortConfig]);

  const requestSort = (key: string) => {
    let direction: 'asc' | 'desc' = 'asc';
    if (sortConfig && sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const SortableHeader = ({ label, sortKey }: { label: string, sortKey: string }) => {
    const isActive = sortConfig?.key === sortKey;
    return (
      <th 
        scope="col" 
        className="px-6 py-4 text-left text-xs font-medium text-zinc-400 uppercase tracking-wider cursor-pointer hover:bg-zinc-800/50 transition-colors group select-none"
        onClick={() => requestSort(sortKey)}
      >
        <div className="flex items-center space-x-1">
          <span>{label}</span>
          <span className="text-zinc-600 group-hover:text-zinc-400 transition-colors">
            {isActive ? (
              sortConfig.direction === 'asc' ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronsUpDown className="h-4 w-4 opacity-0 group-hover:opacity-100" />
            )}
          </span>
        </div>
      </th>
    );
  };

  const selectedFactionData = formData.gameSystem === 'Warhammer 40k' 
    ? WARHAMMER_40K_DATA.find(f => f.name === formData.faction) 
    : undefined;
    
  const selectedModelData = selectedFactionData 
    ? selectedFactionData.models.find(m => m.name === formData.modelName) 
    : undefined;

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-fuchsia-500 shadow-[0_0_15px_rgba(217,70,239,0.5)]"></div></div>;
  }

  return (
    <div className="space-y-8 pb-12">
      <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
            <Database className="mr-3 h-8 w-8 text-fuchsia-500" />
            Asset Database
          </h1>
          <p className="text-zinc-400 mt-1">Manage and track your miniature collection.</p>
        </div>
        <button
          onClick={() => openModal()}
          className="inline-flex items-center px-5 py-2.5 border border-fuchsia-500/30 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-fuchsia-600/10 hover:bg-fuchsia-600/20 hover:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-950 transition-all duration-300"
        >
          <Plus className="-ml-1 mr-2 h-5 w-5 text-fuchsia-400" />
          Log New Asset
        </button>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 shadow-sm backdrop-blur-sm flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-zinc-500" />
          </div>
          <input
            type="text"
            placeholder="Search assets or factions..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-zinc-700/50 rounded-lg leading-5 bg-zinc-950 text-zinc-300 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm transition-colors"
          />
        </div>
        <div className="relative w-full sm:w-64">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Filter className="h-5 w-5 text-zinc-500" />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="block w-full pl-10 pr-3 py-2.5 border border-zinc-700/50 rounded-lg leading-5 bg-zinc-950 text-zinc-300 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm transition-colors appearance-none"
          >
            <option value="All">All Statuses</option>
            {STATUS_OPTIONS.map(status => (
              <option key={status} value={status}>{status}</option>
            ))}
          </select>
        </div>
      </div>

      <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl shadow-sm overflow-hidden backdrop-blur-sm">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-zinc-800/50">
            <thead className="bg-zinc-950/50">
              <tr>
                <SortableHeader label="Asset Name" sortKey="modelName" />
                <SortableHeader label="Game System" sortKey="gameSystem" />
                <SortableHeader label="Faction" sortKey="faction" />
                <SortableHeader label="Qty" sortKey="qty" />
                <SortableHeader label="Status" sortKey="status" />
                <SortableHeader label="Points" sortKey="pointsPerModel" />
                <th scope="col" className="relative px-6 py-4"><span className="sr-only">Actions</span></th>
              </tr>
            </thead>
            <tbody className="bg-transparent divide-y divide-zinc-800/50">
              {sortedModels.length > 0 ? (
                sortedModels.map((model) => (
                  <motion.tr 
                    key={model.id}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="hover:bg-zinc-800/30 transition-colors"
                  >
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-white">{model.modelName}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{model.gameSystem || 'Warhammer 40k'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400">{model.faction}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">{model.qty}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <span className={`px-2.5 py-1 inline-flex text-xs leading-5 font-medium rounded-md border
                        ${model.status === 'Tabletop Ready' ? 'bg-fuchsia-500/10 text-fuchsia-400 border-fuchsia-500/20' : 
                          model.status === 'Painted' ? 'bg-fuchsia-600/10 text-fuchsia-500 border-fuchsia-600/20' : 
                          model.status === 'Primed' ? 'bg-zinc-500/10 text-zinc-400 border-zinc-500/20' : 
                          model.status === 'Assembled' ? 'bg-zinc-600/10 text-zinc-300 border-zinc-600/20' : 
                          'bg-zinc-700/10 text-zinc-500 border-zinc-700/20'}`}>
                        {model.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-zinc-400 font-mono">{model.pointsPerModel ? model.pointsPerModel * model.qty : '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button onClick={() => openModal(model)} className="text-zinc-500 hover:text-fuchsia-400 mr-4 transition-colors">
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button onClick={() => handleDelete(model.id)} className="text-zinc-500 hover:text-red-400 transition-colors">
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </td>
                  </motion.tr>
                ))
              ) : (
                <tr>
                  <td colSpan={7} className="px-6 py-12 text-center text-sm text-zinc-500">
                    No assets found. Log some to your database!
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed z-10 inset-0 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
            <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="fixed inset-0 bg-zinc-950/75 transition-opacity" 
                aria-hidden="true" 
                onClick={closeModal}
              ></motion.div>

              <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

              <motion.div 
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 20 }}
                className="relative z-50 inline-block align-bottom bg-zinc-900 rounded-2xl text-left overflow-hidden shadow-2xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full border border-zinc-800/80"
              >
                <form onSubmit={handleSubmit}>
                  <div className="bg-zinc-900 px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
                    <div className="sm:flex sm:items-start">
                      <div className="mt-3 text-center sm:mt-0 sm:text-left w-full">
                        <h3 className="text-lg leading-6 font-medium text-white flex items-center" id="modal-title">
                          <Database className="mr-2 h-5 w-5 text-fuchsia-500" />
                          {editingModel ? 'Edit Asset' : 'Log New Asset'}
                        </h3>
                        <div className="mt-6 space-y-5">
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="gameSystem" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Game System</label>
                              <input
                                type="text"
                                name="gameSystem"
                                id="gameSystem"
                                list="gameSystems"
                                required
                                value={formData.gameSystem}
                                onChange={(e) => setFormData({...formData, gameSystem: e.target.value})}
                                className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                              />
                              <datalist id="gameSystems">
                                <option value="Warhammer 40k" />
                                <option value="Age of Sigmar" />
                                <option value="Kill Team" />
                                <option value="Warcry" />
                                <option value="The Old World" />
                                <option value="Star Wars: Legion" />
                                <option value="Marvel Crisis Protocol" />
                              </datalist>
                            </div>
                            <div>
                              <label htmlFor="faction" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Faction</label>
                              <input
                                type="text"
                                name="faction"
                                id="faction"
                                list={formData.gameSystem === 'Warhammer 40k' ? '40k-factions' : undefined}
                                required
                                value={formData.faction}
                                onChange={(e) => setFormData({...formData, faction: e.target.value})}
                                className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                              />
                              {formData.gameSystem === 'Warhammer 40k' && (
                                <datalist id="40k-factions">
                                  {WARHAMMER_40K_DATA.map(f => (
                                    <option key={f.name} value={f.name} />
                                  ))}
                                </datalist>
                              )}
                            </div>
                          </div>
                          <div>
                            <label htmlFor="modelName" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Asset Name</label>
                            <input
                              type="text"
                              name="modelName"
                              id="modelName"
                              list={selectedFactionData ? '40k-models' : undefined}
                              required
                              value={formData.modelName}
                              onChange={(e) => {
                                const newModelName = e.target.value;
                                let newQty = formData.qty;
                                let newPoints = formData.pointsPerModel;
                                
                                if (selectedFactionData) {
                                  const modelData = selectedFactionData.models.find(m => m.name === newModelName);
                                  if (modelData && modelData.points.length > 0) {
                                    newQty = modelData.points[0].qty;
                                    newPoints = Math.round(modelData.points[0].pts / newQty);
                                  }
                                }
                                
                                setFormData({...formData, modelName: newModelName, qty: newQty, pointsPerModel: newPoints});
                              }}
                              className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                            />
                            {selectedFactionData && (
                              <datalist id="40k-models">
                                {selectedFactionData.models.map(m => (
                                  <option key={m.name} value={m.name} />
                                ))}
                              </datalist>
                            )}
                          </div>
                          {selectedModelData && selectedModelData.points.length > 0 && (
                            <div>
                              <label htmlFor="unitSelection" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Unit Size Selection</label>
                              <select
                                id="unitSelection"
                                className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                                value={
                                  selectedModelData.points.some(p => p.qty === formData.qty && p.pts === formData.pointsPerModel * formData.qty)
                                    ? `${formData.qty}-${formData.pointsPerModel * formData.qty}`
                                    : 'custom'
                                }
                                onChange={(e) => {
                                  if (e.target.value === 'custom') return;
                                  const [qtyStr, totalPtsStr] = e.target.value.split('-');
                                  const qty = parseInt(qtyStr, 10);
                                  const totalPts = parseInt(totalPtsStr, 10);
                                  setFormData({...formData, qty, pointsPerModel: Math.round(totalPts / qty)});
                                }}
                              >
                                <option value="custom">Custom / Manual Entry</option>
                                {selectedModelData.points.map((p, idx) => (
                                  <option key={idx} value={`${p.qty}-${p.pts}`}>
                                    {p.qty} models - {p.pts} pts
                                  </option>
                                ))}
                              </select>
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            <div>
                              <label htmlFor="qty" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Quantity</label>
                              <input
                                type="number"
                                name="qty"
                                id="qty"
                                min="1"
                                required
                                value={formData.qty}
                                onChange={(e) => setFormData({...formData, qty: parseInt(e.target.value) || 1})}
                                className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                              />
                            </div>
                            <div>
                              <label htmlFor="pointsPerModel" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Points (per model)</label>
                              <input
                                type="number"
                                name="pointsPerModel"
                                id="pointsPerModel"
                                min="0"
                                value={formData.pointsPerModel}
                                onChange={(e) => setFormData({...formData, pointsPerModel: parseInt(e.target.value) || 0})}
                                className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                              />
                            </div>
                          </div>
                          <div>
                            <label htmlFor="status" className="block text-xs font-medium text-zinc-400 uppercase tracking-wider">Status</label>
                            <select
                              id="status"
                              name="status"
                              value={formData.status}
                              onChange={(e) => setFormData({...formData, status: e.target.value})}
                              className="mt-2 block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2.5 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-950 text-white transition-colors"
                            >
                              {STATUS_OPTIONS.map(status => (
                                <option key={status} value={status}>{status}</option>
                              ))}
                            </select>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="bg-zinc-950/50 px-4 py-4 sm:px-6 sm:flex sm:flex-row-reverse border-t border-zinc-800/80">
                    <button
                      type="submit"
                      className="w-full inline-flex justify-center rounded-lg border border-fuchsia-500/30 shadow-[0_0_10px_rgba(217,70,239,0.1)] px-4 py-2 bg-fuchsia-600/10 text-base font-medium text-white hover:bg-fuchsia-600/20 hover:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-900 sm:ml-3 sm:w-auto sm:text-sm transition-all duration-300"
                    >
                      {editingModel ? 'Save Changes' : 'Log Asset'}
                    </button>
                    <button
                      type="button"
                      onClick={closeModal}
                      className="mt-3 w-full inline-flex justify-center rounded-lg border border-zinc-700/50 shadow-sm px-4 py-2 bg-zinc-900 text-base font-medium text-zinc-300 hover:bg-zinc-800 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-900 sm:mt-0 sm:ml-3 sm:w-auto sm:text-sm transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </motion.div>
            </div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
