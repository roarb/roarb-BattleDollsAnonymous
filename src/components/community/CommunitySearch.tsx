import React, { useEffect, useState } from 'react';
import { collection, getDocs, limit, query, where } from 'firebase/firestore';
import { Search, UserCircle } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { CommunityProfile, normalizeSearchText } from '../../lib/community';
import { ConnectionButton } from './ConnectionButton';

interface CommunitySearchProps {
  onNavigate: (path: string) => void;
}

export function CommunitySearch({ onNavigate }: CommunitySearchProps) {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState('');
  const [profiles, setProfiles] = useState<CommunityProfile[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) return;

    let cancelled = false;

    const loadProfiles = async () => {
      setLoading(true);
      try {
        const profileQuery = query(
          collection(db, 'profiles'),
          where('isPublic', '==', true),
          limit(40)
        );
        const snapshot = await getDocs(profileQuery);
        if (cancelled) return;

        const normalizedTerm = normalizeSearchText(searchTerm);
        const results = snapshot.docs
          .map((item) => item.data() as CommunityProfile)
          .filter((profile) => profile.uid !== user.uid)
          .filter((profile) => {
            if (!normalizedTerm) return true;
            return profile.displayNameLower?.includes(normalizedTerm);
          })
          .sort((a, b) => a.displayName.localeCompare(b.displayName))
          .slice(0, 12);

        setProfiles(results);
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    loadProfiles().catch((error) => console.error('Failed to load community profiles:', error));

    return () => {
      cancelled = true;
    };
  }, [user, searchTerm]);

  return (
    <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
        <div>
          <h2 className="text-lg font-bold text-white">Find Members</h2>
          <p className="text-sm text-zinc-500 mt-1">Public profiles open to the community.</p>
        </div>
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-500" />
          <input
            type="text"
            value={searchTerm}
            onChange={(event) => setSearchTerm(event.target.value)}
            placeholder="Search display names..."
            className="w-full rounded-lg border border-zinc-800 bg-zinc-950 py-2.5 pl-9 pr-3 text-sm text-white placeholder-zinc-600 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
          />
        </div>
      </div>

      {loading ? (
        <div className="py-8 text-center text-sm text-zinc-500">Scanning the fellowship...</div>
      ) : profiles.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">
          No public members found yet.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {profiles.map((profile) => (
            <article key={profile.uid} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
              <div className="flex items-start gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate(`profile/${profile.uid}`)}
                  className="flex-shrink-0"
                >
                  {profile.photoURL ? (
                    <img src={profile.photoURL} alt="" className="h-11 w-11 rounded-full border border-zinc-700 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-11 w-11 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-zinc-500" />
                    </div>
                  )}
                </button>
                <div className="min-w-0 flex-1">
                  <button
                    type="button"
                    onClick={() => onNavigate(`profile/${profile.uid}`)}
                    className="block truncate text-left text-sm font-bold text-white hover:text-blue-300"
                  >
                    {profile.displayName}
                  </button>
                  <p className="text-xs text-zinc-500 mt-1">
                    {profile.currentStreak || 0} day streak · {profile.badgeCount || 0} chips
                  </p>
                  <div className="mt-3">
                    <ConnectionButton profile={profile} />
                  </div>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}
    </section>
  );
}

