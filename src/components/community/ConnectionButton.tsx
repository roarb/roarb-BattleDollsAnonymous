import React, { useEffect, useState } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { Handshake, Loader2, UserPlus, Users } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import {
  CommunityProfile,
  connectionRequestId,
  friendRelationshipId,
  sendConnectionRequest,
  sponsorshipRelationshipId,
} from '../../lib/community';

interface ConnectionButtonProps {
  profile: CommunityProfile;
}

type RequestState = 'idle' | 'pending' | 'connected' | 'disabled';

export function ConnectionButton({ profile }: ConnectionButtonProps) {
  const { user } = useAuth();
  const [friendState, setFriendState] = useState<RequestState>('idle');
  const [sponsorState, setSponsorState] = useState<RequestState>('idle');
  const [saving, setSaving] = useState<string | null>(null);

  const isSelf = user?.uid === profile.uid;

  useEffect(() => {
    if (!user || isSelf) return;

    let cancelled = false;

    const checkState = async () => {
      const [friendRelationship, sponsorRelationship, friendRequest, sponsorRequest] = await Promise.all([
        getDoc(doc(db, 'relationships', friendRelationshipId(user.uid, profile.uid))),
        getDoc(doc(db, 'relationships', sponsorshipRelationshipId(user.uid, profile.uid))),
        getDoc(doc(db, 'connectionRequests', connectionRequestId(user.uid, profile.uid, 'friend'))),
        getDoc(doc(db, 'connectionRequests', connectionRequestId(user.uid, profile.uid, 'sponsor'))),
      ]);

      if (cancelled) return;

      setFriendState(
        friendRelationship.exists()
          ? 'connected'
          : friendRequest.exists() && friendRequest.data().status === 'pending'
            ? 'pending'
            : profile.allowFriendRequests
              ? 'idle'
              : 'disabled'
      );
      setSponsorState(
        sponsorRelationship.exists()
          ? 'connected'
          : sponsorRequest.exists() && sponsorRequest.data().status === 'pending'
            ? 'pending'
            : profile.allowSponsorRequests
              ? 'idle'
              : 'disabled'
      );
    };

    checkState().catch((error) => console.error('Failed to load connection state:', error));

    return () => {
      cancelled = true;
    };
  }, [user, profile.uid, profile.allowFriendRequests, profile.allowSponsorRequests, isSelf]);

  const handleRequest = async (kind: 'friend' | 'sponsor') => {
    if (!user || isSelf) return;
    setSaving(kind);
    try {
      await sendConnectionRequest(user.uid, profile.uid, kind);
      if (kind === 'friend') {
        setFriendState('pending');
      } else {
        setSponsorState('pending');
      }
    } finally {
      setSaving(null);
    }
  };

  if (isSelf) return null;

  return (
    <div className="flex flex-wrap gap-2">
      <ActionButton
        icon={Users}
        state={friendState}
        saving={saving === 'friend'}
        idleLabel="Add Friend"
        pendingLabel="Friend Pending"
        connectedLabel="Friends"
        disabledLabel="No Friend Requests"
        onClick={() => handleRequest('friend')}
      />
      <ActionButton
        icon={Handshake}
        state={sponsorState}
        saving={saving === 'sponsor'}
        idleLabel="Ask Sponsor"
        pendingLabel="Sponsor Pending"
        connectedLabel="Sponsorship"
        disabledLabel="No Sponsor Requests"
        onClick={() => handleRequest('sponsor')}
      />
    </div>
  );
}

function ActionButton({ icon: Icon, state, saving, idleLabel, pendingLabel, connectedLabel, disabledLabel, onClick }: {
  icon: React.ElementType;
  state: RequestState;
  saving: boolean;
  idleLabel: string;
  pendingLabel: string;
  connectedLabel: string;
  disabledLabel: string;
  onClick: () => void;
}) {
  const isDisabled = saving || state !== 'idle';
  const label = state === 'connected' ? connectedLabel : state === 'pending' ? pendingLabel : state === 'disabled' ? disabledLabel : idleLabel;

  return (
    <button
      type="button"
      disabled={isDisabled}
      onClick={onClick}
      className={`inline-flex items-center rounded-lg border px-3 py-2 text-sm font-medium transition-colors ${
        state === 'connected'
          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-300'
          : state === 'pending'
            ? 'border-amber-500/30 bg-amber-500/10 text-amber-300'
            : state === 'disabled'
              ? 'border-zinc-800 bg-zinc-950/40 text-zinc-600'
              : 'border-blue-500/30 bg-blue-600/10 text-blue-300 hover:bg-blue-600/20 hover:border-blue-500/50'
      }`}
    >
      {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : state === 'idle' ? <UserPlus className="mr-2 h-4 w-4" /> : <Icon className="mr-2 h-4 w-4" />}
      {label}
    </button>
  );
}

