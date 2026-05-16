import React, { useEffect, useState } from 'react';
import { collection, doc, getDoc, onSnapshot, query, where } from 'firebase/firestore';
import { Check, Handshake, Loader2, UserCircle, Users, X } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { CommunityProfile, ConnectionRequest, respondToConnectionRequest } from '../../lib/community';

interface RequestWithProfile extends ConnectionRequest {
  profile?: CommunityProfile | null;
}

export function RequestsPanel() {
  const { user } = useAuth();
  const [requests, setRequests] = useState<RequestWithProfile[]>([]);
  const [savingId, setSavingId] = useState<string | null>(null);

  useEffect(() => {
    if (!user) return;

    const requestsQuery = query(
      collection(db, 'connectionRequests'),
      where('toUid', '==', user.uid),
      where('status', '==', 'pending')
    );

    return onSnapshot(requestsQuery, async (snapshot) => {
      const nextRequests = await Promise.all(snapshot.docs.map(async (item) => {
        const request = { id: item.id, ...item.data() } as ConnectionRequest;
        const profileSnap = await getDoc(doc(db, 'profiles', request.fromUid));
        return {
          ...request,
          profile: profileSnap.exists() ? profileSnap.data() as CommunityProfile : null,
        };
      }));
      setRequests(nextRequests);
    }, (error) => {
      console.error('Failed to load connection requests:', error);
    });
  }, [user]);

  const handleResponse = async (request: ConnectionRequest, status: 'accepted' | 'declined') => {
    setSavingId(`${request.id}:${status}`);
    try {
      await respondToConnectionRequest(request, status);
    } finally {
      setSavingId(null);
    }
  };

  return (
    <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">Requests</h2>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-400">
          {requests.length} pending
        </span>
      </div>

      {requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">
          No incoming requests.
        </div>
      ) : (
        <div className="space-y-3">
          {requests.map((request) => {
            const profile = request.profile;
            const KindIcon = request.kind === 'friend' ? Users : Handshake;

            return (
              <article key={request.id} className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-4">
                <div className="flex items-center gap-3">
                  {profile?.photoURL ? (
                    <img src={profile.photoURL} alt="" className="h-10 w-10 rounded-full border border-zinc-700 object-cover" referrerPolicy="no-referrer" />
                  ) : (
                    <div className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-900 flex items-center justify-center">
                      <UserCircle className="h-6 w-6 text-zinc-500" />
                    </div>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-bold text-white">{profile?.displayName || 'Unknown Member'}</p>
                    <p className="mt-1 flex items-center text-xs text-zinc-500">
                      <KindIcon className="mr-1.5 h-3.5 w-3.5" />
                      {request.kind === 'friend' ? 'Friend request' : 'Sponsorship request'}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={() => handleResponse(request, 'accepted')}
                      disabled={Boolean(savingId)}
                      className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-2 text-emerald-300 hover:bg-emerald-500/20 disabled:opacity-50"
                      title="Accept"
                    >
                      {savingId === `${request.id}:accepted` ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleResponse(request, 'declined')}
                      disabled={Boolean(savingId)}
                      className="rounded-lg border border-zinc-700 bg-zinc-900 p-2 text-zinc-400 hover:text-red-300 hover:border-red-500/30 hover:bg-red-500/10 disabled:opacity-50"
                      title="Decline"
                    >
                      {savingId === `${request.id}:declined` ? <Loader2 className="h-4 w-4 animate-spin" /> : <X className="h-4 w-4" />}
                    </button>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </section>
  );
}

