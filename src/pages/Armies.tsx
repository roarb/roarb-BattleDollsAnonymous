import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { collection, query, where, getDocs, doc, deleteDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { Shield, Loader2, Trash2, Edit2, ChevronDown, ChevronUp, Save, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import ReactMarkdown from 'react-markdown';

interface ArmyList {
  id: string;
  title: string;
  pointsLimit: number;
  faction: string;
  content: string;
  notes?: string;
  createdAt: any;
  updatedAt: any;
}

export function Armies() {
  const { user } = useAuth();
  const [armies, setArmies] = useState<ArmyList[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{title: string, notes: string, content: string}>({ title: '', notes: '', content: '' });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user) return;
    fetchArmies();
  }, [user]);

  const fetchArmies = async () => {
    if (!user) return;
    try {
      const q = query(collection(db, 'armyLists'), where('uid', '==', user.uid));
      const snapshot = await getDocs(q);
      const fetchedArmies: ArmyList[] = [];
      snapshot.forEach((doc) => {
        fetchedArmies.push({ id: doc.id, ...doc.data() } as ArmyList);
      });
      // Sort by newest first
      fetchedArmies.sort((a, b) => {
        const dateA = a.createdAt?.toDate ? a.createdAt.toDate() : new Date(0);
        const dateB = b.createdAt?.toDate ? b.createdAt.toDate() : new Date(0);
        return dateB.getTime() - dateA.getTime();
      });
      setArmies(fetchedArmies);
    } catch (err) {
      handleFirestoreError(err, OperationType.LIST, 'armyLists');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this army list?')) return;
    
    try {
      await deleteDoc(doc(db, 'armyLists', id));
      setArmies(armies.filter(a => a.id !== id));
      if (expandedId === id) setExpandedId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.DELETE, `armyLists/${id}`);
    }
  };

  const startEditing = (army: ArmyList, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingId(army.id);
    setEditForm({
      title: army.title,
      notes: army.notes || '',
      content: army.content
    });
    setExpandedId(army.id);
  };

  const cancelEditing = () => {
    setEditingId(null);
  };

  const handleUpdate = async (id: string) => {
    if (!user || !editForm.title) return;
    
    setSaving(true);
    try {
      await updateDoc(doc(db, 'armyLists', id), {
        title: editForm.title,
        notes: editForm.notes,
        content: editForm.content,
        updatedAt: serverTimestamp()
      });
      
      setArmies(armies.map(a => a.id === id ? { ...a, ...editForm, updatedAt: new Date() } : a));
      setEditingId(null);
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `armyLists/${id}`);
    } finally {
      setSaving(false);
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
            Saved Armies
          </h1>
          <p className="text-zinc-400 mt-1">Manage your battle-forged lists and strategic notes.</p>
        </div>
        <button
          onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'army-builder' }))}
          className="inline-flex items-center px-5 py-2.5 border border-fuchsia-500/30 rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-fuchsia-600/10 hover:bg-fuchsia-600/20 hover:border-fuchsia-500/50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-fuchsia-500 focus:ring-offset-zinc-950 transition-all duration-300"
        >
          Build New List
        </button>
      </div>

      {armies.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-12 text-center backdrop-blur-sm">
          <Shield className="mx-auto h-16 w-16 text-zinc-700 mb-4" />
          <h3 className="text-lg font-medium text-white mb-2">No armies saved yet</h3>
          <p className="text-zinc-400 mb-6">Use the AI Army Strategist to generate and save your first list.</p>
          <button
            onClick={() => window.dispatchEvent(new CustomEvent('navigate', { detail: 'army-builder' }))}
            className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-colors"
          >
            Go to Army Builder
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {armies.map((army) => (
            <motion.div 
              key={army.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl overflow-hidden backdrop-blur-sm shadow-sm"
            >
              <div 
                className="p-6 cursor-pointer hover:bg-zinc-800/30 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                onClick={() => setExpandedId(expandedId === army.id ? null : army.id)}
              >
                <div className="flex-1">
                  <div className="flex items-center space-x-3">
                    <h3 className="text-lg font-bold text-white">{army.title}</h3>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-zinc-800 text-zinc-300 border border-zinc-700">
                      {army.faction}
                    </span>
                    <span className="px-2.5 py-0.5 rounded-full text-xs font-medium bg-fuchsia-900/30 text-fuchsia-400 border border-fuchsia-800/50">
                      {army.pointsLimit} pts
                    </span>
                  </div>
                  {army.notes && !editingId && (
                    <p className="text-sm text-zinc-400 mt-2 line-clamp-1">{army.notes}</p>
                  )}
                </div>
                
                <div className="flex items-center space-x-2">
                  <button 
                    onClick={(e) => startEditing(army, e)}
                    className="p-2 text-zinc-500 hover:text-fuchsia-400 transition-colors rounded-lg hover:bg-zinc-800"
                    title="Edit Army"
                  >
                    <Edit2 className="h-4 w-4" />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(army.id, e)}
                    className="p-2 text-zinc-500 hover:text-red-400 transition-colors rounded-lg hover:bg-zinc-800"
                    title="Delete Army"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                  <div className="p-2 text-zinc-500">
                    {expandedId === army.id ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </div>
                </div>
              </div>

              <AnimatePresence>
                {expandedId === army.id && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    className="border-t border-zinc-800/80"
                  >
                    <div className="p-6 bg-zinc-950/30">
                      {editingId === army.id ? (
                        <div className="space-y-4">
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">List Name</label>
                            <input
                              type="text"
                              value={editForm.title}
                              onChange={(e) => setEditForm({...editForm, title: e.target.value})}
                              className="block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-900 text-white"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Strategic Notes</label>
                            <textarea
                              value={editForm.notes}
                              onChange={(e) => setEditForm({...editForm, notes: e.target.value})}
                              rows={3}
                              className="block w-full border border-zinc-700/50 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-900 text-white resize-none"
                            />
                          </div>
                          <div>
                            <label className="block text-xs font-medium text-zinc-400 uppercase tracking-wider mb-1">Army List Content (Markdown)</label>
                            <textarea
                              value={editForm.content}
                              onChange={(e) => setEditForm({...editForm, content: e.target.value})}
                              className="block w-full min-h-[300px] border border-zinc-700/50 rounded-lg shadow-sm py-2 px-3 focus:outline-none focus:ring-1 focus:ring-fuchsia-500 focus:border-fuchsia-500 sm:text-sm bg-zinc-900 text-white font-mono resize-y"
                            />
                          </div>
                          <div className="flex justify-end space-x-3 pt-2">
                            <button
                              onClick={cancelEditing}
                              className="px-4 py-2 border border-zinc-700 rounded-lg shadow-sm text-sm font-medium text-zinc-300 bg-zinc-800 hover:bg-zinc-700 transition-colors"
                            >
                              Cancel
                            </button>
                            <button
                              onClick={() => handleUpdate(army.id)}
                              disabled={saving || !editForm.title}
                              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg shadow-[0_0_15px_rgba(217,70,239,0.15)] text-sm font-medium text-white bg-fuchsia-600 hover:bg-fuchsia-500 transition-all disabled:opacity-50"
                            >
                              {saving ? <Loader2 className="animate-spin h-4 w-4 mr-2" /> : <Save className="h-4 w-4 mr-2" />}
                              Save Changes
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="space-y-6">
                          {army.notes && (
                            <div className="bg-zinc-900/80 p-4 rounded-xl border border-zinc-800/50">
                              <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-2">Strategic Notes</h4>
                              <p className="text-zinc-300 text-sm whitespace-pre-wrap">{army.notes}</p>
                            </div>
                          )}
                          <div>
                            <h4 className="text-xs font-medium text-zinc-500 uppercase tracking-wider mb-3">Army List</h4>
                            <div className="markdown-body text-zinc-300 bg-zinc-900/50 p-6 rounded-xl border border-zinc-800/50">
                              <ReactMarkdown>{army.content}</ReactMarkdown>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
