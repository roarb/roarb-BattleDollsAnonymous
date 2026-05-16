import React, { useEffect, useState } from 'react';
import { doc, onSnapshot } from 'firebase/firestore';
import { ArrowLeft, Flame, Medal, Settings, UserCircle } from 'lucide-react';
import { motion } from 'motion/react';
import { useAuth } from '../contexts/AuthContext';
import { db } from '../firebase';
import { CommunityFeed } from '../components/community/CommunityFeed';
import { ConnectionButton } from '../components/community/ConnectionButton';
import { ProfileProgressDonut } from '../components/community/ProfileProgressDonut';
import { CommunityProfile } from '../lib/community';

interface ProfileProps {
  uid: string;
  onNavigate: (path: string) => void;
}

export function Profile({ uid, onNavigate }: ProfileProps) {
  const { user } = useAuth();
  const [profile, setProfile] = useState<CommunityProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    setLoading(true);
    setError('');

    return onSnapshot(doc(db, 'profiles', uid), (snapshot) => {
      if (snapshot.exists()) {
        setProfile(snapshot.data() as CommunityProfile);
      } else {
        setProfile(null);
        setError('This profile does not exist yet.');
      }
      setLoading(false);
    }, (snapshotError) => {
      console.error('Failed to load profile:', snapshotError);
      setProfile(null);
      setError('This profile is private or unavailable.');
      setLoading(false);
    });
  }, [uid]);

  if (loading) {
    return <div className="flex justify-center items-center h-64"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div></div>;
  }

  if (error || !profile) {
    return (
      <div className="max-w-2xl mx-auto py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full border border-zinc-800 bg-zinc-900">
          <UserCircle className="h-8 w-8 text-zinc-500" />
        </div>
        <h1 className="text-2xl font-bold text-white">Profile unavailable</h1>
        <p className="mt-3 text-zinc-500">{error || 'This member is not available.'}</p>
        <button
          type="button"
          onClick={() => onNavigate('community')}
          className="mt-6 inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-900 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-blue-300 hover:border-blue-500/40"
        >
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Community
        </button>
      </div>
    );
  }

  const isSelf = user?.uid === profile.uid;

  return (
    <div className="space-y-8 pb-12">
      <button
        type="button"
        onClick={() => onNavigate('community')}
        className="inline-flex items-center text-sm font-medium text-zinc-400 hover:text-blue-300"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back to Community
      </button>

      <motion.section
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl border border-zinc-800/80 bg-zinc-900/50 p-6 backdrop-blur-sm"
      >
        <div className="flex flex-col md:flex-row md:items-center gap-6">
          {profile.photoURL ? (
            <img src={profile.photoURL} alt="" className="h-24 w-24 rounded-full border-4 border-zinc-800 object-cover shadow-2xl" referrerPolicy="no-referrer" />
          ) : (
            <div className="h-24 w-24 rounded-full border-4 border-zinc-800 bg-zinc-950 flex items-center justify-center shadow-2xl">
              <UserCircle className="h-12 w-12 text-zinc-600" />
            </div>
          )}

          <div className="min-w-0 flex-1">
            <div className="flex flex-col lg:flex-row lg:items-start lg:justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black tracking-tight text-white">{profile.displayName}</h1>
                <div className="mt-3 flex flex-wrap gap-3 text-sm text-zinc-400">
                  <span className="inline-flex items-center rounded-full border border-orange-500/20 bg-orange-500/10 px-3 py-1 text-orange-300">
                    <Flame className="mr-1.5 h-4 w-4" />
                    {profile.currentStreak || 0} day streak
                  </span>
                  <span className="inline-flex items-center rounded-full border border-amber-500/20 bg-amber-500/10 px-3 py-1 text-amber-300">
                    <Medal className="mr-1.5 h-4 w-4" />
                    {profile.badgeCount || 0} chips
                  </span>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                {isSelf ? (
                  <button
                    type="button"
                    onClick={() => onNavigate('settings')}
                    className="inline-flex items-center rounded-lg border border-zinc-700 bg-zinc-950 px-4 py-2 text-sm font-medium text-zinc-300 hover:text-blue-300 hover:border-blue-500/40"
                  >
                    <Settings className="mr-2 h-4 w-4" />
                    Edit Profile
                  </button>
                ) : (
                  <ConnectionButton profile={profile} />
                )}
              </div>
            </div>
          </div>
        </div>
      </motion.section>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="lg:col-span-1"
        >
          <ProfileProgressDonut profile={profile} />
        </motion.div>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08 }}
          className="lg:col-span-2"
        >
          <CommunityFeed
            profileUid={profile.uid}
            title="Recent Activity"
            emptyText="No shared progress or relapses yet."
            maxItems={12}
          />
        </motion.div>
      </div>
    </div>
  );
}

