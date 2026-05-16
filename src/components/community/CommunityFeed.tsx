import React, { useEffect, useState } from 'react';
import { collection, limit, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import { Award, Flame, Heart, MessageCircle, TrendingUp, UserCircle } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { useAuth } from '../../contexts/AuthContext';
import { db } from '../../firebase';
import { CommunityActivity, Relationship, toggleActivityLike } from '../../lib/community';

interface CommunityFeedProps {
  profileUid?: string;
  title?: string;
  emptyText?: string;
  maxItems?: number;
}

export function CommunityFeed({ profileUid, title = 'Community Feed', emptyText = 'No shared updates yet.', maxItems = 20 }: CommunityFeedProps) {
  const { user } = useAuth();
  const [activities, setActivities] = useState<CommunityActivity[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!user) return;

    setLoading(true);
    setError('');

    if (profileUid) {
      const activityQuery = query(
        collection(db, 'activities'),
        where('userId', '==', profileUid),
        orderBy('createdAt', 'desc'),
        limit(maxItems)
      );

      return onSnapshot(activityQuery, (snapshot) => {
        setActivities(snapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CommunityActivity));
        setLoading(false);
      }, (snapshotError) => {
        setError('Shared activity is private or unavailable.');
        setLoading(false);
        console.error('Failed to load profile activity:', snapshotError);
      });
    }

    let activityUnsubs: (() => void)[] = [];
    const activityBuckets = new Map<string, CommunityActivity[]>();

    const relationshipsQuery = query(
      collection(db, 'relationships'),
      where('memberUids', 'array-contains', user.uid),
      where('status', '==', 'active')
    );

    const unsubscribeRelationships = onSnapshot(relationshipsQuery, (snapshot) => {
      activityUnsubs.forEach((unsubscribe) => unsubscribe());
      activityUnsubs = [];
      activityBuckets.clear();

      const relatedUids = new Set<string>([user.uid]);
      snapshot.docs.forEach((item) => {
        const relationship = { id: item.id, ...item.data() } as Relationship;
        relationship.memberUids.forEach((uid) => relatedUids.add(uid));
      });

      const uidList = Array.from(relatedUids);
      const chunks: string[][] = [];
      for (let index = 0; index < uidList.length; index += 10) {
        chunks.push(uidList.slice(index, index + 10));
      }

      chunks.forEach((chunk, index) => {
        const bucketKey = `chunk-${index}`;
        const activityQuery = query(
          collection(db, 'activities'),
          where('userId', 'in', chunk),
          orderBy('createdAt', 'desc'),
          limit(maxItems)
        );

        const unsubscribeActivities = onSnapshot(activityQuery, (activitySnapshot) => {
          activityBuckets.set(bucketKey, activitySnapshot.docs.map((item) => ({ id: item.id, ...item.data() }) as CommunityActivity));
          const merged = Array.from(activityBuckets.values())
            .flat()
            .sort((a, b) => getMillis(b.createdAt) - getMillis(a.createdAt))
            .slice(0, maxItems);
          setActivities(merged);
          setLoading(false);
        }, (activityError) => {
          setError('The feed could not be loaded.');
          setLoading(false);
          console.error('Failed to load community activity:', activityError);
        });

        activityUnsubs.push(unsubscribeActivities);
      });

      if (chunks.length === 0) {
        setActivities([]);
        setLoading(false);
      }
    }, (relationshipError) => {
      setError('Relationships could not be loaded.');
      setLoading(false);
      console.error('Failed to load relationships:', relationshipError);
    });

    return () => {
      unsubscribeRelationships();
      activityUnsubs.forEach((unsubscribe) => unsubscribe());
    };
  }, [user, profileUid, maxItems]);

  return (
    <section className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-6 backdrop-blur-sm">
      <div className="flex items-center justify-between mb-5">
        <h2 className="text-lg font-bold text-white">{title}</h2>
        <span className="rounded-full border border-zinc-800 bg-zinc-950 px-2.5 py-1 text-xs font-medium text-zinc-400">
          {activities.length} updates
        </span>
      </div>

      {loading ? (
        <div className="py-10 text-center text-sm text-zinc-500">Loading updates...</div>
      ) : error ? (
        <div className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-8 text-center text-sm text-red-300">
          {error}
        </div>
      ) : activities.length === 0 ? (
        <div className="rounded-xl border border-dashed border-zinc-800 bg-zinc-950/40 px-4 py-8 text-center text-sm text-zinc-500">
          {emptyText}
        </div>
      ) : (
        <div className="space-y-3">
          {activities.map((activity) => (
            <ActivityCard key={activity.id} activity={activity} />
          ))}
        </div>
      )}
    </section>
  );
}

function ActivityCard({ activity }: { activity: CommunityActivity }) {
  const { user } = useAuth();
  const [savingLike, setSavingLike] = useState(false);
  const likes = activity.likes || [];
  const isLiked = Boolean(user && likes.includes(user.uid));
  const Icon = activity.type === 'relapse' ? Flame : activity.type === 'milestone' ? Award : TrendingUp;

  const palette = activity.type === 'relapse'
    ? 'border-red-500/30 bg-red-500/5 text-red-300'
    : activity.type === 'milestone'
      ? 'border-amber-500/30 bg-amber-500/5 text-amber-300'
      : 'border-emerald-500/30 bg-emerald-500/5 text-emerald-300';

  const handleLike = async () => {
    if (!user) return;
    setSavingLike(true);
    try {
      await toggleActivityLike(activity.id, user.uid, isLiked);
    } finally {
      setSavingLike(false);
    }
  };

  return (
    <article className={`rounded-xl border p-4 ${palette}`}>
      <div className="flex items-start gap-3">
        {activity.userPhotoURL ? (
          <img src={activity.userPhotoURL} alt="" className="h-10 w-10 rounded-full border border-zinc-700 object-cover" referrerPolicy="no-referrer" />
        ) : (
          <div className="h-10 w-10 rounded-full border border-zinc-700 bg-zinc-950 flex items-center justify-center">
            <UserCircle className="h-6 w-6 text-zinc-500" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
            <p className="text-sm font-bold text-white">{activity.userDisplayName}</p>
            <span className="text-xs text-zinc-500">{formatTimestamp(activity.createdAt)}</span>
          </div>
          <div className="mt-2 flex items-start gap-2">
            <Icon className="mt-0.5 h-4 w-4 flex-shrink-0" />
            <div className="min-w-0 text-sm text-zinc-300">
              <ActivityText activity={activity} />
            </div>
          </div>
          {activity.details.thumbnailUrl && (
            <img
              src={activity.details.thumbnailUrl}
              alt=""
              className="mt-3 h-28 w-28 rounded-lg border border-zinc-800 object-cover"
            />
          )}
          <div className="mt-4 flex items-center gap-3 text-xs text-zinc-500">
            <button
              type="button"
              onClick={handleLike}
              disabled={savingLike}
              className={`inline-flex items-center transition-colors ${isLiked ? 'text-red-300' : 'hover:text-red-300'}`}
            >
              <Heart className={`mr-1.5 h-4 w-4 ${isLiked ? 'fill-current' : ''}`} />
              {likes.length}
            </button>
            <span className="inline-flex items-center">
              <MessageCircle className="mr-1.5 h-4 w-4" />
              {activity.commentCount || 0}
            </span>
          </div>
        </div>
      </div>
    </article>
  );
}

function ActivityText({ activity }: { activity: CommunityActivity }) {
  const details = activity.details || {};

  if (activity.type === 'relapse') {
    return (
      <p>
        logged a relapse for <span className="font-semibold text-white">{details.modelName || 'new plastic'}</span>
        {details.reason ? <span className="text-zinc-500"> · {details.reason}</span> : null}
      </p>
    );
  }

  if (activity.type === 'milestone') {
    return (
      <p>
        earned <span className="font-semibold text-white">{details.achievementTitle || 'a milestone chip'}</span>
      </p>
    );
  }

  return (
    <p>
      moved <span className="font-semibold text-white">{details.modelName || 'a model'}</span>
      {details.stageFrom && details.stageTo ? (
        <> from <span className="text-zinc-100">{details.stageFrom}</span> to <span className="text-zinc-100">{details.stageTo}</span></>
      ) : (
        <> forward on the progression tracker</>
      )}
    </p>
  );
}

function formatTimestamp(timestamp: any) {
  if (!timestamp?.toDate) return 'just now';
  return `${formatDistanceToNow(timestamp.toDate(), { addSuffix: true })}`;
}

function getMillis(timestamp: any) {
  if (!timestamp?.toDate) return 0;
  return timestamp.toDate().getTime();
}
