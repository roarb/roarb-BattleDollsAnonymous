import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { db, handleFirestoreError, OperationType } from '../firebase';
import { doc, getDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { User, Mail, Calendar, Camera, Save, Loader2, UserCircle, LogOut } from 'lucide-react';
import { motion } from 'motion/react';

export function Settings() {
  const { user, logout } = useAuth();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [displayName, setDisplayName] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;
    
    const fetchUserData = async () => {
      try {
        const userRef = doc(db, 'users', user.uid);
        const userSnap = await getDoc(userRef);
        
        if (userSnap.exists()) {
          const data = userSnap.data();
          setDisplayName(data.displayName || user.displayName || '');
          if (data.createdAt) {
            setCreatedAt(data.createdAt.toDate().toLocaleDateString(undefined, { 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            }));
          }
        }
      } catch (err) {
        handleFirestoreError(err, OperationType.GET, `users/${user.uid}`);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user]);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    setSuccessMessage('');
    try {
      await updateDoc(doc(db, 'users', user.uid), {
        displayName: displayName,
        updatedAt: serverTimestamp()
      });
      setSuccessMessage('Profile updated successfully!');
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
      <div className="border-b border-zinc-800 pb-6">
        <h1 className="text-3xl font-bold text-white tracking-tight flex items-center">
          <UserCircle className="mr-3 h-8 w-8 text-blue-500" />
          Member Profile
        </h1>
        <p className="text-zinc-400 mt-1">Manage your identity within the fellowship of plastic addicts.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        {/* Profile Card */}
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-1 space-y-6"
        >
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 text-center backdrop-blur-sm shadow-xl">
            <div className="relative inline-block mb-4">
              {user?.photoURL ? (
                <img 
                  src={user.photoURL} 
                  alt={displayName} 
                  className="h-24 w-24 rounded-full border-4 border-zinc-800 shadow-2xl mx-auto"
                />
              ) : (
                <div className="h-24 w-24 rounded-full bg-zinc-800 flex items-center justify-center mx-auto border-4 border-zinc-700">
                  <User className="h-12 w-12 text-zinc-600" />
                </div>
              )}
              <div className="absolute bottom-0 right-0 h-6 w-6 bg-emerald-500 border-2 border-zinc-900 rounded-full shadow-lg"></div>
            </div>
            <h2 className="text-xl font-bold text-white mb-1">{displayName}</h2>
            <p className="text-sm text-zinc-500 font-medium tracking-wide truncate px-2">{user?.email}</p>
            
            <button
              onClick={logout}
              className="mt-6 w-full flex items-center justify-center px-4 py-2 border border-zinc-800 rounded-lg text-sm font-medium text-zinc-400 hover:text-red-400 hover:bg-red-950/10 hover:border-red-900/30 transition-all group"
            >
              <LogOut className="mr-2 h-4 w-4 group-hover:-translate-x-1 transition-transform" />
              Sign Out
            </button>
          </div>

          <div className="bg-zinc-900/30 border border-zinc-800/50 rounded-2xl p-6 space-y-4">
            <div className="flex items-center text-sm">
              <Calendar className="h-4 w-4 text-zinc-500 mr-3" />
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Joined</p>
                <p className="text-zinc-300">{createdAt || 'Unknown'}</p>
              </div>
            </div>
            <div className="flex items-center text-sm">
              <Mail className="h-4 w-4 text-zinc-500 mr-3" />
              <div>
                <p className="text-zinc-500 text-xs uppercase tracking-widest font-bold">Email</p>
                <p className="text-zinc-300 truncate max-w-[150px]">{user?.email}</p>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Settings Form */}
        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="md:col-span-2"
        >
          <div className="bg-zinc-900/50 border border-zinc-800 rounded-2xl p-6 md:p-8 backdrop-blur-sm shadow-xl">
            <form onSubmit={handleUpdateProfile} className="space-y-6">
              <div className="space-y-4">
                <h3 className="text-lg font-bold text-white flex items-center">
                  <Camera className="mr-2 h-5 w-5 text-blue-400" />
                  Account Identity
                </h3>
                
                <div>
                  <label htmlFor="displayName" className="block text-xs font-bold text-zinc-500 uppercase tracking-widest mb-2">
                    Display Name
                  </label>
                  <input
                    type="text"
                    id="displayName"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    placeholder="Enter your name..."
                    className="block w-full bg-zinc-950 border border-zinc-800 rounded-lg shadow-sm py-3 px-4 text-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                  />
                  <p className="mt-2 text-xs text-zinc-500 italic">
                    This is how other hobbyists will see you in battle logs and leaderboards.
                  </p>
                </div>
              </div>

              <div className="pt-6 border-t border-zinc-800/50 flex items-center justify-between">
                <div className="text-emerald-400 text-sm font-medium h-5">
                  {successMessage}
                </div>
                <button
                  type="submit"
                  disabled={saving || !displayName.trim()}
                  className="inline-flex items-center px-6 py-2.5 rounded-xl shadow-lg text-sm font-bold text-white bg-blue-600 hover:bg-blue-500 transition-all disabled:opacity-50"
                >
                  {saving ? <Loader2 className="animate-spin -ml-1 mr-2 h-4 w-4" /> : <Save className="-ml-1 mr-2 h-4 w-4" />}
                  Save Profile
                </button>
              </div>
            </form>
          </div>

          <div className="mt-6 p-6 bg-zinc-950/40 border border-zinc-900 rounded-2xl">
            <h4 className="text-sm font-bold text-zinc-400 uppercase tracking-widest mb-2">Privacy & Security</h4>
            <p className="text-xs text-zinc-500 leading-relaxed">
              Your profile data is securely stored in Firestore and restricted by Firebase Security Rules. 
              Only you can edit your profile information. Your email address is never shared publicly.
            </p>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
